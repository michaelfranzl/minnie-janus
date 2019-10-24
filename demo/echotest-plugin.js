/*jshint esversion: 6 */

/*
minnie-janus - Minimal and modern JavaScript interface for the Janus WebRTC gateway

Copyright 2018 Michael Karl Franzl

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/


let properties = {
  // `name` must match the plugin name string in the C source code
  name: 'janus.plugin.echotest', 
  // `label` is just used for shorter debugging
  label: 'echotest',
  // The RTCPeerConnection
  rtcconn: null,
  vid_remote: document.createElement('video'),
  vid_local: document.createElement('video'),
};

/**
* Methods to add to or overwrite in BasePlugin
*/
let methods = {
  negotiateIce() {
    return new Promise((resolve, reject) => {
      this.rtcconn.onicecandidate = event => {
        this.sendTrickle(event.candidate || null)
        .then(() => {
          if (!event.candidate) {
            this.log.info('ICE negotiated');
            resolve();
          }
        });
      };
    });
  },
  
  /**
   * Tell the echotest plugin to forward video or not.
   * 
   * @param {bool} enabled
   */
  setVideo(enabled) {
    this.sendMessage({video: enabled});
  },
  
  /**
   * Tell the echotest plugin to forward audio or not.
   * 
   * @param {bool} enabled
   */
  setAudio(enabled) {
    this.sendMessage({audio: enabled});
  },
  
  /**
   * Tell the echotest plugin to send a REMB packet to the browser to limit bandwidth.
   * 
   * @param {integer} bitrate
   */
  setBitrate(bitrate) {
    this.sendMessage({bitrate});
  },
  
  /**
   * Receive a message from the server and interpret it.
   * 
   * This method overrides the one in BasePlugin (which does nothing).
   * 
   * The parent app is responsible for connecting the message transport to this method.
   * 
   * @param {Object} msg - The parsed JSON from the server
   */
  receive(msg) {
    // 'detached' event
    if (msg.janus == 'detached') {
      this.attached = false;
      this.log.info("now detached");
      //this._emit('detached'); // inform the parent app if useful
      return;
    }
    
    this.log.info('received message but not yet implemented', msg);
  },
  
  /**
   * Business logic for when the echotest plugin is attached server-side.
   * 
   * This method overrides the one in BasePlugin (which does nothing).
   * 
   * This sets up a bi-directional WebRTC connection which usually involves the following:
   * 
   * 1. get local media
   * 2. create and send a SDP offer
   * 3. receive a SDP answer and add it to the RTCPeerConnection
   * 4. negotiate ICE (can be in parallel to the SDP exchange)
   * 5. Play the video via the `onaddstream` event of RTCPeerConnection
   */
  _onAttached() {
    this.log.info('Asking user to share media...');
    navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true
    })
    .then(localmedia => {
      this.log.info('User shared local media. Creating offer...');
      this.rtcconn.addStream(localmedia);
      this.vid_local.srcObject = localmedia;
      this.vid_local.play();
      return this.rtcconn.createOffer({
        audio: true,
        video: true
      }); // promise returning jsep_offer
    })
    .then(jsep_offer => {
      this.log.info('SDP offer created. Setting it on rtcconn and submitting it to the server...');
      this.rtcconn.setLocalDescription(jsep_offer);
      this.sendMessage(null, jsep_offer)
        .then(({jsep: jsep_answer}) => {
          this.log.debug('received SDP answer');
          this.rtcconn.setRemoteDescription(jsep_answer);
        });
    });
    
    // Negotiate ICE in parallel
    this.negotiateIce(); // returns a Promise, but is not needed here.
  }
};


function init(opts) {
  this.vid_remote.width = 320;
  this.vid_local.width = 320;
  
  this.rtcconn = new RTCPeerConnection();
  
  this.rtcconn.onaddstream = event => {
    this.log.info("RTCPeerConnection got remote media stream. Playing.");
    this.vid_remote.srcObject = event.stream;
    this.vid_remote.play();
  };
  
  this.vid_local.controls = false;
  document.body.appendChild(this.vid_local);
  
  this.vid_remote.controls = false;
  document.body.appendChild(this.vid_remote);
}




/*
Extend BasePlugin the Stamp way. It will export a factory function (invokable with or without the `new` keyword). If you don't want to use Stamps, see other ways further below.

Read about Stamps here:

https://medium.com/@koresar/fun-with-stamps-episode-1-stamp-basics-e0627d81efe0
https://www.npmjs.com/package/@stamp/it
*/
import BasePlugin from '../src/base-plugin-stamp.js';
let factory = BasePlugin.compose({
  methods,
  properties,
  initializers: [init],
});
export default factory;




/*
If you prefer to use a factory function in your parent app (invokable without the `new` keyword) without using Stamps, here is how you would extend BasePlugin using plain-object OOP:
*/
/*
import base_plugin from '../src/base-plugin.js';
let factory = function(...args) {
  let prototype = Object.assign({}, base_plugin.properties, base_plugin.methods, methods, properties);
  let instance = Object.create(prototype);
  
  base_plugin.init.call(instance, ...args); // equivalent to super(...args)
  init.call(instance, ...args);
  
  return instance;
};
export default factory;
*/




/*
If you prefer to use the `new` keyword, here is how you would extend BasePlugin:
*/
/*
import base_plugin from '../src/base-plugin.js';

function EchotestPlugin(...args) {
  base_plugin.init.call(this, ...args);
  init.call(this, ...args);
}

Object.assign(EchotestPlugin.prototype, base_plugin.properties);
Object.assign(EchotestPlugin.prototype, base_plugin.methods);
Object.assign(EchotestPlugin.prototype, methods);
Object.assign(EchotestPlugin.prototype, properties);
export default EchotestPlugin;
*/




/*
If you prefer to use a class to extend BasePlugin:
*/
/*
import base_plugin from '../src/base-plugin.js';

function BasePlugin(...args) {
  base_plugin.init.call(this, ...args);
}

Object.assign(BasePlugin.prototype, base_plugin.properties);
Object.assign(BasePlugin.prototype, base_plugin.methods);

class EchotestPlugin extends BasePlugin {
  constructor(...args) {
    super(...args);
    init.call(this, ...args);
  }
}

Object.assign(EchotestPlugin.prototype, base_plugin.properties);
Object.assign(EchotestPlugin.prototype, base_plugin.methods);
Object.assign(EchotestPlugin.prototype, properties);
Object.assign(EchotestPlugin.prototype, methods);

export default EchotestPlugin;
*/
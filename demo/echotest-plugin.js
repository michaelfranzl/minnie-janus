/*
minnie-janus - Minimal and modern JavaScript interface for the Janus WebRTC gateway

Copyright 2018 Michael Karl Franzl

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
associated documentation files (the "Software"), to deal in the Software without restriction,
including without limitation the rights to use, copy, modify, merge, publish, distribute,
sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial
portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT
NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES
OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

import BasePlugin from '../src/base-plugin-stamp.js';

const properties = {
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
const methods = {
  async negotiateIce() {
    return new Promise((resolve) => {
      this.rtcconn.onicecandidate = async (event) => {
        await this.sendTrickle(event.candidate || null);
        if (!event.candidate) {
          this.log.info('Janus received last ICE candidate.');
          resolve();
        }
      };
    });
  },

  /**
   * Tell the echotest plugin to forward video or not.
   *
   * @param {bool} enabled
   */
  async setVideo(enabled) {
    this.sendMessage({ video: enabled });
  },

  /**
   * Tell the echotest plugin to forward audio or not.
   *
   * @param {bool} enabled
   */
  async setAudio(enabled) {
    this.sendMessage({ audio: enabled });
  },

  /**
   * Tell the echotest plugin to send a REMB packet to the browser to limit bandwidth.
   *
   * @param {integer} bitrate
   */
  async setBitrate(bitrate) {
    this.sendMessage({ bitrate });
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
    if (msg.janus === 'detached') {
      this.attached = false;
      this.log.info('now detached');
      // this._emit('detached'); // inform the parent app if useful
      return;
    }

    this.logger.info('Received message from Janus', msg);
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
  async onAttached() {
    this.negotiateIce(); // negotiate ICE in parallel. Promise resolves when ICE is negotiated.


    this.logger.info('Asking user to share media. Please wait...');
    const localmedia = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    this.logger.info('Got local user media.');

    this.rtcconn.addStream(localmedia);
    this.vid_local.srcObject = localmedia;
    this.vid_local.play();

    this.logger.info('Adding local user media to RTCPeerConnection.');
    const jsepOffer = await this.rtcconn.createOffer({
      audio: true,
      video: true,
    });
    this.logger.info('SDP offer created.');

    this.logger.info('Setting SDP offer on RTCPeerConnection');
    this.rtcconn.setLocalDescription(jsepOffer);

    this.logger.info('Getting SDP answer from Janus to our SDP offer. Please wait...');
    const { jsep: jsepAnswer } = await this.sendJsep(jsepOffer);
    this.logger.debug('Received SDP answer from Janus.');

    this.logger.debug('Setting the SDP answer on RTCPeerConnection. The `onaddstream` event will fire soon.');
    this.rtcconn.setRemoteDescription(jsepAnswer);
  },
};

function init() {
  this.vid_remote.width = 320;
  this.vid_local.width = 320;

  this.rtcconn = new RTCPeerConnection();
  this.rtcconn.onaddstream = (event) => {
    this.logger.info('RTCPeerConnection got remote media stream. Playing.');
    this.vid_remote.srcObject = event.stream;
    this.vid_remote.play();
  };

  this.vid_local.controls = true;
  this.vid_local.muted = true;
  document.body.appendChild(this.vid_local);

  this.vid_remote.controls = true;
  this.vid_remote.muted = true;
  document.body.appendChild(this.vid_remote);
}

const factory = BasePlugin.compose({
  methods,
  properties,
  initializers: [init],
});

export default factory;

/*jshint esversion: 6 */

/*
minnie-janus - Minimal and modern JavaScript interface for the Janus WebRTC gateway

Copyright 2018 Michael Karl Franzl

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/


/**
 * The base behavior of a plugin: Attach/detach and send/receive
 * messages to/from the server-side plugin.
 * 
 * This behavior is supposed to be 'subclassed', and some of the methods
 * overridden, because every janus plugin is different.
 * 
 * This is intentionally not implemented as a class or a function
 * (constructor-prototype combination) . Rather, properties, methods and an
 * initializer/constructor are exported explicitly as plain objects for maximum
 * flexibility regarding different JS ways of
 * inheriting/subclassing/extending/mixing.
 * 
 * See `/demo/echotest-plugin.js` for usage.
 * 
 * @typedef {Object} BasePlugin
 */
 

import EventEmitter from '@michaelfranzl/captain-hook';


var LOG_WARN = -1;
var LOG_ERR = -2;
var LOG_INFO = 0;
var LOG_DEBUG = 1;


var properties = {
  session: null,  // an instance of a Session (see `session.js`)
  id: null,       // on the server, this is called the 'handle'
  name: 'unset',  // the plugin name string in the C source code
  label: 'unset', // just used for shorter debugging
  attached: false,
  uptime: 0,      // seconds since attached
  interval_secondly: null,
};


var methods = {
  /**
   * Plugin-specific log method.
   * 
   * Creates scoped logging events for whoever is subscribed.
   */
  log(level, ...args) {
    this._emit('log', level, `plugin_${this.label}(${this.id})`, ...args);
  },
  
  /**
   * Attach the server-side plugin (by `this.name`) to the session.
   * 
   * The internal method `this._onAttached()` will be called.
   * 
   * The event 'attached' will be emitted additionally for potential subscribers.
   * 
   * @param {Session} - A Session instance (see `session.js`)
   * 
   * @returns {Promise} - Rejected if synchronous reply contains `janus: 'error'` or response takes too long. Resolved otherwise.
   */
  attach(session) {
    this.log(LOG_DEBUG, "attach()");
    
    this.session = session;
    
    var msg = {
      janus: "attach",
      plugin: this.name,
    };
    
    return this.session.send(msg)
    .then(response => {
      this.id = response.data.id;
      this.attached = true;
      this._onAttached();
      this._emit('attached');
      return response;
    });
  },
  
  /**
   * This 'private' method is supposed to be overriden to add plugin-specific
   * behavior.
   */
  _onAttached() {
    this.log(LOG_WARN, "_onAttached(): Handling of this event is plugin-specific. You can override the _onAttached() method with plugins-specific behavior.");
  },
  
  /**
   * This 'private' method is supposed to be overriden to add plugin-specific
   * behavior.
   */
  _onDetached() {
    this.log(LOG_WARN, "_onDetached(): Handling of this event is plugin-specific. You can override the _onDetached() method with plugins-specific behavior.");
  },
  
  /**
   * Detach this plugin from the session.
   * 
   * The internal method `this._onDetached()` will be called.
   * 
   * The event 'detached' will be emitted additionally for potential subscribers.
   * 
   * Janus will also push an event `janus: 'detached'`.
   * 
   * @returns {Promise} - Rejected if synchronous reply contains `janus: 'error'` or response takes too long. Resolved otherwise.
   */
  detach() {
    this.log(LOG_DEBUG, "detach()");
    return this.send({
      janus: "detach"
    })
    .then( () => {
      this.attached = false;
      this._onDetached();
      this._emit('detached');
      clearInterval(this.interval_secondly);
    });
  },
  
  /**
   * Send a plugin-related message to the janus core.
   * 
   * You should prefer the higher-level methods
   * `sendMessage(), sendTrickle(), attach(), detach(), hangup()`
   * 
   * @param {Object} obj - Should be JSON-serializable. Excpected to have a key
   * called 'janus' with one of the following values:
   * 'attach|detach|message|trickle|hangup'
   * @see {@link https://janus.conf.meetecho.com/docs/rest.html}
   * 
   * @returns {Promise} - Rejected if synchronous reply contains `janus: 'error'` or response takes too long. Resolved otherwise.
   **/
  send(obj) {
    this.log(LOG_DEBUG, "send()");
    return this.session.send(Object.assign({ handle_id: this.id }, obj));
  },
  
  
  /**
   * Send a message to the server-side plugin.
   * 
   * Janus will call the plugin C function `.handle_message` with the provided
   * arguments.
   * 
   * @param {Object} body - Should be JSON-serializable. Janus expects this. Will be
   * provided to the `.handle_message` C function as `json_t *message`.
   * @param {Object} [jsep] - Should be JSON-serializable. Will be provided to the
   * `.handle_message` C function as `json_t *jsep`.
   * 
   * @returns {Promise} - Rejected if synchronous reply contains `janus: 'error'` or response takes too long. Resolved otherwise.
   */
  sendMessage(body, jsep = null) {
    let msg = {janus: 'message'};
    if (body) {
      msg.body = body; // 'body' recognized key by Janus. 3rd arg in .handle_message().
    } else {
      msg.body = {}; // Janus requires a body, otherwise error by Janus
    }
    if (jsep) {
      msg.jsep = jsep; // 'jsep' recognized key by Janus. 4th arg in .handle_message().
    }
    this.log(LOG_DEBUG, "sendMessage()");
    return this.send(msg);
  },

  /**
   * Send trickle ICE candidates to the janus core, related to this plugin.
   * 
   * @param {[Object|Array|null]} candidate - Should be JSON-serializable.
   * 
   * @returns {Promise} - Rejected if synchronous reply contains `janus: 'error'` or response takes too long. Resolved otherwise.
   */
  sendTrickle(candidate) {
    this.log(LOG_DEBUG, "sendTrickle()");
    return this.send({ janus: "trickle",  candidate });
  },
  
  /**
   * Hangup the WebRTC peer connection, but keep the plugin attached.
   * 
   * @returns {Promise} - Rejected if synchronous reply contains `janus: 'error'` or response takes too long. Resolved otherwise.
   */
  hangup() {
    this.log(LOG_DEBUG, "hangup()");
    return this.send({ janus: "hangup" });
  },
  
  /**
   * Receive an asynchronous (pushed) message sent by the Janus core.
   * 
   * Such messages have a 'sender' key and usually contain
   * `janus: 'event|media|webrtcup|slowlink|hangup'`
   * 
   * The parent Session is responsible for dispatching such messages here.
   * (see session.js).
   * 
   * This method always contains plugin-specific logic and should be overridden.
   * 
   * @param {Object} msg - Object parsed from server-side JSON
   */
  receive(msg) {
    if (msg.sender.toString() != this.id) {
      log(LOG_WARN, "Received message, but it is not for this plugin instance. This is probably the mistake of the parent application using this plugin");
      return;
    }
    
    this.log(LOG_WARN, "Received message, but handling it is plugin-specific. You should override the receive(msg) method.");
  },
};


 /**
  * Constructor/initializer for this plugin.
  * 
  * We only keep track of uptime.
  */
function init(opts) {
  this.interval_secondly = setInterval(() => {
    // run every second
    this.uptime++;
  }, 1000);
}

// mix in event emitter behavior
Object.assign(methods, EventEmitter());

export default {properties, methods, init};
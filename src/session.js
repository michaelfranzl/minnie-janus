/*jshint esversion: 6 */

/*
minnie-janus - Minimal and modern JavaScript interface for the Janus WebRTC gateway

Copyright 2018 Michael Karl Franzl

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/**
 * Full implementation of a server-side Session.
 * 
 * * Create/destroy a session.
 * * Attach or detach plugins to/from a session.
 * * Send and receive session-specific messages using timeouts and Promises.
 * * Keepalive management.
 * * Scoped logging events
 * 
 * See `/demo/index.js` for usage.
 * 
 *  @typedef {Object} Session
 */


import EventEmitter from '@michaelfranzl/captain-hook';

var props = {
  id: null,      // server-side session ID
  next_tx_id: 0, // used to generate unique transaction identifier strings
  keepalive_timeout: null,
};


var deepProps = {
  txns: {},    // keep track of sent messages, used to resolve/reject Promises
  options: {}, // see initializer
  plugins: {}, // plugin instances by plugin IDs
};


var methods = {
  /**
   * Create this session on the server.
   * 
   * Will set this.id when successful.
   * 
   * @returns {Promise} - Rejected if synchronous reply contains `janus: 'error'` or response takes too long. Resolved otherwise.
   */
  create() {
    return this.send({ janus: "create" })
    .then(response => {
      this.id = response.data.id;
      return response;
    })
    .catch(err => {
      this.log.error(`Exception during creating session ${this.id}`, err);
      throw err; // re-throw
    });
  },
  
  /**
   * Destroys this session on the server, properly detaches plugins first.
   * 
   * @returns {Promise} - Rejected if synchronous reply contains `janus: 'error'` or response takes too long. Resolved otherwise.
   */
  destroy() {
    let plugin_detach_promises = Object.keys(this.plugins).map(id => {
      let plugin = this.plugins[id];
      this.log.debug(`Detaching plugin before destroying session`, plugin.name);
      return plugin.detach();
    });
    
    return Promise.all(plugin_detach_promises)
    .then(() =>  this.send({ janus: "destroy" }))
    .then(() => this._stopKeepalive())
    .catch(err => {
      this.log.error('Exception during destroying session', err);
      throw err; // re-throw
    });
  },
  
  /**
   * Attaches a plugin to this session.
   * 
   * The event 'plugin_attached' will be emitted for potential subscribers.
   * 
   * @param {BasePlugin} plugin - An instance of an (extended) BasePlugin
   * 
   * @returns {Promise} - Rejected if synchronous reply contains `janus: 'error'` or response takes too long. Resolved otherwise.
   */
  attachPlugin(plugin) {
    this.log.debug(`Attaching plugin ${plugin.name}`);
    
    plugin.on('detached', response => {
      this.log.debug(`Plugin ${plugin.name} detached. Removing reference ${plugin.id} from ${Object.keys(this.plugins)}.`);
      delete this.plugins[plugin.id];
    });
    
    return plugin.attach(this)
    .then(response => {
      
      this.log.info(`Plugin ${plugin.name} attached.`);
      this.plugins[response.data.id] = plugin;
      this._emit('plugin_attached', response);
    })
    .catch(err => {
      this.log.error(`Exception during attaching ${plugin.name}`, err);
      throw err;
    });
  },
  
  
  /**
   * Receive a message sent by the Janus core.
   * 
   * The parent application is responsible for dispatching messages here.
   * (see /demo/index.js).
   * 
   * @param {Object} msg - Object parsed from server-side JSON
   */
  receive(msg) {
    this.log.debug("Receiving message from Janus", msg);
    
    if (msg.session_id != this.id) {
      // This should never happen when parent app does its job properly.
      this.log.warn("Message not for this session instance", msg);
      return;
    }
    
    if (msg.transaction) {
      // janus: 'ack|success|error|server_info|event|media|webrtcup|slowlink|hangup'
      let txn = this.txns[msg.transaction]; // Get the original transaction
      
      if (txn) {
        // This is the first response to a transaction we have previously sent.
        // This is always a synchronous response.
        // Resolve or reject the Promise, then forget the transaction.
        clearTimeout(txn.timeout);
        delete this.txns[msg.transaction];
        if (msg.janus == 'error') {
          this.log.error(`Got error ${msg.error.code} from Janus. Will reject promise.`, msg.error.reason);
        }
        (msg.janus == 'error' ? txn.reject : txn.resolve)(msg);
        return;
      }
    }

    // This is either an ansynchronous (push) message without transaction ID,
    // or an asynchronous (push) reply to a transaction that we already have handled
    // synchronously above.
    if (msg.sender) {
      // Get the plugin instance which sent this (msg.sender == plugin.id)
      // and forward the message to the plugin.
      // let eventname = msg.janus; // 'event|webrtcup|hangup|detached|media|slowlink'
      let plugin_id = msg.sender.toString();
      let plugin = this.plugins[plugin_id];
      plugin.receive(msg);
    } else {
      this.log.error(`Could not find plugin that sent this transaction.`);
    }
  },
  
  
  /**
   * Send a message to the janus core.
   * 
   * You should prefer the higher-level methods
   * `_sendKeepalive(), create(), destroy()`
   * 
   * Will emit the 'output' signal with the JSON-serializable object. The event
   * consumer (parent app) is responsible for serializing the object and sending
   * it via the chosen transport to the Janus core.
   * 
   * @param {Object} msg - Should be JSON-serializable. Proper `session_id` and `transaction` ID on the msg will be added automatically.  @see {@link https://janus.conf.meetecho.com/docs/rest.html}
   * 
   * @returns {Promise} - Rejected if synchronous reply contains `janus: 'error'` or response takes too long. Resolved otherwise.
   **/
  send(msg) {
    if (this.id !== null) {
      // this.id is undefined in the special case when we're sending the session create message
      msg = Object.assign({ session_id: this.id }, msg);
    }
    msg = Object.assign({ transaction: (this.next_tx_id++).toString() }, msg);
    
    this.log.debug("Outgoing Janus message", msg);
    
    return new Promise((resolve, reject) => {
      let timeout = setTimeout(() => {
        delete this.txns[msg.transaction];
        reject(new Error(`Signalling message timed out ${JSON.stringify(msg)}`));
      }, this.options.timeout_ms);
      
      this.txns[msg.transaction] = {
        resolve: resolve,
        reject: reject,
        timeout: timeout,
      };
      this._emit('output', msg);
      this._resetKeepalive();
    });
  },
  
  /**
   * Various cleanup operations.
   * 
   * Call this before unreferencing an instance.
   */
  stop() {
    this.log.debug(`stop()`);
    this._stopKeepalive();
  },
  
  _sendKeepalive() {
    return this.send({ janus: "keepalive" })
    .catch(err => {
      this.log.error(`Keepalive timed out`);
      this._emit('keepalive_timout');
    });
  },
  
  _stopKeepalive() {
    this.log.debug('_stopKeepalive()');
    if (this.keepalive_timeout) {
      clearTimeout(this.keepalive_timeout);
    }
  },
  
  _resetKeepalive() {
    this._stopKeepalive();
    this.keepalive_timeout = setTimeout(() => this._sendKeepalive(), this.options.keepalive_ms);
  },
};

// mix in event emitter behavior
Object.assign(methods, EventEmitter());




function init({
  timeout_ms = 5000,
  keepalive_ms = 50000,
  log = {
    info: console.info,
    warn: console.warn,
    debug: console.debug || console.log,
    error: console.error
  }
} = {}) {
  this.log = log;
  this.options.timeout_ms = timeout_ms;
  this.options.keepalive_ms = keepalive_ms;
}


export {props, deepProps, methods, init};
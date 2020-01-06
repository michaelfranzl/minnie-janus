/* jshint esversion: 6 */

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

const props = {
  id: null, // server-side session ID
  next_transaction_id: 0, // used to generate unique transaction identifier strings
  keepalive_timeout: null,
};

const deepProps = {
  transactions: {}, // keep track of sent messages, used to resolve/reject Promises
  options: {}, // see initializer
  plugins: {}, // plugin instances by plugin IDs
};

const methods = {
  /**
   * Create this session on the server.
   *
   * Will set this.id when successful.
   *
   * @returns {Promise} - Rejected if synchronous reply contains `janus: 'error'` or response
   * takes too long. Resolved otherwise.
   */
  async create() {
    const response = await this.send({ janus: 'create' });
    this.id = response.data.id;
    return response;
  },

  /**
   * Destroys this session on the server, properly detaches plugins first.
   *
   * @returns {Promise} - Rejected if synchronous reply contains `janus: 'error'` or response
   * takes too long. Resolved otherwise.
   */
  async destroy() {
    const pluginDetachPromises = Object.entries(this.plugins).map(([, plugin]) => {
      this.logger.debug('Detaching plugin before destroying session', plugin.instance.name);
      return plugin.instance.detach();
    });

    await Promise.all(pluginDetachPromises);
    const response = await this.send({ janus: 'destroy' });
    this.stopKeepalive();

    Object.entries(this.plugins).forEach(([id, plugin]) => {
      this.logger.debug(`Removing reference to plugin ${plugin.instance.name} (${id})`);
      clearTimeout(plugin.timeout_cleanup);
      delete this.plugins[id];
      this.logger.debug(`Remaining plugins: ${Object.keys(this.plugins)}`);
    });
    return response;
  },

  /**
   * Attaches a plugin to this session.
   *
   * The event 'plugin_attached' will be emitted for potential subscribers.
   *
   * @param {BasePlugin} plugin - An instance of an (extended) BasePlugin
   *
   * @returns {Promise} - Rejected if synchronous reply contains `janus: 'error'` or response
   * takes too long. Resolved otherwise.
   */
  async attachPlugin(plugin) {
    this.logger.debug(`Attaching plugin ${plugin.name}`);
    const response = await plugin.attach(this);

    plugin.once('detached', () => {
      this.logger.debug(`Plugin ${plugin.name} detached.`);
      this.plugins[plugin.id].timeout_cleanup = setTimeout(() => {
        this.logger.debug(`Removing reference to plugin ${plugin.name} (${plugin.id})`);
        delete this.plugins[plugin.id];
        this.logger.debug(`Remaining plugins: ${Object.keys(this.plugins)}`);
      }, 30000);
    });

    this.plugins[response.data.id] = { instance: plugin, timeout_cleanup: null };
    this.logger.info(`Plugin ${plugin.name} attached.`);

    this.emit('plugin_attached', response);
    return response;
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
    this.logger.debug('Receiving message from Janus', msg);

    if (msg.session_id && msg.session_id !== this.id) {
      throw new Error('Got passed a message which is not for this session.');
    }

    if (msg.transaction) {
      // janus: 'ack|success|error|server_info|event|media|webrtcup|slowlink|hangup'
      const transaction = this.transactions[msg.transaction]; // Get the original transaction

      if (transaction) {
        // If the original outgoing message was a jsep, do not resolve the promise with this ack,
        // but with the jsep answer coming later.
        if (msg.janus === 'ack' && transaction.payload.jsep) return;

        // Resolve or reject the Promise, then forget the transaction.
        clearTimeout(transaction.timeout);
        delete this.transactions[msg.transaction];

        if (msg.janus === 'error') {
          this.logger.debug(`Got error ${msg.error.code} from Janus. \
          Will reject promise.`, msg.error.reason);
          transaction.reject(msg.error);
          return;
        }

        transaction.resolve(msg);
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
      const pluginId = msg.sender.toString();
      const plugin = this.plugins[pluginId];
      if (!plugin) throw new Error(`Could not find plugin with ID ${pluginId}`);
      plugin.instance.receive(msg);
    }
  },

  /*
   * Send a message to the janus core.
   *
   * You should prefer the higher-level methods
   * `sendKeepalive(), create(), destroy()`
   *
   * Will emit the 'output' signal with the JSON-serializable object. The event
   * consumer (parent app) is responsible for serializing the object and sending
   * it via the chosen transport to the Janus core.
   *
   * @param {Object} msg - Should be JSON-serializable. Proper `session_id` and `transaction` ID
   * on the msg will be added automatically.
   * @see {@link https://janus.conf.meetecho.com/docs/rest.html}
   *
   * @returns {Promise} - Rejected if synchronous reply contains `janus: 'error'` or response
   * takes too long. Resolved otherwise.
   */
  async send(msg) {
    this.next_transaction_id += 1;
    const transaction = this.next_transaction_id.toString();
    const payload = { ...msg, transaction };

    if (this.id) payload.session_id = this.id;

    const responsePromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        delete this.transactions[payload.transaction];
        reject(new Error(`Signalling message timed out ${JSON.stringify(payload)}`));
      }, this.options.timeoutMs);

      this.transactions[transaction] = {
        resolve, reject, timeout, payload,
      };
    });

    this.logger.debug('Outgoing Janus message', payload);
    this.emit('output', payload);
    this.resetKeepalive();

    return responsePromise;
  },

  /**
   * Various cleanup operations.
   *
   * Call this before unreferencing an instance.
   */
  stop() {
    this.logger.debug('stop()');
    this.stopKeepalive();
  },

  sendKeepalive() {
    try {
      this.send({ janus: 'keepalive' });
    } catch (err) {
      this.logger.error('Keepalive timed out');
      this.emit('keepalive_timout');
    }
  },

  stopKeepalive() {
    this.logger.debug('stopKeepalive()');
    if (this.keepalive_timeout) clearTimeout(this.keepalive_timeout);
  },

  resetKeepalive() {
    this.stopKeepalive();
    this.keepalive_timeout = setTimeout(() => this.sendKeepalive(), this.options.keepaliveMs);
  },
};

// mix in event emitter behavior
Object.assign(methods, EventEmitter({ emit_prop: 'emit' }));

function init({
  timeoutMs = 5000,
  keepaliveMs = 50000,
  logger = {
    info() {},
    warn() {},
    debug() {},
    error() {},
  },
} = {}) {
  this.logger = logger;
  this.options.timeoutMs = timeoutMs;
  this.options.keepaliveMs = keepaliveMs;
}

export {
  props, deepProps, methods, init,
};

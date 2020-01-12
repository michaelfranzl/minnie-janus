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
 * @module
 */


import EventEmitter from '@michaelfranzl/captain-hook';

/**
 * @lends Session
 */
const props = {
  /**
   * Server-side "session handle"
   * @member {String}
   * @instance
   * @readonly
   */
  id: null,

  next_transaction_id: 0,
  keepalive_timeout: null,
};

/**
 * @lends Session
 */
const deepProps = {
  transactions: {},
  options: {},
  plugins: {},
};

/**
 * @lends Session.prototype
 */
const methods = {
  /**
   * Create a session instance on the server.
   *
   * Sets {@link Session#id} when successful.
   *
   * @public
   * @returns {Promise} Response from Janus
   */
  async create() {
    const response = await this.send({ janus: 'create' });
    this.id = response.data.id;
    return response;
  },

  /**
   * Detaches all attached plugins from the server instance, then destroys the session instance on
   * the server.
   *
   * @public
   * @returns {Promise} Response from Janus
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
   * Attaches a plugin instance to this session instance.
   *
   * @public
   * @param {BasePlugin} plugin - An instance of an (extended) BasePlugin
   * @emits Session#plugin_attached
   * @listens BasePlugin#detached
   * @returns {Promise} Response from Janus
   */
  async attachPlugin(plugin) {
    this.logger.debug(`Attaching plugin ${plugin.name}`);
    const response = await plugin.attach(this);

    plugin.once('detached', () => {
      this.logger.debug(`Plugin ${plugin.name} detached.`);
      this.plugins[plugin.id].timeout_cleanup = setTimeout(() => {
        // Depending on the timing, we may receive a message for this plugin after it has been
        // detached. For this reason we need to keep a reference to this plugin for a bit.
        this.logger.debug(`Removing reference to plugin ${plugin.name} (${plugin.id})`);
        delete this.plugins[plugin.id];
        this.logger.debug(`Remaining plugins: ${Object.keys(this.plugins)}`);
      }, 30000);
    });

    this.plugins[response.data.id] = { instance: plugin, timeout_cleanup: null };
    this.logger.info(`Plugin ${plugin.name} attached.`);

    /**
     * @event Session#plugin_attached
     * @type {Object} Response from Janus to the attaching of the plugin
     */
    this.emit('plugin_attached', response);
    return response;
  },

  /**
   * Receive a message sent by Janus.
   *
   * The parent application is responsible for dispatching messages here.
   *
   * @public
   * @param {Object} msg - Object parsed from JSON sent by Janus
   * @param {String} msg.janus - One of: `ack, success, error, server_info, event, media, webrtcup,
   * slowlink, hangup`
   */
  receive(msg) {
    this.logger.debug('Receiving message from Janus', msg);

    // If there is a transaction property, then this is a reply to a message which we have sent
    // previously.
    if (msg.transaction) {
      // Get the original outgoing message, of which this is a reply to.
      const transaction = this.transactions[msg.transaction];

      if (transaction) {
        // Special case:
        // If the original outgoing message was sending JSEP data, then do not resolve the promise
        // with this 'synchronous' acknowledgement, but with the JSEP answer coming later.
        if (msg.janus === 'ack' && transaction.payload.jsep) return;

        // Resolve or reject the Promise, then forget this transaction.
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

    // This is either
    // 1. an asynchronous ('push') message without transaction identifier, OR
    // 2. an asynchronous ('push') reply to a transaction that we have already handled.
    //
    // In the first case, the `janus` property is one of `event, webrtcup, hangup, detached, media,
    // slowlink`
    if (msg.sender) {
      // Get the plugin instance which sent this (msg.sender == plugin.id)
      // and give the message to the plugin which will handle it.
      const pluginId = msg.sender.toString();
      const plugin = this.plugins[pluginId];
      if (!plugin) throw new Error(`Could not find plugin with ID ${pluginId}`);
      plugin.instance.receive(msg);
    }

    // If there is neither `sender` nor `transaction` property on the message, we cannot do anything
    // with it.
  },

  /**
   * Send a message to Janus.
   *
   * Only plugin instances use this method. You should never have a need to call this method
   * directly. Use {@link Session#sendKeepalive}, {@link Session#create} or {@link Session@destroy}
   * instead.
   *
   * @private
   * @param {Object} msg - The message object to send. Properties `session_id` and `transaction`
   * will be added automatically.
   * @see {@link https://janus.conf.meetecho.com/docs/rest.html}
   * @emits Session#output
   * @returns {Promise} Response from Janus
   */
  async send(msg) {
    this.next_transaction_id += 1; // This could probably also be made into a UUID.
    const transaction = this.next_transaction_id.toString();
    const payload = { ...msg, transaction };

    // For the session create message we won't have an ID yet.
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
    /**
     * The parent application is responsible for serializing this message object and sending it to
     * Janus.
     *
     * @event Session#output
     * @type {Object} The response from Janus.
     */
    this.emit('output', payload);
    this.resetKeepalive();

    return responsePromise;
  },

  /**
   * Cleanup. Call this before unreferencing an instance.
   *
   * @public
   */
  stop() {
    this.logger.debug('stop()');
    this.stopKeepalive();
  },

  /**
   * @private
   */
  sendKeepalive() {
    try {
      this.send({ janus: 'keepalive' });
    } catch (err) {
      this.logger.error('Keepalive timed out');
      this.emit('keepalive_timout');
    }
  },

  /**
   * @private
   */
  stopKeepalive() {
    this.logger.debug('stopKeepalive()');
    if (this.keepalive_timeout) clearTimeout(this.keepalive_timeout);
  },

  /**
   * @private
   */
  resetKeepalive() {
    this.stopKeepalive();
    this.keepalive_timeout = setTimeout(() => this.sendKeepalive(), this.options.keepaliveMs);
  },
};

Object.assign(methods, EventEmitter({ emit_prop: 'emit' }));

/**
 * @constructs Session
 * @mixes EventEmitter
 *
 * @classdesc
 * Full implementation of a server-side Session.
 *
 * - Create/destroy a session.
 * - Attach or detach plugins to/from a session.
 * - Send and receive session-specific messages using timeouts and Promises.
 * - Keepalive management.
 * - Scoped logging events
 *
 * See `/demo/index.js` for usage.
 *
 * @param {Object} [options={}]
 * @param {Integer} [options.timeoutMs] The maximum number of milliseconds to wait before giving up
 * on a response from Janus.
 * @param {Integer} [options.keepaliveMs] The interval in milliseconds between keepalive messages.
 * @param {Object} [options.logger] - The logger to use
 * @param {Function} [options.logger.info=function(){}]
 * @param {Function} [options.logger.warn=function(){}]
 * @param {Function} [options.logger.debug=function(){}]
 * @param {Function} [options.logger.error=function(){}]
 * @return {Session}
 */
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

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
 * @lends BasePlugin
 */
const properties = {
  /**
   * The plugin name string in the C source code.
   * @member {String}
   * @instance
   * @readonly
   */
  name: null,

  /**
   * The session to which this plugin is attached. An instance of {@link Session}.
   * @member {Session}
   * @instance
   * @readonly
   */
  session: null,

  /**
   * The server-side "plugin handle"
   * @member {String}
   * @instance
   * @readonly
   */
  id: null,

  /**
   * Is this plugin attached on the server?
   * @member {Boolean}
   * @instance
   * @readonly
   */
  attached: false,
};

/**
 * @lends BasePlugin.prototype
 */
const methods = {
  /**
   * Attach the server-side plugin (identified by {@link BasePlugin#name}) to the session. Meant to
   * be called only by {@link Session}.
   *
   * The method {@link BasePlugin#onAttached} will be called.
   *
   * @public
   * @param {Session} session - An instance of {@link Session}
   * @emits BasePlugin#attached
   * @returns {Promise} Rejected if synchronous reply contains `janus: 'error'` or response
   * takes too long. Resolved otherwise.
   */
  async attach(session) {
    this.logger.debug('attach()');

    this.session = session;

    const msg = {
      janus: 'attach',
      plugin: this.name,
    };

    const response = await this.session.send(msg);

    this.id = response.data.id;
    this.attached = true;
    this.onAttached();

    /** @event BasePlugin#attached */
    this.emit('attached');

    return response;
  },

  /**
   * @protected
   * @abstract
   */
  onAttached() {
    this.logger.debug('onAttached() abstract method called');
  },

  /**
   * @protected
   * @abstract
   */
  onDetached() {
    this.logger.debug('onDetached() abstract method called');
  },

  /**
   * Detach this plugin from the session. Meant to be called only from {@link Session}.
   *
   * The method {@link BasePlugin#onDetached} will be called.
   *
   * @public
   * @returns {Promise} Response from janus-gateway.
   * @emits BasePlugin#detached
   */
  async detach() {
    this.logger.debug('detach()');
    await this.send({ janus: 'detach' });

    this.attached = false;
    this.onDetached();
    /** @event BasePlugin#detached */
    this.emit('detached');
  },

  /**
   * @private
   * @param {Object} obj - Should be JSON-serializable. Expected to have a key 'janus'
   * with one of the following values: 'attach|detach|message|trickle|hangup'
   *
   * @returns {Promise} Rejected if synchronous reply contains `janus: 'error'` or response
   * takes too long. Resolved otherwise.
   *
   * @see {@link https://janus.conf.meetecho.com/docs/rest.html}
   */
  async send(obj) {
    this.logger.debug('send()');
    return this.session.send({ ...obj, handle_id: this.id });
  },

  /**
   * Send a message to the server-side plugin.
   *
   * Janus will call the plugin C function `.handle_message` with the provided
   * arguments.
   *
   * @public
   * @param {Object} body - Should be JSON-serializable. Janus expects this. Will be
   * provided to the `.handle_message` C function as `json_t *message`.
   * @param {Object} [jsep] - Should be JSON-serializable. Will be provided to the
   * `.handle_message` C function as `json_t *jsep`.
   *
   * @returns {Promise} Response from janus-gateway.
   */
  async sendMessage(body = {}, jsep) {
    const msg = {
      janus: 'message',
      body, // required. 3rd argument in the server-side .handle_message() function
    };
    if (jsep) msg.jsep = jsep; // 'jsep' is a recognized key by Janus. 4th arg in .handle_message().
    this.logger.debug('sendMessage()');
    return this.send(msg);
  },

  /**
   * Alias for `sendMessage({}, jsep)`
   *
   * @public
   * @param {Object} jsep - Should be JSON-serializable. Will be provided to the
   * `.handle_message` C function as `json_t *jsep`.
   *
   * @returns {Promise} Response from janus-gateway.
   */
  async sendJsep(jsep) {
    this.logger.debug('sendJsep()');
    return this.sendMessage({}, jsep);
  },

  /**
   * Send trickle ICE candidates to the janus core, related to this plugin.
   *
   * @public
   * @param {(Object|Array|null)} candidate Should be JSON-serializable.
   *
   * @returns {Promise} Response from janus-gateway.
   */
  async sendTrickle(candidate) {
    this.logger.debug('sendTrickle()');
    return this.send({ janus: 'trickle', candidate });
  },

  /**
   * Hangup the WebRTC peer connection, but keep the plugin attached.
   *
   * @public
   * @returns {Promise} Response from janus-gateway.
   */
  async hangup() {
    this.logger.debug('hangup()');
    return this.send({ janus: 'hangup' });
  },

  /**
   * Receive an asynchronous ('pushed') message sent by the Janus core.
   *
   * The parent Session instance is responsible for dispatching messages here. You should have no
   * need of calling this method directly.
   *
   * This method always contains plugin-specific logic and can be overridden.
   *
   * @protected
   * @abstract
   * @param {Object} msg - Object parsed from server-side JSON
   */
  async receive(msg) {
    this.logger.debug(`Abstract method 'receive' called with message ${msg}`);
  },
};

/**
 * @constructs BasePlugin
 * @mixes EventEmitter
 *
 * @classdesc
 *
 * This is a mixin which implements the base behavior of a plugin: Attach/detach and
 * send/receive messages to/from the server-side plugin.
 *
 * This is intentionally not implemented as a class or a function (constructor-prototype
 * combination). Rather, properties, methods and an initializer/constructor are exported separately
 * as plain objects for maximum flexibility regarding different JS ways of
 * inheriting/subclassing/extending/mixing.
 *
 * See /demo/echotest-plugin.js for usage.
 *
 * @param {Object} [options={}]
 * @param {Object} [options.logger] - The logger to use
 * @param {Function} [options.logger.info=function(){}]
 * @param {Function} [options.logger.warn=function(){}]
 * @param {Function} [options.logger.debug=function(){}]
 * @param {Function} [options.logger.error=function(){}]
 * @return {BasePlugin}
 */
function init({
  logger = {
    info() {},
    warn() {},
    debug() {},
    error() {},
  },
} = {}) {
  /**
   * @member {Object}
   * @property {Function} info - Called for log level 'info'
   * @property {Function} warn - Called for log level 'warn'
   * @property {Function} debug - Called for log level 'debug'
   * @property {Function} error - Called for log level 'error'
   */
  this.logger = logger;
}

Object.assign(methods, EventEmitter({ emit_prop: 'emit' }));

export default {
  properties, methods, init,
};

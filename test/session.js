/* eslint-disable prefer-arrow-callback, func-names */

import chai from 'chai';

import Session from '../src/session-stamp.js';
import BasePlugin from '../src/base-plugin-stamp.js';

import MessageReplayer from './lib/message_replayer.js';
import MessageReplayerWebsocket from './lib/message_replayer_websocket.js';

const expect = chai.expect;

describe('Session', function () {
  let session;
  let messageReplayer;

  function getParentNames(node, names = []) {
    names.unshift(node.title);
    if (node.parent.root) return names;
    return getParentNames(node.parent, names);
  }

  beforeEach(async function () {
    messageReplayer = MessageReplayer.compose(MessageReplayerWebsocket)();

    session = Session();

    messageReplayer.on('message', (msg) => session.receive(msg));
    session.on('output', (msg) => messageReplayer.send(msg));

    const testNames = getParentNames(this.currentTest);
    await messageReplayer.start(testNames);
  });

  afterEach(async function () {
    session.stop();
    await messageReplayer.stop();
  });

  describe('create', function () {
    it('sends the correct JSON payload to Janus', async function () {
      session.on('output', (msg) => {
        expect(msg.janus).to.equal('create');
      });
      await session.create();
    });

    it('returns a Promise', async function () {
      const result = session.create();
      expect(result.then).to.be.a('function');
      await result;
    });

    it('returns the Janus response object to the caller', async function () {
      const response = await session.create();
      expect(response.janus).to.equal('success');
    });

    it('sets the id on the object', async function () {
      await session.create();
      expect(session.id).to.be.a('number');
    });
  });

  describe('destroy', function () {
    beforeEach(async function () {
      await session.create();
    });

    it('sends the correct JSON payload to Janus', async function () {
      session.once('output', (msg) => {
        expect(msg.janus).to.equal('destroy');
      });
      await session.destroy();
    });

    it('returns a Promise', async function () {
      const value = session.destroy();
      expect(value.then).to.be.a('function');
      await value;
    });

    it('returns the Janus response object to the caller', async function () {
      expect((await session.destroy()).janus).to.equal('success');
    });
  });

  describe('attachPlugin', function () {
    let plugin;
    let EchotestPlugin;

    beforeEach(async function () {
      EchotestPlugin = BasePlugin.compose({
        properties: {
          name: $pluginName, // eslint-disable-line no-undef
        },
      });
      plugin = new EchotestPlugin();
      await session.create();
    });

    afterEach(async function () {
      await new Promise((resolve) => {
        setTimeout(async () => {
          await session.destroy();
          resolve();
        }, 500); // janus-gateway needs about 400 ms to send the 'detached' event
      });
    });

    context('plugin name is valid', function () {
      // eslint-disable-next-line no-undef, mocha/no-setup-in-describe
      def('pluginName', () => 'janus.plugin.echotest');

      it('sends the correct JSON payload to Janus', async function () {
        session.once('output', (msg) => {
          expect(msg.janus).to.equal('attach');
          expect(msg.plugin).to.equal('janus.plugin.echotest');
        });
        await session.attachPlugin(plugin);
      });

      it('returns a Promise', async function () {
        const value = session.attachPlugin(plugin);
        expect(value.then).to.be.a('function');
        await value;
      });

      it('returns the Janus response object to the caller', async function () {
        expect((await session.attachPlugin(plugin)).janus).to.equal('success');
      });
    });

    context('plugin name is invalid', function () {
      // eslint-disable-next-line no-undef, mocha/no-setup-in-describe
      def('pluginName', () => 'invalid_plugin_name');

      it('throws an error', async function () {
        try {
          await session.attachPlugin(plugin);
        } catch (err) {
          expect(err.code).to.equal(460);
          // eslint-disable-next-line no-undef
          expect(err.reason).to.equal(`No such plugin '${$pluginName}'`);
        }
      });
    });
  });
});

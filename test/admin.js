/* eslint-disable prefer-arrow-callback, func-names */

import chai from 'chai';

import Session from '../src/session-stamp.js';

import MessageReplayer from './lib/message_replayer.js';
import MessageReplayerWebsocket from './lib/message_replayer_websocket.js';

const expect = chai.expect;

// The main purpose of this test is to write admin information about the server to the test/tapes
// directory, so that it is automatically documented for which version of janus-gateway we are
// testing the implementation of minnie-janus.
describe('Admin API', function () {
  let session;
  let messageReplayer;

  function getParentNames(node, names = []) {
    names.unshift(node.title);
    if (node.parent.root) return names;
    return getParentNames(node.parent, names);
  }

  beforeEach(async function () {
    messageReplayer = MessageReplayer.compose(MessageReplayerWebsocket)({
      url: 'ws://localhost:7188', // admin API listens on a different port
    });

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

  it('gets info', async function () {
    const info = await session.send({ janus: 'info' });
    expect(info.janus).to.equal('server_info');
  });

  it('gets the server name', async function () {
    const info = await session.send({ janus: 'info' });
    expect(info.name).to.equal('Janus WebRTC Server');
  });
});

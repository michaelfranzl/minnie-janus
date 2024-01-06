/* eslint-disable import/extensions */

/*
minnie-janus - Minimal and modern JavaScript interface for the Janus WebRTC gateway

Copyright 2018 Michael Franzl

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

import 'webrtc-adapter';
import loglevel from 'loglevel';

import Session from '../src/session-stamp.js';
import EchotestPlugin from './echotest-plugin.js';

loglevel.enableAll();

const session = Session({
  logger: loglevel,
});
window.session = session; // for direct access in console

const websocket = new WebSocket('ws://localhost:8188', 'janus-protocol');

// Outgoing communications to Janus.
session.on('output', (msg) => websocket.send(JSON.stringify(msg)));

// Incoming communications from Janus.
websocket.addEventListener('message', (event) => session.receive(JSON.parse(event.data)));

// Create a session server-side once WebSocket is connected.
websocket.addEventListener('open', async () => {
  try {
    await session.create();
    loglevel.info(`Session with ID ${session.id} created.`);
  } catch (err) {
    loglevel.error('Error during creation of session', err);
    return;
  }

  // if EchotestPlugin is a Stamp or a factory function, then the `new` keyword is optional.
  const echotestPlugin = new EchotestPlugin({
    logger: loglevel,
  });
  window.echotestPlugin = echotestPlugin; // for direct access in console

  try {
    await session.attachPlugin(echotestPlugin);
    loglevel.info(`Echotest plugin attached with handle/ID ${echotestPlugin.id}`);
  } catch (err) {
    loglevel.error('Error during attaching of plugin', err);
  }
});

websocket.addEventListener('close', () => {
  loglevel.warn('No connection to Janus');
  session.stop();
});

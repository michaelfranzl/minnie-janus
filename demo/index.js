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

import 'webrtc-adapter';
import Session from '../src/session-stamp.js';
import EchotestPlugin from './echotest-plugin.js'; // extends base-plugin.js
import loglevel from 'loglevel';

loglevel.enableAll();

// instantiate one session
const session = Session({
  log: loglevel,
});
window.session = session; // for direct access in console

const ws = new WebSocket('ws://localhost:8188', 'janus-protocol');

// Outgoing communications to janus-gateway.
session.on('output', (msg) => ws.send(JSON.stringify(msg)));

// Incoming communications from janus-gateway.
ws.addEventListener('message', (event) => session.receive(JSON.parse(event.data)));

// Create a session server-side once WebSocket is connected.
ws.addEventListener('open', async () => {
  try {
    await session.create();
    console.log(`Session with ID ${session.id} created.`);
  } catch (err) {
    console.log('Error during creation of session', err);
    return;
  }

  const echotestPlugin = EchotestPlugin();
  window.echotest_plugin = echotestPlugin; // for direct access in console

  try {
    await session.attachPlugin(echotestPlugin);
    console.log(`Echotest plugin attached with handle/ID ${echotestPlugin.id}`);
  } catch (err) {
    console.log('Error during attaching of plugin', err);
  }
});

ws.addEventListener('close', () => {
  console.warn('janus-gateway went away');
  session.stop(); // No point in continuing sending keepalives if the server is down.
});

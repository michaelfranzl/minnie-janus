/*jshint esversion: 6 */

/*
minnie-janus - Minimal and modern JavaScript interface for the Janus WebRTC gateway

Copyright 2018 Michael Karl Franzl

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

import 'webrtc-adapter';

import Session from '../src/session-stamp.js';

import EchotestPlugin from './echotest-plugin.js'; // extends base-plugin.js


var LOG_WARN = -1;
var LOG_ERR = -2;
var LOG_INFO = 0;
var LOG_DEBUG = 1;
function log(level, ...args) {
  var levels = {
    '-1': ["LOG_WARN  "],
    '-2': ["LOG_ERR   "],
    '0':  ["LOG_INFO  "],
    '1':  ["LOG_DEBUG "],
  };
  
  if (level > 1) { return; } // Adjust logging depth

  let loglevel = levels[level.toString()][0];
  if (loglevel == 'LOG_ERR') {
    console.error(`[${loglevel}]`, ...args);
  } else if (loglevel == 'LOG_WARN') {
    console.warn(`[${loglevel}]`, ...args);
  } else {
    console.log(`[${loglevel}]`, ...args);
  }
}



// instantiate one session
let session = Session();
window.session = session; // for direct access in console

// We choose WebSockets as transport.
//let ws = new WebSocket("ws://127.0.0.1:8188", "janus-protocol"); // The browser may block unencrypted Websocket connections when the page is served via HTTPS.
let ws = new WebSocket("wss://localhost:8989", "janus-protocol");

// Outoing communications to janus-gateway.
session.on('output', msg => ws.send(JSON.stringify(msg)));

// Incoming communications from janus-gateway.
ws.addEventListener("message", event => {
  session.receive(JSON.parse(event.data));
});

// Forward log event
session.on('log', (level, session_info, ...args) => {
  log(level, session_info, ...args);
});

// Create a session server-side once WebSocket is connected.
ws.addEventListener("open", () => {
  session.create()
  .then(() => {
    log(LOG_INFO, `Session with ID ${session.id} created.`);
    
    // Attach the echotest plugin to this session
    let echotest_plugin = EchotestPlugin();
    window.echotest_plugin = echotest_plugin; // for direct access in console
    
    session.attachPlugin(echotest_plugin)
    .then(() => console.log(`Echotest plugin attached with handle/ID ${echotest_plugin.id}`));
  });
});

ws.addEventListener("close", event => {
  log(LOG_INFO, "janus-gateway went away");
  session.stop(); // No point in continuing sending keepalives if the server is down.
});
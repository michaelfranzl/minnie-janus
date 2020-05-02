# minnie-janus

![Test badge](https://github.com/michaelfranzl/minnie-janus/workflows/Test/badge.svg?branch=master)

A small, modern, general interface module written in ES8 Javascript for the [Janus WebRTC gateway
API](https://janus.conf.meetecho.com/docs/rest.html), for browsers as well as Node.js.

Inspiration came from the project [minijanus](https://github.com/mozilla/minijanus.js) (hence this
name, 'minnie-janus'), but this is a rewrite from scratch because I needed ES modules, events,
async/await syntax, better logging, and a fix of one small
[API issue](https://github.com/mozilla/minijanus.js/issues/3) in minijanus.

Provided are two behavior implementations, `Session` (see [src/session.js](src/session.js)) and
`BasePlugin` (see [src/base-plugin.js](src/base-plugin.js)), which transparently map to their
server-side equivalents.

`BasePlugin` is supposed to be extended with per-plugin logic before being attached to a `Session`
instance, because Janus plugins are more like applications with very specific behavior. See
examples below on how to extend the `BasePlugin` implementation.

Neither `Session` nor `BasePlugin` instances actually communicate with janus-gateway. The parent
application instantiating a `Session` is responsible for wiring up the transport of choice (REST
HTTP(S), (Secure) WebSockets, etc.) to the `Session.receive()` method and the `Session#output`
event.

Usage of mini-janus is best illustrated by the full demo/example implementing the 'echotest' plugin
(included in Janus' source code). It can be found in the [demo](demo) subdirectory (see also
[demo/README.md](demo/README.md) there).

The implementation has been [automatically tested](test) against the following `janus-gateway` versions:

* 0.7
* 0.8
* 0.9


## Usage

See:

1. echotest [demo](demo) contained in this repository
2. [janus-rtpforward-plugin demo](https://github.com/michaelfranzl/janus-rtpforward-plugin/tree/master/demo)

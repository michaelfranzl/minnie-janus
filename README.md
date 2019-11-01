# minnie-janus

A small, modern, general interface module written in ES8 Javascript for the [Janus WebRTC gateway
API](https://janus.conf.meetecho.com/docs/rest.html), for browsers as well as Node.js.

Inspiration came from the project [minijanus](https://github.com/mozilla/minijanus.js) (hence this
name, 'minnie-janus'), but this is a rewrite from scratch because I needed ES modules, events,
async/await syntax, better logging, and a fix of one small (API
issue)[https://github.com/mozilla/minijanus.js/issues/3] in minijanus.

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

The implementation has been manually tested and confirmed working with janus-gateway version tag
0.7.4.

Source code is documented.


## How to extend BasePlugin

The 'echotest' [demo](demo) contained in this repository extends `BasePlugin` with so-called
"Stamps", but this section gives you examples of different ways.

### Using "Stamps"

Read about "Stamps" here:

https://medium.com/@koresar/fun-with-stamps-episode-1-stamp-basics-e0627d81efe0
https://www.npmjs.com/package/@stamp/it

The following will export a factory function (invokable with or without the `new` keyword).

```javascript
import BasePlugin from '../src/base-plugin-stamp.js';

const factory = BasePlugin.compose({
  methods, // your own methods
  properties, // your own properties
  initializers: [init], // your own initializer(s)
});
export default factory;
```


### Using a factory function

If you prefer to use a factory function in your parent app (invokable without the `new` keyword),
here is how you would extend `BasePlugin` using plain-object OOP:

```javascript
import base_plugin from '../src/base-plugin.js';

let factory = function(...args) {
  let prototype = Object.assign(
    {},
    base_plugin.properties,
    base_plugin.methods,
    methods, // your own methods
    properties, // your own properties
  );
  let instance = Object.create(prototype);

  base_plugin.init.call(instance, ...args); // equivalent to super(...args)
  init.call(instance, ...args);

  return instance;
};
export default factory;
```


### Using instantiation

If you prefer to use the `new` keyword, here is how you would extend `BasePlugin`:

```javascript
import base_plugin from '../src/base-plugin.js';

function EchotestPlugin(...args) {
  base_plugin.init.call(this, ...args);
  init.call(this, ...args);
}

Object.assign(EchotestPlugin.prototype, base_plugin.properties);
Object.assign(EchotestPlugin.prototype, base_plugin.methods);
Object.assign(EchotestPlugin.prototype, methods); // your own methods
Object.assign(EchotestPlugin.prototype, properties); // your own properties

export default EchotestPlugin;
```


### Using classes

If you prefer to use a class to extend `BasePlugin`:

```javascript
import base_plugin from '../src/base-plugin.js';

function BasePlugin(...args) {
  base_plugin.init.call(this, ...args);
}

Object.assign(BasePlugin.prototype, base_plugin.properties);
Object.assign(BasePlugin.prototype, base_plugin.methods);

class EchotestPlugin extends BasePlugin {
  constructor(...args) {
    super(...args);
    init.call(this, ...args);
  }
}

Object.assign(EchotestPlugin.prototype, properties); // your own properties
Object.assign(EchotestPlugin.prototype, methods); // your own methods

export default EchotestPlugin;
```

# License

Copyright 2018, 2019 Michael Karl Franzl

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

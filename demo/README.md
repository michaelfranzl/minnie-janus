# echotest demo

A minimal example demonstrating how you can use `minnie-janus` with the `echotest` plugin shipped with
`janus-gateway`.

It will show two video elements on an otherwise empty page. On the left: the local raw audio/video
directly coming from the web cam; and on the right: the audio/video echoed back by the server.

To keep things simple, the JavaScript pendant [echotest-plugin.js](./echotest-plugin.js) of the server-side C plugin
(`janus_echotest.c`) only supports the following:

* Turn on/off video
* Turn on/off audio
* Limit the overall bitrate

However, it is trivial to add the rest of the server-side plugin features.

This demo application (see [index.js](./index.js)) will create one `Session` instance (from [../src/session.js](../src/session.js))
and one `EchotestPlugin` instance (see [echotest-plugin.js](./echotest-plugin.js)) inheriting from `BasePlugin` (from
[../src/base-plugin.js](../src/base-plugin.js)). Both instances are attached to `window` so you can directly access them in
the development console as global variables `session` and `echotestPlugin`, for example:

````javascript
echotestPlugin.enableVideo(false);
echotestPlugin.enableVideo(true);
echotestPlugin.enableAudio(false);
echotestPlugin.enableAudio(true);
echotestPlugin.setBitrate(100000); // bits/second

echotestPlugin.detach();
session.destroy();
````

## How to run this demo

Preconditions:

1. The echotest demo (browser app), as shipped with Janus, works. This is to exclude potential problems
   with `janus-gateway` itself.
2. There should be no NAT or firewall between your host and Janus so that there is no need for STUN/TURN servers.
3. The Websocket server of Janus listens at ws://localhost:8188 . If the URL is different, change
   it in `index.js`.
4. Use a fairly recent web browser.


Then install dependencies and start the web server:

```bash
npm ci
npm run dev
```

Open the URL displayed in the terminal.

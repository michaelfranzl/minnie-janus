# echotest demo

A minimal example demonstrating how you can use minnie-janus with the echotest plugin shipped with
janus-gateway.

The demo has been manually tested and confirmed working with `janus-gateway` versions 0.7, 0.8 and
0.9.

It will show two video elements on an otherwise empty page: On the left the local raw audio/video
directly coming from the webcam, and on the right the audio/video echoed back by the server.

To keep things simple, the JavaScript pendant (`echotest-plugin.js`) of the server-side C plugin
(`janus_echotest.c`) only supports the following:

* Turn on/off video
* Turn on/off audio
* Limit the overall bitrate

However, it is trivial to add the rest of the server-side plugin features.

This demo application (see `index.js`) will create one `Session` instance (from `../src/session.js`)
and one `EchotestPlugin` instance (see `echotest-plugin.js`) inheriting from `BasePlugin` (from
`../src/base-plugin.js`). Both instances are attached to `window` so you can directly access them in
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

1. There should be no NAT or firewall between your host and Janus so that there is no need for STUN/TURN servers.
2. The Websocket server of Janus listens at ws://localhost:8188 . If the URL is different, change
   it in `demo/index.js`.
3. The echotest demo (browser app) shipped with Janus works. This is to exclude potential problems
   with `janus-gateway` itself.
4. Compile and install `janus-rtpforward-plugin` (see [README.md](../README.md)).
5. Use a fairly recent web browser (current Mozilla Firefox or Google Chrome works).

In the root directory of `minnie-janus`:

```bash
npm ci
npm install -g jspm@2.0.0-beta.7
jspm install
npm install -g http-server
http-server
```

`http-server` will output a URL. Open it in your browser, e.g. `http://localhost:8080/demo/`.

Give the browser access to your audio/video media. Then, open the browser's development console to look for potential errors or warnings.

If everything works, you should see a local raw video and a remote echo of the video stream.

# echotest demo

A minimal example demonstrating how you can use minnie-janus with the echotest plugin shipped with
janus-gateway.

The implementation has been manually tested and confirmed working with janus-gateway version tag
0.7.4.

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
the development console as global variables `session` and `echotest_plugin`, for example:


````javascript
    echotest_plugin.setVideo(false);
    echotest_plugin.setVideo(true);
    echotest_plugin.setAudio(false);
    echotest_plugin.setAudio(true);
    echotest_plugin.setBitrate(100000); // kilobits/second

    echotest_plugin.uptime; // seconds since started
    echotest_plugin.detach();
    session.destroy();
````

## How to run this demo

Preconditions:

1. The echotest demo (browser app) shipped with janus-gateway works.
2. janus-gateway listens at `localhost` or somewhere in your LAN with all open UDP ports so that
   there is no need for STUN/TURN servers.
3. The websocket server of janus-gateway listens at ws://localhost:8188
2. Your browser supports ES8 Javascript and Import Maps. At the time of writing, only Chrome version
   74 has experimental support for Import Maps. Until Import Maps are enabled by default, enable
   "Experimental Web Platform features" under `chrome://flags`.

In the root directory of `minnie-janus`:

    npm install
    npm install -g jspm@2.0.0-beta.7
    jspm install
    npm install -g http-server
    http-server

`http-server` will output a URL. Open it in your browser, e.g. `http://localhost:8080/demo/`. Give
the browser access to your audio/video media. Open DevTools to inspect the console for problems.
If everything works, you should see a local raw video and a remote echo of the video stream.

## Development

`importmap.json` was generated with:

    jspm map ./demo/index.js -o demo/importmap.json --flat-scope --map-base .

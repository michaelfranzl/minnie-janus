# echotest demo

A minimal example demonstrating how you can use minnie-janus with the echotest plugin shipped with the janus-gateway.

It will show two video elements on an otherwise empty page: On the left the local raw audio/video directly coming from the webcam, and on the right the audio/video echoed back by the server.

To keep things simple, the JavaScript pendant (`/demo/echotest-plugin.js`) of the server-side C plugin (`janus_echotest.c`) only supports the following:

* Turn on/off video
* Turn on/off audio
* Cap the overall bitrate

However, it is trivial to add the rest of the server-side plugin features.

This demo application (see `/demo/index.js`) will create one Session instance (from `/src/session.js`) and one EchotestPlugin instance (see `/demo/echotest-plugin.js`) inheriting from BasePlugin (from `/src/base-plugin.js`). Both instances are attached to `window` so you can directly access them in the development console as variables `session` and `echotest_plugin`, for example:


````javascript
    echotest_plugin.setVideo(false);
    echotest_plugin.setVideo(true);
    echotest_plugin.setAudio(false);
    echotest_plugin.setAudio(true);
    echotest_plugin.setBitrate(100000); // kilobits/second. Note that FF currently can only go as low as 200000. Chrome can go much lower.
    
    echotest_plugin.uptime; // seconds since started
    echotest_plugin.detach();
    session.destroy();
````
    


## How to run this demo

First make sure that the echotest demo (browser app) shipped with janus-gateway works.

`index.html` is a [jspm](https://jspm.io/) application. **In the parent directory**, run `npm install` to install jspm, then run `jspm install` to install all dependencies, then serve the demo and open it in a browser tab with the following command:

    live-server --https=/path/to/your/live-server-conig-file.js --open=demo/index.html
    
Prerequisites:

1. Refer to the [live-server documentation](https://www.npmjs.com/package/live-server) to set up a HTTPS connection. WebRTC requires that the web page is secured via valid SSL.
2. A running `janus-gateway` with secure WebSockets (wss) configured. Configure `janus-gateway` with valid SSL certs for the wss connection. Refer to the janus-gateway documentation. This demo application will connect to `wss://localhost:8989` (see `/demo/index.js`).
3. The echotest plugin must be installed for janus-gateway.
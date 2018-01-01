SystemJS.config({
  paths: {
    "npm:": "jspm_packages/npm/",
    "minnie-janus/": "src/"
  },
  browserConfig: {
    "baseURL": "/"
  },
  devConfig: {
    "map": {
      "plugin-babel": "npm:systemjs-plugin-babel@0.0.25"
    }
  },
  transpiler: "plugin-babel",
  packages: {
    "minnie-janus": {
      "main": "minnie-janus.js",
      "meta": {
        "*.js": {
          "loader": "plugin-babel"
        }
      }
    }
  }
});

SystemJS.config({
  packageConfigPaths: [
    "npm:@*/*.json",
    "npm:*.json"
  ],
  map: {
    "@michaelfranzl/captain-hook": "npm:@michaelfranzl/captain-hook@1.0.2",
    "@stamp/it": "npm:@stamp/it@1.0.1",
    "assert": "npm:jspm-nodelibs-assert@0.2.1",
    "fs": "npm:jspm-nodelibs-fs@0.2.1",
    "os": "npm:jspm-nodelibs-os@0.2.2",
    "process": "npm:jspm-nodelibs-process@0.2.1",
    "webrtc-adapter": "npm:webrtc-adapter@6.0.3"
  },
  packages: {
    "npm:@stamp/it@1.0.1": {
      "map": {
        "@stamp/compose": "npm:@stamp/compose@1.0.1",
        "@stamp/shortcut": "npm:@stamp/shortcut@1.0.1",
        "@stamp/is": "npm:@stamp/is@0.1.2",
        "@stamp/core": "npm:@stamp/core@1.0.0"
      }
    },
    "npm:@stamp/compose@1.0.1": {
      "map": {
        "@stamp/is": "npm:@stamp/is@0.1.2",
        "@stamp/core": "npm:@stamp/core@1.0.0"
      }
    },
    "npm:@stamp/shortcut@1.0.1": {
      "map": {
        "@stamp/compose": "npm:@stamp/compose@1.0.1"
      }
    },
    "npm:@stamp/core@1.0.0": {
      "map": {
        "@stamp/is": "npm:@stamp/is@0.1.2"
      }
    },
    "npm:webrtc-adapter@6.0.3": {
      "map": {
        "rtcpeerconnection-shim": "npm:rtcpeerconnection-shim@1.2.4",
        "sdp": "npm:sdp@2.5.0"
      }
    },
    "npm:rtcpeerconnection-shim@1.2.4": {
      "map": {
        "sdp": "npm:sdp@2.5.0"
      }
    },
    "npm:jspm-nodelibs-os@0.2.2": {
      "map": {
        "os-browserify": "npm:os-browserify@0.3.0"
      }
    }
  }
});

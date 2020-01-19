import WebSocket from 'ws';

export default {
  properties: {
    url: 'ws://localhost:8188',
    protocol: 'janus-protocol',
  },

  methods: {
    async channelStart() {
      return new Promise((resolve, reject) => {
        this.ws = new WebSocket(this.url, this.protocol);
        this.ws.on('open', resolve);
        this.ws.on('error', reject);
        this.ws.on('message', (message) => this.recordMessage(message));
      });
    },

    async channelStop() {
      return new Promise((resolve) => {
        this.ws.on('close', resolve);
        this.ws.close();
      });
    },

    channelSend(message) {
      this.ws.send(message);
    },
  },
};

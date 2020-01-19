import slugify from 'slugify';
import fs from 'fs';
import EventEmitter from '@michaelfranzl/captain-hook';
import stampit from '@stamp/it';

const MessageReplayer = {
  properties: {
    tapePosition: 0,
  },
  methods: {
    /**
     * @public
     * @async
     * @return {Promise} Resolves when messages can be sent
     */
    async start(testNames) {
      const directoryNames = testNames.slice(0, -1);
      const directoryNamesSlugs = directoryNames.map((dir) => slugify(dir));
      const directoryPath = directoryNamesSlugs.join('/');
      fs.mkdirSync(`test/tapes/${directoryPath}`, { recursive: true });

      const tapeFilename = testNames.slice(-1)[0];
      const tapeFilenameSlug = slugify(tapeFilename);
      this.tapeFilepath = `test/tapes/${directoryPath}/${tapeFilenameSlug}.json`;

      try {
        this.setupRecording();
        return await this.channelStart();
      } catch (e) {
        this.setupReplaying();
        return Promise.resolve();
      }
    },

    /**
     * @public
     * @async
     */
    async stop() {
      fs.writeFileSync(this.tapeFilepath, JSON.stringify(this.tape, null, 2));
      if (this.replay) return Promise.resolve();
      return this.channelStop();
    },

    /**
     * @public
     * @async
     */
    send(payload) {
      if (this.replay) {
        this.tapePosition += 1; // skip previously recorded outgoing message

        // Replay previously recorded incoming message(s)
        while (this.tape[this.tapePosition] && this.tape[this.tapePosition].incoming) {
          this.emit('message', this.tape[this.tapePosition].payload);
          this.tapePosition += 1;
        }
      } else {
        this.tape.push({ incoming: false, payload });
        this.channelSend(JSON.stringify(payload));
      }
    },

    /** @private */
    recordMessage(json) {
      const payload = JSON.parse(json);
      this.tape.push({ incoming: true, payload });
      this.emit('message', payload);
    },

    /** @private */
    setupRecording() {
      this.replay = false;
      this.tape = [];
    },

    /** @private */
    setupReplaying() {
      if (!fs.existsSync(this.tapeFilepath)) {
        throw new Error(`Tape file ${this.tapeFilepath} not found.`);
      }
      this.tape = JSON.parse(fs.readFileSync(this.tapeFilepath));
      this.replay = true;
    },

    /**
     * @abstract
     * @async
     * @return {Promise} Resolved when the communication channel is started
     */
    channelStart() { throw new Error('Abstract method called'); },

    /**
     * @abstract
     * @async
     * @return {Promise}
     */
    channelStop() { throw new Error('Abstract method called'); },

    /**
     * @abstract
     */
    channelSend() { throw new Error('Abstract method called'); },
  },
};

export default stampit(MessageReplayer).compose({ methods: EventEmitter({ emit_prop: 'emit' }) });

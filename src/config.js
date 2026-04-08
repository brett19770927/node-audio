const naudiodon = require('naudiodon');
module.exports = {
	getAudioDeviceId: function () {
    return parseInt(process.env.AUDIO_DEVICE_ID) ||
      naudiodon.getDevices().find( it => it.name === 'default').id;
  },
	getPort: function () {
    return parseInt(process.env.AUDIO_PORT) || 9876;
  },
	getSoundsPath: function () {
    return process.env.AUDIO_SOUNDS_PATH || "/home/brett/projects/node-audio/sound-icons";
  },
}

const portAudio = require('naudiodon');

function play(soundData, deviceId) {
    const ao = new portAudio.AudioIO({
        outOptions: {
            channelCount: soundData.channels,
            sampleFormat: portAudio.SampleFormat16Bit,
            sampleRate: soundData.sampleRate,
            deviceId: deviceId,
            closeOnError: true
        }
    });

    ao.on('error', (err) => console.error('AudioIO error:', err));

    ao.start();

    ao.write(soundData.pcmData, (err) => {
        if (err) console.error('Error writing audio:', err);
    });
}

module.exports = { play };

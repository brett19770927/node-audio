jest.mock('naudiodon', () => {
    const mockStream = {
        write: jest.fn((data, cb) => cb && cb(null)),
        start: jest.fn(),
        on: jest.fn(),

    };
    const AudioIO = jest.fn(() => mockStream);
    AudioIO._mockStream = mockStream;
    return { AudioIO, SampleFormat16Bit: 16 };
});

const { play } = require('./playSound');
const portAudio = require('naudiodon');

const soundData = {
    pcmData: Buffer.from([0x00, 0x01, 0x02, 0x03]),
    sampleRate: 48000,
    channels: 2,
};

beforeEach(() => {
    jest.clearAllMocks();
});

test('creates AudioIO with correct output options', () => {
    play(soundData, 11);
    expect(portAudio.AudioIO).toHaveBeenCalledWith({
        outOptions: {
            channelCount: soundData.channels,
            sampleFormat: 16,
            sampleRate: soundData.sampleRate,
            deviceId: 11,
            closeOnError: true,
        }
    });
});

test('starts the audio stream', () => {
    play(soundData, 11);
    expect(portAudio.AudioIO._mockStream.start).toHaveBeenCalled();
});

test('writes pcmData to the stream', () => {
    play(soundData, 11);
    expect(portAudio.AudioIO._mockStream.write).toHaveBeenCalledWith(soundData.pcmData, expect.any(Function));
});

test('registers an error handler', () => {
    play(soundData, 11);
    expect(portAudio.AudioIO._mockStream.on).toHaveBeenCalledWith('error', expect.any(Function));
});

test('passes the deviceId to AudioIO', () => {
    play(soundData, 5);
    expect(portAudio.AudioIO).toHaveBeenCalledWith(
        expect.objectContaining({
            outOptions: expect.objectContaining({ deviceId: 5 })
        })
    );
});


test('logs error when write fails', () => {
    const writeError = new Error('write failed');
    portAudio.AudioIO._mockStream.write.mockImplementationOnce((data, cb) => cb(writeError));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    play(soundData, 11);
    expect(consoleSpy).toHaveBeenCalledWith('Error writing audio:', writeError);
    consoleSpy.mockRestore();
});

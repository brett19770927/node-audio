jest.mock('naudiodon', () => ({
    getDevices: jest.fn(() => [
        { id: 3, name: 'some other device' },
        { id: 7, name: 'default' },
    ])
}));

beforeEach(() => {
    jest.resetModules();
    delete process.env.AUDIO_DEVICE_ID;
    delete process.env.AUDIO_PORT;
    delete process.env.AUDIO_SOUNDS_PATH;
    delete process.env.AUDIO_MAX_BUFFER_SIZE;
});

describe('getAudioDeviceId', () => {
    test('returns AUDIO_DEVICE_ID env var as integer', () => {
        process.env.AUDIO_DEVICE_ID = '5';
        const { getAudioDeviceId } = require('./config');
        expect(getAudioDeviceId()).toBe(5);
    });

    test('falls back to naudiodon device with name "default"', () => {
        const { getAudioDeviceId } = require('./config');
        expect(getAudioDeviceId()).toBe(7);
    });
});

describe('getPort', () => {
    test('returns AUDIO_PORT env var as integer', () => {
        process.env.AUDIO_PORT = '3000';
        const { getPort } = require('./config');
        expect(getPort()).toBe(3000);
    });

    test('defaults to 9876', () => {
        const { getPort } = require('./config');
        expect(getPort()).toBe(9876);
    });
});

describe('getMaxBufferSize', () => {
    test('returns AUDIO_MAX_BUFFER_SIZE env var as integer', () => {
        process.env.AUDIO_MAX_BUFFER_SIZE = '8192';
        const { getMaxBufferSize } = require('./config');
        expect(getMaxBufferSize()).toBe(8192);
    });

    test('defaults to 204800 (200KB)', () => {
        const { getMaxBufferSize } = require('./config');
        expect(getMaxBufferSize()).toBe(200 * 1024);
    });
});

describe('getSoundsPath', () => {
    test('returns AUDIO_SOUNDS_PATH env var', () => {
        process.env.AUDIO_SOUNDS_PATH = '/custom/sounds';
        const { getSoundsPath } = require('./config');
        expect(getSoundsPath()).toBe('/custom/sounds');
    });

    test('defaults to hardcoded path', () => {
        const { getSoundsPath } = require('./config');
        expect(getSoundsPath()).toBe('/home/brett/projects/node-audio/sound-icons');
    });
});

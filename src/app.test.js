const DEFAULT_SOUNDS_PATH = '/home/brett/projects/node-audio/sound-icons';
const DEFAULT_DEVICE_ID = 99;
const DEFAULT_PORT = 9876;

beforeEach(() => {
    jest.resetModules();
});

async function loadApp(configOverrides = {}) {
    const mockConfig = {
        getAudioDeviceId: jest.fn(() => DEFAULT_DEVICE_ID),
        getPort: jest.fn(() => DEFAULT_PORT),
        getSoundsPath: jest.fn(() => DEFAULT_SOUNDS_PATH),
        ...configOverrides,
    };

    const mockSoundIconMap = new Map([['click', { pcmData: Buffer.alloc(4), sampleRate: 48000, channels: 2 }]]);
    const mockLoadSoundIcons = jest.fn().mockResolvedValue(mockSoundIconMap);
    const mockPlay = jest.fn();
    const mockSetupRoutes = jest.fn().mockReturnValue({});
    const mockListen = jest.fn();
    const mockUse = jest.fn();

    jest.doMock('./config', () => mockConfig);
    jest.doMock('./loadSoundIcons', () => ({ loadSoundIcons: mockLoadSoundIcons }));
    jest.doMock('./playSound', () => ({ play: mockPlay }));
    jest.doMock('./routeSetup', () => ({ setupRoutes: mockSetupRoutes }));
    jest.doMock('morgan', () => () => (req, res, next) => next());
    jest.doMock('express', () => {
        const app = { use: mockUse, listen: mockListen };
        const express = jest.fn(() => app);
        express.json = jest.fn();
        express.urlencoded = jest.fn();
        express.Router = jest.fn(() => ({}));
        return express;
    });

    require('./app');
    await new Promise(resolve => setImmediate(resolve));

    return { mockConfig, mockLoadSoundIcons, mockPlay, mockSetupRoutes, mockListen, mockUse, mockSoundIconMap };
}

test('calls loadSoundIcons with sounds path from config', async () => {
    const { mockLoadSoundIcons } = await loadApp();
    expect(mockLoadSoundIcons).toHaveBeenCalledWith(DEFAULT_SOUNDS_PATH);
});

test('calls loadSoundIcons with custom sounds path', async () => {
    const customPath = '/custom/sounds';
    const { mockLoadSoundIcons } = await loadApp({ getSoundsPath: jest.fn(() => customPath) });
    expect(mockLoadSoundIcons).toHaveBeenCalledWith(customPath);
});

test('calls setupRoutes with resolved soundIconMap and play', async () => {
    const { mockSetupRoutes, mockSoundIconMap, mockPlay } = await loadApp();
    expect(mockSetupRoutes).toHaveBeenCalledWith(expect.anything(), mockSoundIconMap, mockPlay, expect.anything());
});

test('calls setupRoutes with device ID from config', async () => {
    const { mockSetupRoutes } = await loadApp();
    expect(mockSetupRoutes).toHaveBeenCalledWith(expect.anything(), expect.anything(), expect.anything(), DEFAULT_DEVICE_ID);
});

test('calls setupRoutes with custom device ID', async () => {
    const { mockSetupRoutes } = await loadApp({ getAudioDeviceId: jest.fn(() => 5) });
    expect(mockSetupRoutes).toHaveBeenCalledWith(expect.anything(), expect.anything(), expect.anything(), 5);
});

test('listens on port from config', async () => {
    const { mockListen } = await loadApp();
    expect(mockListen.mock.calls[0][0]).toBe(DEFAULT_PORT);
});

test('listens on custom port', async () => {
    const { mockListen } = await loadApp({ getPort: jest.fn(() => 3000) });
    expect(mockListen.mock.calls[0][0]).toBe(3000);
});

test('exits with error if loadSoundIcons fails', async () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    jest.resetModules();
    const mockError = new Error('bad path');
    jest.doMock('./config', () => ({
        getAudioDeviceId: jest.fn(() => DEFAULT_DEVICE_ID),
        getPort: jest.fn(() => DEFAULT_PORT),
        getSoundsPath: jest.fn(() => DEFAULT_SOUNDS_PATH),
    }));
    jest.doMock('./loadSoundIcons', () => ({ loadSoundIcons: jest.fn().mockRejectedValue(mockError) }));
    jest.doMock('./playSound', () => ({ play: jest.fn() }));
    jest.doMock('./routeSetup', () => ({ setupRoutes: jest.fn() }));
    jest.doMock('morgan', () => () => (req, res, next) => next());
    jest.doMock('express', () => {
        const app = { use: jest.fn(), listen: jest.fn() };
        const express = jest.fn(() => app);
        express.json = jest.fn();
        express.urlencoded = jest.fn();
        express.Router = jest.fn(() => ({}));
        return express;
    });

    require('./app');
    await new Promise(resolve => setImmediate(resolve));

    expect(consoleSpy).toHaveBeenCalledWith('Failed to load sound icons:', mockError);
    expect(exitSpy).toHaveBeenCalledWith(1);

    exitSpy.mockRestore();
    consoleSpy.mockRestore();
});

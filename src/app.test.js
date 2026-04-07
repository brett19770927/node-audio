const DEFAULT_SOUNDS_PATH = '/home/brett/projects/node-audio/sound-icons';

beforeEach(() => {
    jest.resetModules();
    delete process.env.AUDIO_PORT;
    delete process.env.AUDIO_DEVICE_ID;
    delete process.env.AUDIO_SOUNDS_PATH;
});

async function loadApp(env = {}) {
    Object.assign(process.env, env);

    const mockSoundIconMap = new Map([['click', { pcmData: Buffer.alloc(4), sampleRate: 48000, channels: 2 }]]);
    const mockLoadSoundIcons = jest.fn().mockResolvedValue(mockSoundIconMap);
    const mockPlay = jest.fn();
    const mockSetupRoutes = jest.fn().mockReturnValue({});
    const mockListen = jest.fn();
    const mockUse = jest.fn();

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

    return { mockLoadSoundIcons, mockPlay, mockSetupRoutes, mockListen, mockUse, mockSoundIconMap };
}

test('calls loadSoundIcons with default sounds path', async () => {
    const { mockLoadSoundIcons } = await loadApp();
    expect(mockLoadSoundIcons).toHaveBeenCalledWith(DEFAULT_SOUNDS_PATH);
});

test('calls loadSoundIcons with AUDIO_SOUNDS_PATH env var', async () => {
    const { mockLoadSoundIcons } = await loadApp({ AUDIO_SOUNDS_PATH: '/custom/sounds' });
    expect(mockLoadSoundIcons).toHaveBeenCalledWith('/custom/sounds');
});

test('calls setupRoutes with resolved soundIconMap and play', async () => {
    const { mockSetupRoutes, mockSoundIconMap, mockPlay } = await loadApp();
    expect(mockSetupRoutes).toHaveBeenCalledWith(expect.anything(), mockSoundIconMap, mockPlay, expect.anything());
});

test('calls setupRoutes with default device ID', async () => {
    const { mockSetupRoutes } = await loadApp();
    expect(mockSetupRoutes).toHaveBeenCalledWith(expect.anything(), expect.anything(), expect.anything(), 11);
});

test('calls setupRoutes with AUDIO_DEVICE_ID env var', async () => {
    const { mockSetupRoutes } = await loadApp({ AUDIO_DEVICE_ID: '5' });
    expect(mockSetupRoutes).toHaveBeenCalledWith(expect.anything(), expect.anything(), expect.anything(), 5);
});

test('listens on default port', async () => {
    const { mockListen } = await loadApp();
    expect(mockListen.mock.calls[0][0]).toBe(9876);
});

test('listens on AUDIO_PORT env var', async () => {
    const { mockListen } = await loadApp({ AUDIO_PORT: '3000' });
    expect(mockListen.mock.calls[0][0]).toBe(3000);
});

test('exits with error if loadSoundIcons fails', async () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    jest.resetModules();
    const mockError = new Error('bad path');
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

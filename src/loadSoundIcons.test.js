const path = require('path');
const fs = require('fs');
const os = require('os');
const { loadSoundIcons, getWavFiles, getSoundIconName, getSoundData } = require('./loadSoundIcons');

const SOUND_ICONS_DIR = path.join(__dirname, '../sound-icons');
const REAL_WAV = path.join(SOUND_ICONS_DIR, 'click.wav');

describe('getSoundIconName', () => {
    test('strips path and .wav extension', () => {
        expect(getSoundIconName('./sound-icons/click.wav')).toBe('click');
    });

    test('strips nested path', () => {
        expect(getSoundIconName('/some/deep/path/alert.wav')).toBe('alert');
    });

    test('strips only .wav extension', () => {
        expect(getSoundIconName('./sound-icons/ding.wav')).toBe('ding');
    });
});

describe('getSoundData', () => {
    test('returns pcmData as a Buffer', () => {
        const result = getSoundData(REAL_WAV);
        expect(Buffer.isBuffer(result.pcmData)).toBe(true);
    });

    test('returns a numeric sampleRate', () => {
        const result = getSoundData(REAL_WAV);
        expect(typeof result.sampleRate).toBe('number');
        expect(result.sampleRate).toBeGreaterThan(0);
    });

    test('returns a numeric channels value', () => {
        const result = getSoundData(REAL_WAV);
        expect(typeof result.channels).toBe('number');
        expect(result.channels).toBeGreaterThan(0);
    });

    test('normalises to 16-bit PCM (2 bytes per sample per channel)', () => {
        const result = getSoundData(REAL_WAV);
        expect(result.pcmData.length % (result.channels * 2)).toBe(0);
    });
});

describe('getWavFiles', () => {
    let tmpDir;

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sound-test-'));
    });

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true });
    });

    test('returns only WAV files', async () => {
        fs.copyFileSync(REAL_WAV, path.join(tmpDir, 'click.wav'));
        fs.writeFileSync(path.join(tmpDir, 'readme.txt'), 'not a wav');

        const files = await getWavFiles(tmpDir);
        expect(files).toHaveLength(1);
        expect(files[0]).toMatch(/click\.wav$/);
    });

    test('returns empty array when directory has no WAV files', async () => {
        fs.writeFileSync(path.join(tmpDir, 'readme.txt'), 'not a wav');
        const files = await getWavFiles(tmpDir);
        expect(files).toEqual([]);
    });

    test('returns empty array for empty directory', async () => {
        const files = await getWavFiles(tmpDir);
        expect(files).toEqual([]);
    });

    test('ignores subdirectories', async () => {
        fs.mkdirSync(path.join(tmpDir, 'subdir'));
        fs.copyFileSync(REAL_WAV, path.join(tmpDir, 'click.wav'));
        const files = await getWavFiles(tmpDir);
        expect(files).toHaveLength(1);
    });
});

describe('loadSoundIcons', () => {
    let tmpDir;

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sound-test-'));
    });

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true });
    });

    test('returns a Map', async () => {
        fs.copyFileSync(REAL_WAV, path.join(tmpDir, 'click.wav'));
        const result = await loadSoundIcons(tmpDir);
        expect(result).toBeInstanceOf(Map);
    });

    test('keys are icon names without path or extension', async () => {
        fs.copyFileSync(REAL_WAV, path.join(tmpDir, 'click.wav'));
        const result = await loadSoundIcons(tmpDir);
        expect(result.has('click')).toBe(true);
    });

    test('values contain pcmData, sampleRate and channels', async () => {
        fs.copyFileSync(REAL_WAV, path.join(tmpDir, 'click.wav'));
        const result = await loadSoundIcons(tmpDir);
        const data = result.get('click');
        expect(data).toHaveProperty('pcmData');
        expect(data).toHaveProperty('sampleRate');
        expect(data).toHaveProperty('channels');
    });

    test('non-WAV files are excluded from the Map', async () => {
        fs.copyFileSync(REAL_WAV, path.join(tmpDir, 'click.wav'));
        fs.writeFileSync(path.join(tmpDir, 'readme.txt'), 'not a wav');
        const result = await loadSoundIcons(tmpDir);
        expect(result.has('readme')).toBe(false);
        expect(result.size).toBe(1);
    });

    test('returns empty Map for directory with no WAV files', async () => {
        const result = await loadSoundIcons(tmpDir);
        expect(result.size).toBe(0);
    });
});

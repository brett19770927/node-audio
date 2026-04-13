const path = require('path');
const fs = require('fs');
const os = require('os');
const { WaveFile } = require('wavefile');
const { loadSoundIcons, getWavFiles, getSoundIconName, getSoundData } = require('./loadSoundIcons');

function writeWavFile(filePath, numSamples, sampleRate = 8000) {
    const wav = new WaveFile();
    wav.fromScratch(1, sampleRate, '16', new Int16Array(numSamples).fill(0));
    fs.writeFileSync(filePath, Buffer.from(wav.toBuffer()));
}

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
    let tmpDir;
    let smallWav;

    beforeAll(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sound-test-'));
        smallWav = path.join(tmpDir, 'small.wav');
        writeWavFile(smallWav, 100);
    });

    afterAll(() => {
        fs.rmSync(tmpDir, { recursive: true });
    });

    test('returns pcmData as a Buffer', () => {
        const result = getSoundData(smallWav);
        expect(Buffer.isBuffer(result.pcmData)).toBe(true);
    });

    test('returns a numeric sampleRate', () => {
        const result = getSoundData(smallWav);
        expect(typeof result.sampleRate).toBe('number');
        expect(result.sampleRate).toBeGreaterThan(0);
    });

    test('returns a numeric channels value', () => {
        const result = getSoundData(smallWav);
        expect(typeof result.channels).toBe('number');
        expect(result.channels).toBeGreaterThan(0);
    });

    test('normalises to 16-bit PCM (2 bytes per sample per channel)', () => {
        const result = getSoundData(smallWav);
        expect(result.pcmData.length % (result.channels * 2)).toBe(0);
    });

    test('returns null for a non-existent file', () => {
        expect(getSoundData('/nonexistent/path/sound.wav')).toBeNull();
    });
});

describe('getSoundData - buffer size limit', () => {
    let tmpDir;

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sound-test-'));
        process.env.AUDIO_MAX_BUFFER_SIZE = '500';
    });

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true });
        delete process.env.AUDIO_MAX_BUFFER_SIZE;
    });

    test('returns null when PCM buffer exceeds the configured limit', () => {
        const filePath = path.join(tmpDir, 'large.wav');
        writeWavFile(filePath, 300); // 300 * 2 bytes = 600 > 500
        expect(getSoundData(filePath)).toBeNull();
    });

    test('returns valid data for a WAV within the configured limit', () => {
        const filePath = path.join(tmpDir, 'small.wav');
        writeWavFile(filePath, 100); // 100 * 2 bytes = 200 < 500
        const result = getSoundData(filePath);
        expect(result).not.toBeNull();
        expect(Buffer.isBuffer(result.pcmData)).toBe(true);
        expect(result.pcmData.length).toBeLessThanOrEqual(500);
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
        writeWavFile(path.join(tmpDir, 'click.wav'), 100);
        const result = await loadSoundIcons(tmpDir);
        expect(result).toBeInstanceOf(Map);
    });

    test('keys are icon names without path or extension', async () => {
        writeWavFile(path.join(tmpDir, 'click.wav'), 100);
        const result = await loadSoundIcons(tmpDir);
        expect(result.has('click')).toBe(true);
    });

    test('values contain pcmData, sampleRate and channels', async () => {
        writeWavFile(path.join(tmpDir, 'click.wav'), 100);
        const result = await loadSoundIcons(tmpDir);
        const data = result.get('click');
        expect(data).toHaveProperty('pcmData');
        expect(data).toHaveProperty('sampleRate');
        expect(data).toHaveProperty('channels');
    });

    test('non-WAV files are excluded from the Map', async () => {
        writeWavFile(path.join(tmpDir, 'click.wav'), 100);
        fs.writeFileSync(path.join(tmpDir, 'readme.txt'), 'not a wav');
        const result = await loadSoundIcons(tmpDir);
        expect(result.has('readme')).toBe(false);
        expect(result.size).toBe(1);
    });

    test('returns empty Map for directory with no WAV files', async () => {
        const result = await loadSoundIcons(tmpDir);
        expect(result.size).toBe(0);
    });

    test('excludes sound icons whose PCM buffer exceeds the configured limit', async () => {
        process.env.AUDIO_MAX_BUFFER_SIZE = '500';
        writeWavFile(path.join(tmpDir, 'large.wav'), 300); // 600 bytes > 500
        const result = await loadSoundIcons(tmpDir);
        expect(result.size).toBe(0);
        delete process.env.AUDIO_MAX_BUFFER_SIZE;
    });

    test('excludes oversized files while keeping valid ones', async () => {
        process.env.AUDIO_MAX_BUFFER_SIZE = '500';
        writeWavFile(path.join(tmpDir, 'large.wav'), 300); // 600 bytes > 500
        writeWavFile(path.join(tmpDir, 'small.wav'), 100); // 200 bytes < 500
        const result = await loadSoundIcons(tmpDir);
        delete process.env.AUDIO_MAX_BUFFER_SIZE;
        expect(result.size).toBe(1);
        expect(result.has('small')).toBe(true);
        expect(result.has('large')).toBe(false);
    });
});

const fs = require('fs');
const { WaveFile } = require('wavefile');
const { getMaxBufferSize } = require('./config');

async function loadSoundIcons(pathToSoundIcons)  {
  return new Map((await getWavFiles(pathToSoundIcons))
    .map( it => [
			  getSoundIconName(it),
			  getSoundData(it)
      ]
		)
    .filter( ([, data]) => data != null));
}

function getSoundIconName(filename)  {
	return filename.replaceAll(/^.*\//g, '').replaceAll(/\.wav$/g, '');
}

function getSoundData(filename)  {
    try {
        return mapWavData(new WaveFile(fs.readFileSync(filename)));
    } catch(e) {
        console.log(e);
        return null;
    }
}

const MAX_BUFFER_SIZE = 200 * 1024;

function mapWavData(wav)  {
  wav.toBitDepth("16");

  const pcmData = Buffer.from(wav.data.samples);
  const maxBufferSize = getMaxBufferSize();
  if (pcmData.length > maxBufferSize) {
    throw new Error(`PCM buffer size ${pcmData.length} exceeds maximum allowed size of ${maxBufferSize} bytes`);
  }

  return {
    pcmData,
    sampleRate: wav.fmt.sampleRate,
    channels: wav.fmt.numChannels,
  };
}

async function getWavFiles(pathToSoundIcons)  {

  return (await Promise.all(
        fs.readdirSync(pathToSoundIcons, { withFileTypes: true })
          .filter( it => it.isFile())
          .map( it => `${pathToSoundIcons}/${it.name}`)
          .map(async it => ({ path: it, isWav: await isWavFile(it) }))))
    .filter( it => it.isWav).map( it => it.path);
}

async function isWavFile(filename) {
  return (await (await import('file-type')).fileTypeFromFile(filename))?.mime === 'audio/wav';
}

module.exports = { loadSoundIcons, getWavFiles, getSoundIconName, getSoundData };

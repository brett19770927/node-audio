const fs = require('fs');
const { WaveFile } = require('wavefile');

async function loadSoundIcons(pathToSoundIcons)  {
  return new Map((await getWavFiles(pathToSoundIcons))
    .map( it => [
			  getSoundIconName(it),
			  getSoundData(it)
      ]
		));
}

function getSoundIconName(filename)  {
	return filename.replaceAll(/^.*\//g, '').replaceAll(/\.wav$/g, '');
}

function getSoundData(filename)  {
    return mapWavData(new WaveFile(fs.readFileSync(filename)));
}

function mapWavData(wav)  {
  wav.toBitDepth("16");

  return {
    pcmData: Buffer.from(wav.data.samples),
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

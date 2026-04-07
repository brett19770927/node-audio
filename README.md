# node-audio

Play WAV files from Node.js using `naudiodon` (PortAudio) and `wavefile`.

## System dependencies

```bash
sudo apt install libportaudio2
```

## Node dependencies

```bash
npm install naudiodon wavefile
```

## Find your audio device ID

```js
const pa = require('naudiodon');
console.log(pa.getDevices());
```

On this system, device `11` is the PipeWire ALSA sink. Using `deviceId: -1` (PortAudio default) opens without error but produces no sound — you must specify the correct device explicitly.

## Usage

```bash
node src/app.js
```

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `AUDIO_PORT` | `9876` | Port the HTTP server listens on |
| `AUDIO_DEVICE_ID` | `11` | PortAudio output device ID |
| `AUDIO_SOUNDS_PATH` | `/home/brett/projects/node-audio/sound-icons` | Path to directory containing WAV files |

## API

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Returns a JSON array of available sound icon names |
| `POST` | `/:id` | Plays the sound with the given name, returns 200 or 404 |

## Known naudiodon quirks

- `quit('WAIT')` hangs indefinitely — avoid the `finished` event
- Use `setTimeout` based on calculated audio duration to exit instead
- `finish` fires when data is written to the PortAudio buffer, not when it plays through speakers
- Do not call `toSampleRate()` — use the file's native sample rate to avoid resampling issues

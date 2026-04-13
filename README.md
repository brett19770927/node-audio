# node-audio

This project provides a simple REST API to play sounds from a library of sounds.
The audio clips are loaded into memory from wav files at startup and
you can have the clips played by hitting an endpoint.  The idea is to 
have asynchronous, low-latency playback of small audio clips I am
calling sound-icons.

There are 2 endpoints currently
1.  GET http://localhost:PORT(9876 default)
    returns a list of available sound-icons
1.  POST http://localhost:PORT(9876 default)/<icon_name>
   plays the sound-icon with the name icon_name.

NOTES:
  Currently the service needs to be restarted if you edit the
    files in the library directory.
    There some issues with naudiodon where hooking into the FINISH event and
        executing the quit functions don't work properly.  For instance quit causes the thread to hang and so
        there is a bit of complex logic to abort the stream when new requests to play a sound-icon
        come in.

## System dependencies

```bash
sudo apt install libportaudio2
```

## Find your audio device ID

```js
const pa = require('naudiodon');
console.log(pa.getDevices());
```


## Usage

```bash
node src/app.js
```

There is a wrapper script called start.sh that you can taylor for your system
```bash
./start.sh
```

## Environment variables


| Variable | Default | Description |
|---|---|---|
| `AUDIO_PORT` | `9876` | Port the HTTP server listens on |
| `AUDIO_DEVICE_ID` | the id of the default device | PortAudio output device ID |
| `AUDIO_SOUNDS_PATH` | `/home/brett/projects/node-audio/sound-icons` | Path to directory containing WAV files |
| `AUDIO_MAX_BUFFER_SIZE` | `204800` (200KB) | Maximum PCM buffer size in bytes — sound icons exceeding this are skipped at load time |

## API

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Returns a JSON array of available sound icon names |
| `POST` | `/:id` | Plays the sound with the given name, returns 200 or 404 |

## Known naudiodon quirks

- `quit('WAIT')` hangs indefinitely — avoid the `finished` event
- `finish` fires when data is written to the PortAudio buffer, not when it plays through speakers
- Do not call `toSampleRate()` — use the file's native sample rate to avoid resampling issues

#!/bin/bash

export AUDIO_PORT=9876
export AUDIO_DEVICE_ID=11
export AUDIO_SOUNDS_PATH="/home/brett/projects/node-audio/sound-icons"

nvm use
node src/app.js >/tmp/node-audio.log 2>&1 &

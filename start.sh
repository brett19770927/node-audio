#!/bin/bash

export AUDIO_PORT=9876
export AUDIO_DEVICE_ID=8

export AUDIO_SOUNDS_PATH="/home/brett/projects/node-audio/sound-icons"

node src/app.js >/tmp/node-audio.log 2>&1 &

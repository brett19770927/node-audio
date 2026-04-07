const express = require('express');
const { loadSoundIcons } = require("./loadSoundIcons");
const { play } = require("./playSound");
const { setupRoutes } = require("./routeSetup");

const app = express();


app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(require('morgan')('tiny'));

const PORT = parseInt(process.env.AUDIO_PORT) || 9876;
const DEVICE_ID = parseInt(process.env.AUDIO_DEVICE_ID) || 11;
const SOUNDS_PATH = process.env.AUDIO_SOUNDS_PATH || "/home/brett/projects/node-audio/sound-icons";

loadSoundIcons(SOUNDS_PATH).then(soundIconMap => {
    app.use('', setupRoutes(express.Router(), soundIconMap, play, DEVICE_ID));
    app.listen(PORT, () => console.log(`Server is starting at ${PORT}`));
}).catch(err => {
    console.error('Failed to load sound icons:', err);
    process.exit(1);
});

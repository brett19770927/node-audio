const express = require('express');
const { getAudioDeviceId, getPort, getSoundsPath } = require("./config");
const { loadSoundIcons } = require("./loadSoundIcons");
const { play } = require("./playSound");
const { setupRoutes } = require("./routeSetup");

const app = express();


app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(require('morgan')('tiny'));

const PORT = getPort();
const DEVICE_ID = getAudioDeviceId();
const SOUNDS_PATH = getSoundsPath();

loadSoundIcons(SOUNDS_PATH).then(soundIconMap => {
    app.use('', setupRoutes(express.Router(), soundIconMap, play, DEVICE_ID));
    app.listen(PORT, () => console.log(`Server is starting at ${PORT}`));
}).catch(err => {
    console.error('Failed to load sound icons:', err);
    process.exit(1);
});

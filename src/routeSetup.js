module.exports = {
	setupRoutes: function (router, soundIconMap, playSound, deviceId) {
      router.get('/', (req, res) => res.json([...soundIconMap.keys()]));
      router.post('/:id', (req, res) => {
          const soundData = soundIconMap.get(req.params["id"]);
          if (!soundData)
            res.sendStatus(404);
				  else {
            playSound(soundData, deviceId);
            res.sendStatus(200);
				  }
        });
    
      return router;
    }
}

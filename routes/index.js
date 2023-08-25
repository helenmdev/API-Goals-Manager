var express = require('express');
var router = express.Router();
const cors = require('cors');

router.use(cors());

router.get('/goalsmanagerapi', function(req, res, next) {
  res.send('Bienvenido al API de metas');
});

module.exports = router;

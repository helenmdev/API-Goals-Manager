var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.send('Bienvenido al API de metas');
});

module.exports = router;

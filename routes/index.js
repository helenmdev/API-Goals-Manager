var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/goalsmanagerapi/', function(req, res, next) {
  res.send('Bienvenido al API de metas');
});

module.exports = router;
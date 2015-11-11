'use strict';

//contrib
var express = require('express');
var router = express.Router();
var winston = require('winston');
var jwt = require('express-jwt');

//mine
var config = require('../config');
var logger = new winston.Logger(config.logger.winston);
var db = require('../models');

router.get('/:image_id', jwt({secret: config.express.jwt.secret}), function(req, res, next) {
    db.Image.findById(req.params.image_id, function(err, image) {
        res.json(image);
    }); 
});

module.exports = router;


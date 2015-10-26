'use strict';

//contrib
var express = require('express');
var router = express.Router();
var winston = require('winston');
var jwt = require('express-jwt');

//mine
var config = require('../config/config');
var logger = new winston.Logger(config.logger.winston);
var db = require('../models');

//return most recent studies
router.get('/recent', jwt({secret: config.express.jwt.secret}), function(req, res, next) {
    //var today = new Date();
    //var last_week = new Date(today.getTime() - 3600*24*7*1000); //1 week
    db.Study
    .find()
    //.where('StudyTimestamp').gt(last_week)
    .limit(20)
    .sort('-StudyTimestamp')
    .exec(function(err, studies) {
        if(err) return next(err);

        //load all series referenced
        var seriesids = [];
        studies.forEach(function(study) {
            seriesids.push(study.series_id);
        });
        db.Series.find()
        .where('_id')
        .in(seriesids)
        .exec(function(err, serieses) {
            if(err) return next(err);

            //load all researches referenced
            var rids = [];
            serieses.forEach(function(series) {
                rids.push(series.research_id);
            });
            db.Research.find()
            .where('_id')
            .in(rids)
            .exec(function(err, researches) {
                if(err) return next(err);

                //load all templates referenced
                db.Template.find()
                .where('series_id')
                .in(seriesids)
                .select({series_id: 1, date: 1, count: 1}) //don't load the headers
                .exec(function(err, templates) {
                    if(err) return next(err);

                    res.json({
                        studies: studies,
                        serieses: serieses,
                        researches: researches,
                        templates: templates,
                    });
                });

            });
        });
    });
});

router.get('/qc/:study_id', jwt({secret: config.express.jwt.secret}), function(req, res, next) {
    var study_id = req.params.study_id;
    db.Image.find()
    .where('study_id').equals(study_id)
    .sort('headers.InstanceNumber')
    .select({qc: 1})
    .exec(function(err, _images) {
        if(err) return next(err);
        //don't return the qc.. just return counts of qc results
        var images = [];
        _images.forEach(function(_image) {
            //count number of errors / warnings
            var image = {
                _id: _image._id,
            };
            if(_image.qc) {
                if(_image.qc.errors) image.e = _image.qc.errors.length;
                if(_image.qc.warnings) image.w = _image.qc.warnings.length;
                if(_image.qc.notes) image.n = _image.qc.notes.length;
            }
            images.push(image);
        });
        res.json(images);
    }); 
});

//invalidate qc on all images for this study
router.put('/qc/invalidate/:study_id', jwt({secret: config.express.jwt.secret}), function(req, res, next) {
    var study_id = req.params.study_id;
    db.Image.update({study_id: study_id}, {$unset: {qc: 1}}, {multi: true}, function(err, affected){
        if(err) return next(err);
        res.json({status: "ok", affected: affected});
    });
});

module.exports = router;


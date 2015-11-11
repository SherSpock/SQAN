#!/usr/bin/node
'use strict';

//node
var fs = require('fs');

//contrib
var winston = require('winston');
var async = require('async');
var _ = require('underscore'); 

//mine
var config = require('../api/config/config');
var logger = new winston.Logger(config.logger.winston);
var db = require('../api/models');
var qc_template = require('../api/qc/template');

//connect to db and start processing batch indefinitely
db.init(function(err) {
    run(function(err) {
        if(err) throw err;
    });
});

function run(cb) {
    logger.info("querying un-qc-ed images");
    //find images that needs QC in a batch
    db.Image.find({qc: {$exists: false}}).limit(2000).exec(function(err, images) {
        if(err) return cb(err);
        async.each(images, qc, function(err) {
            if(err) return cb(err);
            logger.info("batch complete. sleeping before next batch");
            setTimeout(run, 1000*5);
        });
    });
}

//iii) Compare headers on the images with the chosen template (on fields configured to be checked against) and store discrepancies. 
function qc(image, next) {
    logger.info("QC-ing "+image.id);
    find_template(image, function(err, template, templateheaders) {
        if(err) return next(err);
        var qc = {
            template_id: null,
            date: new Date(),
            errors: [],
            warnings: [],
            notemp: false, //set to true if no template was found
        };

        /*
        qc.errors.push({
            type: 'template_header_missing', 
            msg: "couldn't find a template header in template:"+template._id,
            AcquisitionNumber: image.headers.AcquisitionNumber,
            InstanceNumber: image.headers.InstanceNumber,
        });
        */
        if(template && templateheaders) {
            qc.template_id = template.id;
            qc_template.match(image, templateheaders, qc);
        } else {
            //templte missing for the entire series, or just for this instance number
            //either way.. just mark it as notemp
            qc.notemp = true;
        }

        /*
        //debug
        if(qc.errors.length > 0 || qc.warnings.length > 0) {
            console.log(image.id);
            console.log(JSON.stringify(qc, null, 4));
        }
        */

        //store qc results and next
        image.qc = qc;
        image.save(function(err) {
            if(err) return next(err);
            //invalidate study qc
            db.Study.update({_id: image.study_id}, {$unset: {qc: 1}}, {multi: true}, next);
        });
    });
}

function find_template(image, cb) {
    //find template_id specified for the study (if it's set, query for that template)
    //TODO - not unit tested
    db.Study.findById(image.study_id, 'template_id', function(err, study) {
        if(err) return cb(err);
        if(study.template_id) {
            //load template specified for this study
            db.Tempalte.find({id: study.template_id}, function(err, template) {
                if(err) return cb(err);
                find_templateheader(template, image, function(err, templateheader) {
                    cb(err, template, templateheader);
                });
            }); 
        } else {
            //template not specified. Just find the latest template for that series_desc
            db.Template.find({
                research_id: image.research_id,
                series_desc: image.headers.qc_series_desc, //TODO remove this and do "longest-common-string" search
            }).sort({date: -1}).exec(function(err, templates) {
                if(err) return cb(err);
                var template = templates[0]; //pick the latest
                find_templateheader(template, image, function(err, templateheader) {
                    cb(err, template, templateheader);
                });
            });
        }
    });
}

function find_templateheader(template, image, cb) {
    if(!template) return cb(null, null);
    db.TemplateHeader.findOne({
        template_id: template._id, 
        "headers.AcquisitionNumber": image.headers.AcquisitionNumber,
        "headers.InstanceNumber": image.headers.InstanceNumber,
    }, cb);
}

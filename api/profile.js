'use strict';

//contgib
var winston = require('winston');
var request = require('request');
var Promise = require('promise');

//mine
var config = require('../config');
var logger = new winston.Logger(config.logger.winston);
var db = require('./models');

var profiles = {};
/*
[
 '1': { public:
     { fullname: 'Soichi Hayashi (@iu.edu)',
       bio: 'Working at Indiana University as a Software Engineer',
       email: 'hayashis@iu.edu' },
    private: null,
    sub: '1' },
  '2': { public:
     { fullname: 'Soichi Hayashi (gmail)',
       email: 'soichih@gmail.com',
       bio: 'Test account' },
    private: null,
    sub: '2' } 
}
*/

exports.cache = function(cb) {
    logger.debug("caching user public profiles from auth service");
    request({
        url: config.dicom.auth_api+"/profiles",
        json: true,
        headers: { 'Authorization': 'Bearer '+config.dicom.auth_jwt }
    }, function (err, res, body) {
        if(err) {
            logger.error("failed to get profile from auth service");
            if(cb) cb(err);
            return;
        }
        if (res.statusCode != 200) {
            if(cb) cb({message: "couldn't load user profiles from auth service:"+res.body, code: res.statusCode});
            return;
        }
        body.forEach(function(user) {
            profiles[user.id] = user;
        });
        logger.debug("cached "+body.length+" profiles");
        if(cb) cb(null);
    });
}

exports.getall = function() { return profiles };

//TODO - rename this to get_profiles
//synchronous.. because it loads from the cache
exports.load_profiles = function(subs) {
    var ps = [];
    subs.forEach(function(sub) {
        if(profiles[sub] === undefined) {
            logger.warn("couldn't find user with sub:"+sub+" in profiles cache");
        } else {
            ps.push(profiles[sub]);
        } 
    });
    return ps;
}

exports.get = function(sub) {
    return profiles[sub];
}

/*
//start caching profile
exports.start = function(cb) {
    logger.debug("starting profile cache");
    setInterval(function() {
        exports.cache(function(err) {
            if(err) logger.error(err); //continue..
        });
    }, 1000*300); //every 5 minutes enough?
    exports.cache(cb);
}
*/

function getUserCan(user,action,cb) {
    
    db.Acl.getCan(user, action, function(err, iibisids) {
        if(err) return cb(err);
                
        db.Research.find({"IIBISID":{$in:iibisids}},function(err,rr){
            if(err) return cb(err);
            var researchids = [];
            rr.forEach(function(r){
                researchids.push(r._id);
            });            
            console.log(researchids);
            cb(null,researchids);
        }); 
    })
}

exports.getUserCan = getUserCan;

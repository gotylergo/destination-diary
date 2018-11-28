'use strict'
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const req = require('request')

const formidable = require('formidable');
const fs = require('fs');

let { Destination } = require('./models');
let { Activity } = require('./activityModel');

const destinationsRouter = express.Router();

const passport = require('passport');
const jwtAuth = passport.authenticate('jwt', { session: false });

const jsonParser = bodyParser.json();

destinationsRouter.use(bodyParser.urlencoded({ extended: true })); destinationsRouter.use(bodyParser.json());

// S3 Setup



var AWS = require('aws-sdk');
var mys3fs =  require('fs');

var s3 = new AWS.S3();


// Bucket names must be unique across all S3 users

var myBucket = exports.S3_BUCKET;

let windowhandler = ''
              
// Upload image on POST

destinationsRouter.post('/upload/:destTitle', [jsonParser, jwtAuth], function (req, res, windowhandler) {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        var oldpath = files.file.path;
        console.log('oldpath file size is: ')
        console.log(fs.statSync(`${oldpath}`))
        let fileExt = `.${files.file.type.slice(6)}`;
        var newpath = `public/img/destinations/${req.user.username}-${req.params.destTitle}-${fields.activityID}` + '.' + `${fileExt}`;
        let newurl = `/img/destinations/${req.user.username}-${req.params.destTitle}-${fields.activityID}` + '.' + `${fileExt}`;


//set some global vars
windowhandler.username = `${req.user.username}`
windowhandler.destTitle = `${req.params.destTitle}`
windowhandler.activityID = `${fields.activityID}`
windowhandler.fileExt = `${fileExt}`
windowhandler.newpath = `${newpath}`



        if (fileExt == ".jpeg" || fileExt == ".jpg" || fileExt == ".png" || fileExt == ".gif") {
            fs.rename(oldpath, newpath, function (err) {
                if (err) throw err;
                Activity.findByIdAndUpdate(fields.activityID, {url: newurl}, {new: true})
                .then(activity => {
                    res.send(activity);
                })
                .catch(err => {
                    res.send(err);
                })
            });

         } else {
            res.status(500).json('The file you sent is not a valid image file. Please choose a jpeg, png, or gif file and try again.');
        }

        console.log('newpath file size is: ')
        console.log(fs.statSync(`${newpath}`))
//it is posting file after this, so race condition error
//need to set the things and use them below basically 



    });



    var myKey = `uploads/${windowhandler.username}-${windowhandler.destTitle}-${windowhandler.activityID}${windowhandler.fileExt}`;

    mys3fs.readFile(`${windowhandler.newpath}`, function (err, data) {
        if (err) { throw err; }
      
      
      
           params = {Bucket: myBucket, Key: myKey, Body: data };
      
           s3.putObject(params, function(err, data) {
      
               if (err) {
      
                   console.log(err)
      
               } else {
      
                   console.log("Successfully uploaded data to myBucket/myKey");
      
               }
      
            });
      
      });

})




// Get an Activity by it's ID

destinationsRouter.get('/activities/:activityID', jsonParser, (req, res) => {
    Activity.findById(req.params.activityID)
    .then(activity => {
        res.send(activity);
    })
    .catch(err => {
        res.send(err);
    })
})

// Post to create a destination

destinationsRouter.post('/', [jsonParser, jwtAuth], (req, res) => {
    let { name, complete, published, activities } = req.body;
    name = name.trim();

    let tempArray = [];
    for (let activity of req.body.activities) {
        tempArray.push({
            name: activity.name,
            url: activity.url,
            user: req.user.username
        })
    }

    Activity.insertMany(tempArray)
        .then(resArray => {
            let idArray = [];
            for (let res of resArray) {
                idArray.push(res._id);
            }
            createDestination(idArray);
        })
        .catch(err => {
            res.send(err);
        })

    function createDestination(idArray) {
        Destination.find({ user: req.user.username, name })
            .count()
            .then(count => {
                if (count > 0) {
                    // User has an existing destination with the same name
                    return Promise.reject({
                        code: 422,
                        reason: 'ValidationError',
                        message: `You already have a destination named ${name}`,
                        location: 'name'
                    });
                }
                return Destination;
            })
            .then(destination => {
                return Destination.create({
                    user: req.user.username,
                    name,
                    complete,
                    published,
                    activities: idArray,
                });
            })
            .then(destination => {
                res.status(200).send(destination);
            })
            .catch(err => {
                if (err.reason === 'ValidationError') {
                    return res.status(err.code).json(err);
                }
                res.status(500).json({ code: 500, message: 'Internal server error' });
            });
    }
});

// Update a destination by id on PUT

destinationsRouter.put('/id/:id', [jsonParser, jwtAuth], (req, res) => {
    let { name, complete, published, activities } = req.body;

    let tempArray = [];
    for (let activity of req.body.activities) {
        tempArray.push({
            name: activity.name,
            url: activity.url,
            user: req.user.username,
            destination: activity.destination
        })
    }
    Activity.insertMany(tempArray)
        .then(resArray => {
            let idArray = [];
            for (let res of resArray) {
                idArray.push(res._id);
            }
            updateDestination(idArray);
        })
        .catch(err => {
            res.send(err);
        })

    function updateDestination(idArray) {
        req.body.activities = idArray;
        Destination.findByIdAndUpdate(req.params.id, req.body, { new: true })
            .then(dest => {
                res.send(dest);
            })
            .catch(err => {
                res.status(500).send(err).json({ message: 'Internal server error' })
            });
    }
});

// Remove a destination by ID on DELETE

destinationsRouter.delete('/id/:id', [jsonParser, jwtAuth], (req, res) => {
    for (let activity of req.body.activities) {
        Activity.findOneAndRemove({ _id: activity.id })
        .catch(err => res.status(500).send({ message: 'Internal server error.', error: err}));
    }
    Destination.findOneAndRemove({ _id: req.params.id })
        .then(dest => res.status(204).send(`${req.params.id} deleted.`))
        .catch(err => res.status(500).json({ message: 'Internal server error' }));
});

// Get one destination by id on GET

destinationsRouter.get('/id/:id', [jsonParser, jwtAuth], (req, res) => {
    return Destination.findOne({ _id: req.params.id })
        .populate("activities")
        .then(destination => {
            res.json(destination);
        })
        .catch(err => res.status(500).json({ message: 'Internal server error' }));
});

// GET all destinations for all users

destinationsRouter.get('/all/', [jsonParser, jwtAuth], (req, res) => {
    return Destination.find()
        .populate("activities")
        .then(destinations => {
            res.json(destinations);
        })
        .catch(err => res.status(500).json({ message: 'Internal server error' }));
});

//GET all published destinations

destinationsRouter.get('/public/', jsonParser, (req, res) => {
    return Destination.find({ published: true })
        .populate("activities")
        .then(destinations => {
            res.json(destinations)
        })
        .catch(err => res.status(500).json({ message: 'Internal server error' }));
});

// GET all destinations for the current user

destinationsRouter.get('/', [jsonParser, jwtAuth], (req, res) => {
    return Destination.find({ user: req.user.username })
        .populate("activities")
        .then(destinations => {
            res.json(destinations);
        })
        .catch(err => res.status(500).json({ message: 'Internal server error' }));
});

module.exports = { destinationsRouter };

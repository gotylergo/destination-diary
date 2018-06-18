'use strict'
const express = require('express');
const bodyParser = require('body-parser');

const path = require('path');
const http = require('http');
const formidable = require('formidable');
const fs = require('fs');

let { Destination } = require('./models');
let { Activity } = require('./activityModel');

const destinationsRouter = express.Router();

const passport = require('passport');
const jwtAuth = passport.authenticate('jwt', { session: false });

const jsonParser = bodyParser.json();

destinationsRouter.use(bodyParser.urlencoded({ extended: true })); destinationsRouter.use(bodyParser.json());

// Upload image on POST

destinationsRouter.post('/upload/:destTitle', [jsonParser, jwtAuth], function (req, res) {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        var oldpath = files.file.path;
        // if (!fs.existsSync(dir)){
        //     fs.mkdirSync(dir);
        // }
        let fileExt = `.${files.file.type.slice(6)}`;
        console.log(fileExt);
        var newpath = `./public/img/destinations/${req.user.username}-${req.params.destTitle}-${fields.activityID}${fileExt}`;
        let newurl = `/img/destinations/${req.user.username}-${req.params.destTitle}-${fields.activityID}${fileExt}`;
        if (fileExt == ".jpeg" || fileExt == ".png" || fileExt == ".gif") {
            fs.rename(oldpath, newpath, function (err) {
                if (err) throw err;
                // res.send(newpath);
                // res.end();
                console.log(`fields.activityID`, fields.activityID);
                console.log(`req.user.username`, req.user.username);
                console.log('newurl', newurl);
                console.log('fields', fields);
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
            user: req.user.username,
            destination: activity.destination
        })
    }
    // console.log(tempArray);
    Activity.insertMany(tempArray)
        .then(resArray => {
            // console.log(resArray);
            let idArray = [];
            for (let res of resArray) {
                idArray.push(res._id);
            }
            // console.log(idArray);
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
    // console.log(tempArray);
    Activity.insertMany(tempArray)
        .then(resArray => {
            // console.log(resArray);
            let idArray = [];
            for (let res of resArray) {
                idArray.push(res._id);
            }
            // console.log(idArray);
            updateDestination(idArray);
        })
        .catch(err => {
            res.send(err);
        })

    function updateDestination(idArray) {
        req.body.activities = idArray;
        // console.log(req.body);
        // Destination.findOneAndUpdate(req.params.id, { $set: { name: req.body.name, complete: req.body.complete, published: req.body.published, activities: idArray } }, { new: true })
        Destination.findByIdAndUpdate(req.params.id, req.body, { new: true })
            // .populate("activites")
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
    console.log('req.body', req.body)
    for (let activity of req.body.activities) {
        console.log(activity.id);
        Activity.findOneAndRemove({ _id: activity.id })
        .then(activity => console.log(`${activity.id} deleted.`))
        .catch(err => res.status(500).send({ message: 'Internal server error.', error: err}));
        console.log(`activity`, activity);
    }
    Destination.findOneAndRemove({ _id: req.params.id })
        .then(dest => res.send(`${req.params.id} deleted.`))
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
            // let tempArray = destinations.map(destination => destination.serialize());
            // res.json(tempArray);
            res.json(destinations)
        })
        .catch(err => res.status(500).json({ message: 'Internal server error' }));
});

// GET all destinations for the current user

destinationsRouter.get('/', [jsonParser, jwtAuth], (req, res) => {
    return Destination.find({ user: req.user.username })
        .populate("activities")
        .then(destinations => {
            // let tempArray = destinations.map(destination => destination.serialize());
            // res.json(tempArray);
            res.json(destinations);
        })
        .catch(err => res.status(500).json({ message: 'Internal server error' }));
});

module.exports = { destinationsRouter };

'use strict'
const express = require('express');
const bodyParser = require('body-parser');

let { Destination } = require('./models');

const destinationsRouter = express.Router();

const jsonParser = bodyParser.json();

// Post to create a destination
destinationsRouter.post('/', jsonParser, (req, res) => {
    console.log("Destinations endpoint hit!");
    let { name, complete, activities } = req.body;

    name = name.trim();

    return Destination.find({ name })
        .count()
        .then(count => {
            if (count > 0) {
                // There is an existing destination with the same name
                return Promise.reject({
                    code: 422,
                    reason: 'ValidationError',
                    message: 'Destination already exists',
                    location: 'name'
                });
            }
            return Destination;
        })
        .then(destination => {
            return Destination.create({
                name,
                complete,
                activities
            });
        })
        .then(destination => {
            return res.status(201).json(destination.serialize());
        })
        .catch(err => {
            // Forward validation errors on to the client, otherwise give a 500
            // error because something unexpected has happened
            if (err.reason === 'ValidationError') {
                return res.status(err.code).json(err);
            }
            res.status(500).json({ code: 500, message: 'Internal server error' });
        });
});

destinationsRouter.get('/', (req, res) => {
    return Destination.find()
        .then(destinations => res.json(destinations.map(desination => destination.serialize())))
        .catch(err => res.status(500).json({ message: 'Internal server error' }));
});

console.log(`This is destinations/router ${typeof destinationsRouter} - ${destinationsRouter}`);

module.exports = { destinationsRouter };

'use strict'
const mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.Promise = global.Promise;

const activitySchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: false
        },
    user: {
        type: String,
        required: true
    }
});

const Activity = mongoose.model('Activity', activitySchema);

module.exports = { Activity };

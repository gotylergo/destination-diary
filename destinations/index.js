'use strict';
const { Activity } = require('./activityModel');
const { Destination } = require('./models');
const { destinationsRouter } = require('./router');

module.exports = { Activity, Destination, destinationsRouter };

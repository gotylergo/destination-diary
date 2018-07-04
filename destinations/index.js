'use strict';
const { Activity } = require('./activityModel');
const { Destination } = require('./models');

const { destinationsRouter } = require('./router');
const { destinationsRouterTesting } = require('./routerTesting');

module.exports = { Activity, Destination, destinationsRouter, destinationsRouterTesting };

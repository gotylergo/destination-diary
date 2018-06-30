'use strict'

const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');
const request = require('supertest');

const auth = {};

const expect = chai.expect;

const { Activity, Destination } = require('../destinations/');
const { app, runServer, closeServer } = require('../server');
const { TEST_DATABASE_URL } = require('../config');

chai.use(chaiHttp);

// Test user

const userCredentials = {
    "username": "test",
    "name": "Test",
    "password": "ddtesting0622"
}

// Seed database with random data

let seedData = [],
    total = 10,
    counter = 0;

function seedDestinationData() {
    console.info('Seeding destination data');

    for (let i = 0; i <= total; i++) {
        generateDestinationData();
    }
}

// Generate an activity object

function generateActivityData(username) {
    return {
        name: `${faker.hacker.verb()} ${faker.hacker.adjective()} ${faker.hacker.noun()}`,
        url: "",
        user: username
    }
}

// Generate a destination object

function generateDestination(idArray, username) {
    return {
        complete: faker.random.boolean(),
        published: faker.random.boolean(),
        activities: idArray,
        name: faker.address.city(),
        user: username
    };
}

// Generate a destination object

function generateDestinationData() {

    const username = faker.internet.userName();
    let activityArr = []
    const activityQty = Math.ceil(Math.random() * 5);

    for (let i = 0; i < activityQty; i++) {
        activityArr.push(generateActivityData(username))
    }

    Activity.insertMany(activityArr)
        .then(resArray => {
            let idArray = [];
            for (let res of resArray) {
                idArray.push(res._id);
            };
            let destinationData = generateDestination(idArray, username);
            seedData.push(destinationData);
            counter++;
            if (counter === total) {
                Destination.insertMany(seedData);
            }
            // return generateDestination(idArray, username);
        })
        .catch(err => {
            throw err;
        })
}

// Delete the database

function tearDownDb() {
    console.warn('Deleting database');
    return mongoose.connection.dropDatabase();
}

function getToken(auth) {
    return chai.request(app)
        .post('/api/auth/login')
        .send(userCredentials)
        .then(function (res) {
            auth = {};
            auth.token = res.body.authToken;
            console.log('auth', auth);
            return auth;
        })
}

function registerAndGetToken() {

    chai.request(app)
        .post('/api/users')
        .send(userCredentials)
        .then(function (res) {
            console.log(res.body);
            getToken();
        })
        .catch(function (err) {
            getToken();
            console.log(err);
        })
}

describe('Destination Diary API', function () {


    before(function(){

        return runServer(TEST_DATABASE_URL);

        // registerAndGetToken();
        // console.log(`auth.token`, auth.token);

        // console.log(auth.token);
        // auth.token = res.body.token;

    })
    beforeEach(function () {
        return seedDestinationData();
    })
    afterEach(function () {
        // return tearDownDb();
    })
    after(function () {
        return closeServer();
    });

    describe('Protected destinations endpoint', function () {

    //     it('should respond with JSON array', function (done) {
    //         return chai.request(app)
    //             .get('/api/destinations')
    //             .set('Authorization', 'bearer ' + auth.token)
    //             .expect(200)
    //             .expect('Content-Type', /json/)
    //             .end(function (err, res) {
    //                 if (err) return done(err);
    //                 res.body.should.be.instanceof(Array);
    //                 done();
    //             });
    //     });
    // });

    //     describe('User GET endpoint', function () {

    //         it('Should return all destinations for the current user', function () {
    //             return chai.request(app)
    //                 .get('/api/destinations')
    //                 .set('Authorization', 'bearer ' + 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7InVzZXJuYW1lIjoidGVzdCIsIm5hbWUiOiJUZXN0In0sImlhdCI6MTUyOTY1ODU0MywiZXhwIjoxNTMwMjYzMzQzLCJzdWIiOiJ0ZXN0In0.fkB_PLkAADlAXH7nnV9C6rJzPOR8QiV64uL6dA0XRNA')
    //                 .then(function (res) {
    //                     expect(res).to.have.status(200);
    //                     expect(res).to.be.a('object');
    //                     expect(res.body).to.have.length.of.at.least(1);
    //                     //     return Destination.count();
    //                     // })
    //                     // .then(function (count) {
    //                     //     expect(res.body).to.have.length.of(count);
    //                 })
    //         })

    //     });
    })

    describe('Public GET endpoint', function () {

        it('Should return all published destinations', function () {
            return chai.request(app)
                .get('/api/destinations/public')
                .then(function (res) {
                    expect(res).to.have.status(200);
                    expect(res).to.be.a('object');
                    expect(res.body).to.have.length.of.at.least(1);
                })
        });

    });


//     describe('User POST endpoint', function () {


//         it('Should create a new destination for user on POST', function () {
//             const newDestination = generateDestinationData();

//             return chai.request(app)
//                 .post('/destinations')
//                 .set('Authorization', 'bearer ' + auth.token)
//                 .send(newDestination)
//                 .then(function (res) {
//                     expect(res).to.have.status(201);
//                     expect(res).to.be.json;
//                     expect(res).to.be.a('object');
//                     expect(res.body).to.include.keys(
//                         'id', 'name', 'published', 'activities'
//                     );
//                     expect(res.body.name).to.equal(newDestination.name);
//                     expect(res.body.published).to.equal(newDestination.name);
//                     expect(res.body.activity).to.be.a('array');
//                     expect(res.body.activities).to.equal(newDestination.activities);

//                 });
//         });

//     });

// });
});

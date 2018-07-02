'use strict'

require('dotenv').config();
const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');
const request = require('supertest');

const expect = chai.expect;

const auth_router = require('../auth/router');
const { Activity, Destination } = require('../destinations/');
const { app, runServer, closeServer } = require('../server');
const { TEST_DATABASE_URL } = require('../config');

console.log(`Using ${TEST_DATABASE_URL}`);

chai.use(chaiHttp);

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


function generateDestination(idArray = [], username) {
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

    const username = 'testing';
    let activityArr = []
    const activityQty = Math.ceil(Math.random() * 5);

    for (let i = 0; i < activityQty; i++) {
        activityArr.push(generateActivityData(username))
    }

    return Activity.insertMany(activityArr)
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
                console.log(`Seed complete!`);
            }
        })
        .catch(err => {
            throw err;
        })
}

// Delete the database

function tearDownDb() {
    return new Promise((resolve, reject) => {
      console.warn('Deleting database');
      mongoose.connection.dropDatabase()
        .then(result => resolve(result))
        .catch(err => reject(err));
    });
  }

describe('Destination Diary API', function () {


    before(function () {
        tearDownDb();
        return runServer(TEST_DATABASE_URL);
    })
    beforeEach(function () {
        return seedDestinationData();
    })
    afterEach(function () {
        return tearDownDb();
    })
    after(function () {
        return closeServer();
    });

    describe('Public GET endpoint', function () {

        it('should return all published destinations', function () {
            let _res;
            return request(app)
                .get('/api/destinations/public')
                .then(function (res) {
                    _res = res;
                    console.log(`public dests`, res.body);
                    expect(res).to.have.status(200);
                    expect(res).to.be.a('object');
                    return Destination.find({ published: true }).count();
                })
                .then(function (count) {
                    console.log(`count`, count);
                    let resCount = _res.body.length;
                    console.log(`resCount`, resCount);
                    expect(resCount).to.equal(count);
                })
        });

    });


    describe('Authenticated user GET endpoint', function () {

        it('should return user destinations', function () {
            let testing_token = auth_router.createAuthToken({ username: 'testing' })
            let _res;
            return chai.request(app)
                .get('/api/destinations')
                .set('Authorization', `bearer ${testing_token}`)
                .then(function (res) {
                    _res = res;
                    // console.log(`user dests`, res);
                    expect(res).to.have.status(200);
                    expect(res).to.be.a('object');
                    //     return Destination.find().count();
                    // })
                    // .then(function(count) {
                    //     console.log(`count`, count);
                    //     let resCount = _res.body.length;
                    //     console.log(`resCount`, resCount);
                    //     expect(resCount).to.equal(count);
                })

            //     let keysArray = Object.keys(res.body);
            //     console.log('keysArray', keysArray);
            //     // expect(keysArray).to.have.length.of.at.least(1);
            // })
        });

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

    })

    describe('Authenticated user POST endpoint', function () {


        it('should create a new destination for user on POST', function () {

            const newDestination = generateDestination();
            let testing_token = auth_router.createAuthToken({ username: 'testing' })
            return chai.request(app)
                .post('/api/destinations')
                .set('Authorization', `bearer ${testing_token}`)
                .send(newDestination)
                .then(function (res) {
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    expect(res).to.be.a('object');
                    expect(res.body).to.include.keys(
                        '_id', 'name', 'published', 'activities'
                    );
                    expect(res.body.name).to.equal(newDestination.name);
                    expect(res.body.published).to.equal(newDestination.published);

                });
        });

    });

    describe('Authenticated user PUT endpoint', function () {


        it('should update a destination for user on PUT', function () {

            const updatedDestination = generateDestination();
            console.log(`updatedDestination`, updatedDestination);
            let testing_token = auth_router.createAuthToken({ username: 'testing' })
            Destination.findOne()
                .then(function (dest) {
                    console.log(`dest`, dest);
                    return chai.request(app)
                        .put(`/api/destinations/id/${dest._id}`)
                        .set('Authorization', `bearer ${testing_token}`)
                        .send(updatedDestination)
                        .then(function (res) {
                            expect(res).to.have.status(200);
                            expect(res).to.be.json;
                            expect(res).to.be.a('object');
                            expect(res.body).to.include.keys(
                                '_id', 'name', 'published', 'activities'
                            );
                            expect(res.body.name).to.equal(updatedDestination.name);
                            expect(res.body.published).to.equal(updatedDestination.published);

                        })

                })
                .catch(err => console.log(err));

        });

    })

    describe('Authenticated user DELETE endpoint', function () {


        it('should delete a destination by ID', function () {

            let testing_token = auth_router.createAuthToken({ username: 'testing' })
            Destination.findOne()
                .then(function (dest) {
                    return chai.request(app)
                        .delete(`/api/destinations/id/${dest._id}`)
                        .set('Authorization', `bearer ${testing_token}`)
                        .send(dest)
                        .then(function (res) {
                            expect(res).to.have.status(204);
                            return Destination.findById(dest._id);
                        })
                        .then(function (_destination) {
                            expect(_destination).to.be.null;
                        });

                })
                .catch(err => console.log(err));

        });

    })
});

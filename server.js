'use strict'
require('dotenv').config();
const express = require('express');

// const path = require('path');
// const http = require('http');
// const formidable = require('formidable');
// const fs = require('fs');

const app = express();
const mongoose = require('mongoose');
const passport = require('passport');

const { router: usersRouter } = require('./users');
const { router: authRouter, localStrategy, jwtStrategy } = require('./auth');
const { destinationsRouter } = require('./destinations');
const { PORT, DATABASE_URL} = require('./config');

mongoose.Promise = global.Promise;

passport.use(localStrategy);
passport.use(jwtStrategy);

app.use('/api/users/', usersRouter);
app.use('/api/auth/', authRouter);
app.use('/api/destinations/', destinationsRouter);
app.use(express.static('public'));
// app.use(express.static(path.join(__dirname, 'public')));

// app.post('/upload', function(req, res){
//   var form = new formidable.IncomingForm();
//    form.parse(req, function (err, fields, files) {
//        var oldpath = files.filetoupload.path;
//        var newpath = './public/uploads/' + files.filetoupload.name;
//       fs.rename(oldpath, newpath, function (err) {
//         if (err) throw err;
//         res.write('File uploaded and moved!');
//         res.end();
//       });
//   });
// })

const jwtAuth = passport.authenticate('jwt', { session: false });

// A protected endpoint which needs a valid JWT to access it

app.get('/api/protected', jwtAuth, (req, res) => {
  return res.json({
    data: 'secret'
  });
});

app.use('*', (req, res) => {
    return res.status(404).json({ message: 'Not Found' });
  });

let server;

function runServer() {
  return new Promise((resolve, reject) => {
    mongoose.connect(DATABASE_URL, err => {
      if (err) {
        return reject(err);
      }
      server = app
        .listen(PORT, () => {
          console.log(`App is listening on port ${PORT}`);
          resolve();
        })
        .on('error', err => {
          mongoose.disconnect();
          reject(err);
        });
    });
  });
}

function closeServer() {
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      console.log('Closing server');
      server.close(err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}

if (require.main === module) {
  runServer().catch(err => console.error(err));
}

module.exports = { app, runServer, closeServer };

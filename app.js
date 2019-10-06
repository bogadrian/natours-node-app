const express = require('express');
const morgan = require('morgan');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// Middleware Stack
// set morgan tu run only in development enviroment
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
// set express.json() middleware in oreder to have access to req.body data
app.use(express.json());

// set the public folder assets path with exprs.sstatic()
app.use(express.static(`${__dirname}/public`));

// just an example for how a general middleware works
app.use((req, res, next) => {
  console.log('Hello from the middleware!');
  next();
});

// anothe middlware which adds a date reate at time on req object and save it with it
app.use((req, res, next) => {
  req.reqTime = new Date().toISOString();
  next();
});

// Routes
// the routes mountig for tours and users. they have access to tour Router and userRouter files where the endpoints are defined
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

// export the app in order to make it availble in routes files
module.exports = app;

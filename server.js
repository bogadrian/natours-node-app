//require mongoose
const mongoose = require('mongoose');
// install dotenv package in order to access config.env
const dotenv = require('dotenv');

// catch non async errors by uncaughtException event
process.on('uncaughtException', err => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

// tell express the path of config.env
dotenv.config({ path: './config.env' });

// require app from app.js
const app = require('./app');

//call the mongoDB url connection and replace the passord
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(() => console.log('MongoDb is connected at this point!'));

// set the port, one from onfig.env if there is any or 3000
const port = process.env.PORT || 3000;

// start the server here
const server = app.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});

//old password and new mongodb string connection; I created as I wasn't able to connect at the old cluster natorus-app. but after creating natorus2-app, the old one retuned to work!!!
//waJLewcXBQX6RxGn; DATABASE=mongodb+srv://bogdan:<password>@cluster0-hyfqo.mongodb.net/test
// listening for every hundlead error by unhandledRejection event when there is any, shuting down the server
process.on('unhandledRejection', err => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message, err);
  server.close(() => {
    process.exit(1);
  });
});

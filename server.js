//require mongoose
const mongoose = require('mongoose');
// install dotenv package in order to access config.env
const dotenv = require('dotenv');

// tell express the path of config.env
dotenv.config({ path: './config.env' });

// require app from app.js
const app = require('./app');

//call the mongoDB url connection and replace the passord
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDb is connected at this point!'));

// set the port, one from onfig.env if there is any or 3000
const port = process.env.PORT || 3000;

// start the server here
app.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});

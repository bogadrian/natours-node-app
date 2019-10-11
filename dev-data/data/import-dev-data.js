// require fs
const fs = require('fs');
//require mongoose
const mongoose = require('mongoose');
// require Tour model
const Tour = require('./../../models/tourModel');

// install dotenv package in order to access config.env
const dotenv = require('dotenv');

// tell express the path of config.env
dotenv.config({ path: './config.env' });

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

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8'),
);

const importData = async () => {
  try {
    await Tour.create(tours);
    console.log('Data Imported');
    process.exit();
  } catch (err) {
    console.log(err);
  }
};

const deleteData = async () => {
  try {
    await Tour.deleteMany();
    console.log('Data Deleted!');
    process.exit();
  } catch {
    console.log(err);
  }
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}

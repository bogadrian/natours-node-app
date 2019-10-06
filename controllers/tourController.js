// require fs module in order to read the file or write to the file
const fs = require('fs');

// read the file json (just for learning purposes, instead of real database)
const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`),
);

// middleware params function to check if id exists - runs only here for tours router. as it is params middlware it has access to val of the params argument too
exports.checkId = (req, res, next, val) => {
  console.log(`Tour id is ${val}`);
  if (req.params.id * 1 > tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid Id',
    });
  }
  next();
};

// middlware functio to check the body of the incoming request object
exports.checkBody = (req, res, next) => {
  if (!req.body.name || !req.body.price) {
    return res.status(404).json({
      status: 'fail',
      message: 'There are no name or price in the request',
    });
  }
  next();
};

// routes handler function
exports.getTours = (req, res) => {
  res.status(200).json({
    status: 'success',
    results: tours.length,
    createdAt: req.reqTime,
    data: {
      tours,
    },
  });
};

exports.getTour = (req, res) => {
  console.log(req);
  const id = req.params.id * 1;

  const tour = tours.find(el => el.id === id);
  res.status(200).json({
    data: {
      tour,
    },
  });
};

exports.createTour = (req, res) => {
  const newId = tours[tours.length - 1].id + 1;
  const newTour = Object.assign({ id: newId }, req.body);
  tours.push(newTour);

  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`,
    JSON.stringify(tours),
    err => {
      console.log(err);
    },
  );
  res.status(201).json({
    status: 'success',
    data: {
      newTour,
    },
  });
};

exports.updateTour = (req, res) => {
  if (req.params.id * 1 > tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Cannot find any tour with that id',
    });
  }

  res.status(201).json({
    status: 'success',
    data: {
      message: 'tour updated',
    },
  });
};

exports.deleteTour = (req, res) => {
  if (req.params.id * 1 > tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Cannot find any tour with that id',
    });
  }
  res.status(204).json({
    status: 'success',
    data: null,
  });
};

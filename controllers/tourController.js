const multer = require('multer');
const sharp = require('sharp');
const catchAsync = require('./../utilis/catchAsync');
const AppError = require('./../utilis/AppError');

// require Tour model
const Tour = require('./../models/tourModel');
const factory = require('./factoryHandler');

///////// MULTER STACK //////////

//define multer Storage to memory
const multerStorage = multer.memoryStorage();

//define multer filter
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

// define opload options
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

// define upload fields for multiple mixed files uploads. tehre is upload.array() for multiple same file uploads too
exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 }
]);

// upload.single('image') req.file
// upload.array('images', 5) req.files

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  // upload.fileds and upload.array prodeces req.files, plural, compair to upload.single which produces req.file, singular
  if (!req.files.imageCover || !req.files.images) return next();

  // 1) Cover image. assign a new propriety to req.body called imageCover as defined in Schema, in order to save that name in database
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

  // imageCover is at req.files.imageCover - which is an array so there is only one item we pick [1], and then is buffer, the image itself saved in memory as a buffer
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // 2) Images
  // define an empty array to contain all 3 images coming from req.body.images (the images are in memory at this point), and loop trough that array to extract any images and fill up the array. all 3 are promises so you have to wait Promise.all
  req.body.images = [];

  await Promise.all(
    // use map here in oreder to save the loop result of each iteration so we can call Promise.all on it in oreder to await all the resizing operation to be ready. if we were using forEach, the loop esult wouldn't be save so when naxt() is called the arry would be still empty
    // here req.body.images are in buffer mode;
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

      // read the file with buffer propriety from each iteration and process each image.
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

      // push the processed image into req.body.images agian, in order to have them in req.body as images propriety. practic we change the images from buffer to fisical on disk
      // here req.body.images are on disk
      req.body.images.push(filename);
    })
  );

  next();
});

////// END MULTER STACK //////

//must used middleware by users, creating and endpoint specific for this query string. find it in tourRoute
exports.aliasMustUsed = (req, res, next) => {
  //limit=5&sort=-ratingAverage,price
  req.query.limit = '5';
  req.query.sort = '-ratingAverage, price';
  req.query.fields = 'name, price, description, summary, difficulty';
  next();
};

// routes handler function
exports.getTours = factory.getAllDoc(Tour);
//call get tour with populate option object. see mopre in factoryHandler
exports.getTour = factory.getDoc(Tour, { path: 'reviews' });
exports.createTour = factory.createDoc(Tour);
exports.updateTour = factory.updateDoc(Tour);
exports.deleteTour = factory.deleteDoc(Tour);

// aggeragte pipeline. will work on specific endpoint (see tourRouter.js). Matching fileds, grouping, sorting, calculating averages, minimus, maximus, length etc. then that endpoint will expose to the client all that new generated data from aggregation pipeline
exports.getStats = async (req, res) => {
  try {
    const stats = await Tour.aggregate([
      {
        $match: { ratingsAverage: { $gte: 4.5 } }
      },
      {
        $group: {
          _id: '$difficulty',
          numTours: { $sum: 1 },
          numRatings: { $sum: '$ratingsQuantity' },
          avgRating: { $avg: '$ratingsAverage' },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' }
        }
      },
      {
        $sort: { avgPrice: 1 }
      }
    ]);
    res.status(200).json({
      status: 'success',
      data: {
        stats
      }
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err
    });
  }
};

// aggregatiopn pipeline to group tours by month starting - new endpoint defined
exports.getMontlyPlan = async (req, res) => {
  try {
    const year = req.params.year * 1;
    const plan = await Tour.aggregate([
      {
        $unwind: '$startDates'
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`)
          }
        }
      },
      {
        $group: {
          _id: { $month: '$startDates' },
          numTourStarts: { $sum: 1 },
          tours: { $push: '$name' }
        }
      },
      {
        $addFields: { month: '$_id' }
      },
      {
        $project: {
          _id: 0
        }
      },
      {
        $sort: { numTourStarts: -1 }
      },
      {
        $limit: 12
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        plan
      }
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err
    });
  }
};

//GET TOURS WITHIN function. endpoint defined in tourRoutes.js This function gets all the points ina radius distance sphere which we define in url. make sure you include tourschema.index as 2dSphere index in tourModell
// exports.getToursWithin = catchAsync(async (req, res, next) => {
//   ///tours-within/80/center/34.117083, -118.218282/unit/mi
//   const { distance, latlng, unit } = req.params;
//   const [lat, lng] = latlng.split(',');

//   // radius variable. the find() method below needs this variable in order to work
//   const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

//   if (!lat || !lng) {
//     return next(
//       new AppError('Please provide latitude and longitude in format lat,lng!')
//     );
//   }

//   // the main piece of code which gets the point within a radius distance
//   const tours = await Tour.find({
//     startLocation: {
//       $geoWithin: { $centerSphere: [[lng, lat], radius] }
//     }
//   });

//   res.status(200).json({
//     status: 'success',
//     results: tours.length,
//     data: {
//       data: tours
//     }
//   });
// });

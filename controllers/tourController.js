// require Tour model
const Tour = require('./../models/tourModel');
const factory = require('./factoryHandler');

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

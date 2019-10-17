const catchAsync = require('./../utilis/catchAsync');
const AppError = require('./../utilis/AppError');
const ApiFeatures = require('./../utilis/ApiFeatures');

// delete doc factory function
exports.deleteDoc = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('No document with that id can be found', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
      message: 'The tour was deleted!'
    });
  });

// update doc factory function
exports.updateDoc = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!doc) {
      return next(new AppError('No document with that id can be found', 404));
    }

    res.status(201).json({
      status: 'success',
      data: {
        doc,
        message: 'tour updated'
      }
    });
  });

// create doc factory function
exports.createDoc = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        doc
      }
    });
  });

//GET TOUR handler, take a look at populate('guides'). When there is a filed in tourSchema with guides as mongoose.Schema.ObjectId and ref: guides, then populate here will output the complet guides in get tour. will not in get all tours! IMPORTANT! If you need to populate every query with find, by example find all torus with complet guides data, use a query middleware. on tourSchema.pre(/^find/, function() { this.populate()})
exports.getDoc = (Model, populateOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (populateOptions) query = query.populate(populateOptions);
    const doc = await query;

    if (!doc) {
      return next(new AppError('No document with that id can be found', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        doc
      }
    });
  });

// factory function for get all documents. it extends filter, sort etc to all the Models. We can pass the filter object in Model.d(filter) It works fine for tour with reviews and does not do anything for the others Models.
exports.getAllDoc = Model =>
  catchAsync(async (req, res, next) => {
    // implemnet get all reviews for a specific tour by creating a filter object
    let filter = {};

    if (req.params.tourId)
      filter = {
        tour: req.params.tourId
      };
    const features = new ApiFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const docs = await features.query;

    // send the response
    res.status(200).json({
      status: 'success',
      results: docs.length,
      data: {
        data: docs
      }
    });
  });

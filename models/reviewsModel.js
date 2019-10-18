const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Please write your review']
    },
    rating: {
      type: Number,
      default: 0,
      min: 1,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'A review must beling to a tour']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A review must be written by a user']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

//populate the review with tour and user here in this middleware query for reviews. tunr off tour populate to avoid nested populate
reviewSchema.pre(/^find/, function(next) {
  // populating the review with the toru data would be too much, too nested populate fields
  //   this.populate({
  //     path: 'tour',
  //     select: 'name'
  //   })
  this.populate({
    path: 'user',
    select: 'name photo'
  });

  next();
});

//CALCULATE number of ratings and Average rating here for a given tour, using a static method on Review Schema. pass the tour id to the function from the middleware below. This kind of static method is avialble on Model itself and not in document tour created. so calling this.aggeragate here is calling the Review Model
reviewSchema.statics.calcAverageRatings = async function(tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);
  console.log(stats);

  // if there is no stats, let the default value from Tour Schema to display, if there are stats calculated, update those fileds in database with the calkculated values
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5
    });
  }
};

// this middleware calls calcAverageRatings on Model itself by using this.constructor. It is a post middleware because if it was pre, the current tour woudn't be saved in database. so on post we have access to all tours including the one currently saved.
//ATTENTION: this middleware save the averagRating and the number of ratings to database ONLY on create tour, but is not calculating them on deleting or updating a tour.
reviewSchema.post('save', function() {
  // this points to current review
  this.constructor.calcAverageRatings(this.tour);
});

//THE MOST CONFUSING ARG BY THE TIME I'M LEARNING IT. teoreticly this 2 middleware are updating the averageRating and numbers or rating on update and delete operations. in the first middleware, the pre on save, we have access only to the querry middleware. so, by execcuting the query we have access to the document id. then we save the document on a new proprety of its, called r here just to be able to passe it to a post middleware (which follows). on that middleware we call nthe cakcAverageRating function on Model itself and by passing the document id in order to be saved. NOTE: all of this has to do with the request response cycle between a pre middleware and a post middleare.
// findByIdAndUpdate
// findByIdAndDelete
reviewSchema.pre(/^findOneAnd/, async function(next) {
  this.r = await this.findOne();
  console.log(this.r);
  next();
});

reviewSchema.post(/^findOneAnd/, async function() {
  // await this.findOne(); does NOT work here, query has already executed
  await this.r.constructor.calcAverageRatings(this.r.tour);
});
const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;

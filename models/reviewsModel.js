const mongoose = require('mongoose');

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

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;

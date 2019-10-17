const Review = require('./../models/reviewsModel');
const factory = require('./factoryHandler');

// MIDDLEWARE to add req.body.tourId and req.body.user to the incoming request in order to be able to create a review for a specific tour from a specific user. Make sure you add this middlweare to post tour middleware stack. the id for tour is coming from params and for user from protect
exports.setReqTourUser = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

// all the handlers were generlized and exported to factoryHandler.js
exports.getAllReviews = factory.getAllDoc(Review);
exports.getReview = factory.getDoc(Review);
exports.createReview = factory.createDoc(Review);
exports.deleteReview = factory.deleteDoc(Review);
exports.updateReview = factory.updateDoc(Review);

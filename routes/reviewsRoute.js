const express = require('express');

// merge params from tourRouters (tourId) where from this route is mounted. the architecture is thsi: app.js app.use('/api/v1/tours) -> tourRoute.js router.use('/:tourId/reviews') -> reviewsRoute.js router.use('/') -> an here we merge params with tourRoute
const router = express.Router({ mergeParams: true });

const reviewController = require('./../controllers/reviewsController');
const authController = require('./../controllers/authController');

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.protect,
    authController.restrictTo('user'),
    reviewController.setReqTourUser,
    reviewController.createReview
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.protect,
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview
  )
  .delete(
    authController.protect,
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview
  );

module.exports = router;

const express = require('express');

// import the user controller
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
const reviewsRoute = require('./../routes/reviewsRoute');

// define the express router
const router = express.Router();

//Mounting a new router from this nested route in reviewsRoute.js
router.use('/:tourId/reviews', reviewsRoute);

//set a most used router
router
  .route('/get-top-5')
  .get(tourController.aliasMustUsed, tourController.getTours);

router
  .route('/plan-month/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guid', 'guide'),
    tourController.getMontlyPlan
  );
router.route('/tour-stats').get(tourController.getStats);

router
  .route('/')
  .get(authController.protect, tourController.getTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guid'),
    tourController.createTour
  );

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guid', 'guide'),
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

// export the router
module.exports = router;

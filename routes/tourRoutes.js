const express = require('express');

// import the user controller
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');

// define the express router
const router = express.Router();

// a middlware function hich cheks on id only for the tours routes as it is defined only here;
//router.param('id', tourController.checkId);

//set a most used router
router
  .route('/get-top-5')
  .get(tourController.aliasMustUsed, tourController.getTours);

router.route('/plan-month/:year').get(tourController.getMontlyPlan);
router.route('/tour-stats').get(tourController.getStats);

router
  .route('/')
  .get(authController.protect, tourController.getTours)
  // a middlware function availble only for this endpoint which checks if name and price proprieties in req object have been provided - cancelled later
  .post(tourController.createTour);
router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

// export the router
module.exports = router;

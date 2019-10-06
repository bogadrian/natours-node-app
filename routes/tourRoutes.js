const express = require('express');

// import the user controller
const tourController = require('./../controllers/tourController');

// define the express router
const router = express.Router();

// a middlware function hich cheks on id only for the tours routes as it is defined only here;
router.param('id', tourController.checkId);

router
  .route('/')
  .get(tourController.getTours)
  // a middlware function availble only for this endpoint which checks if name and price proprieties in req object have been provided
  .post(tourController.checkBody, tourController.createTour);
router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);

// export the router
module.exports = router;

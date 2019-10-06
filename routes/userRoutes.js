const express = require('express');

// define the router
const router = express.Router();

// import the user controller where all the handlers for this routes are defiend
const userController = require('./../controllers/userController');

// router for main endpoint route and for tha one who needs the id params
router
  .route('/')
  .get(userController.getUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

// export the router here
module.exports = router;

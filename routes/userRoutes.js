const express = require('express');

// define the router
const router = express.Router();

// import the user controller where all the handlers for this routes are defiend
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

router.route(
  '/updateMe',
  authController.protect,
  userController.updateMe
);

router.delete(
  '/deleteMe',
  authController.protect,
  userController.deleteMe
);

// routes for user itsefl
router.route('/signup').post(authController.signup);
router.route('/login').post(authController.login);

// update mypassword for login users. put protect here. so tehre is access to req.user
router.patch(
  '/updateMyPassword',
  authController.protect,
  authController.updatePassword
);
//forgotPssword route and restePassword route
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// router for main endpoint route and for tha one who needs the id params - just for admin use
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

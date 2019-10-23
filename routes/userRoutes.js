const express = require('express');
// import the user controller where all the handlers for this routes are defiend
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

// define the router
const router = express.Router();

// routes for user itsefl
router.route('/signup').post(authController.signup);
router.route('/login').post(authController.login);
//forgotPssword route and restePassword route
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// ad protect middleware to all following routes
router.use(authController.protect);

//Update me and delate me routes for user only. upload user photo middleware abd resize photo. first middleware, uploadUserPhoto is filtering out nly for images and uploading them to memory; teh second, resizeUserPhoto is processing the image and save it to folder
router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);
router.delete('/deleteMe', userController.deleteMe);
router.get('/me', userController.getMe, userController.getUser);
// update mypassword for login users. put protect here. so tehre is access to req.user
router.patch('/updateMyPassword', authController.updatePassword);

// restric only to admin the follwing Routes
router.use(authController.restrictTo('admin'));

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

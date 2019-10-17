// export all the user handlers here for all the endpoints defined in userRoutes. this file is diffrent from authController. in this file the admin will manage user. in authController the user itself can signup, login. change password etc
const catchAsync = require('./../utilis/catchAsync');
const User = require('./../models/userModel');
const AppError = require('./../utilis/AppError');
const factory = require('./factoryHandler');

// filter the req.body object for unwanted fileds. This function is called below in updateMe function
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

//GET ALL USERS
exports.getUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  // send the response
  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users
    }
  });
});

//UPDATE ME
//this function allows the user to change the name or email but not the password or the role.
exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400
      )
    );
  }

  // 2) Filtered out unwanted fields names that are not allowed to be updated. call filterObj above
  const filteredBody = filterObj(req.body, 'name', 'email');

  // 3) Update user document. use finfByIdAndUpdate here. so not all the fields will be required in order to perform update
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });

  // send the answer with the update user data to client
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

//DELETE ME
//set active field to false
exports.deleteMe = catchAsync(async (req, res, next) => {
  //the req.user.id is availble here because rotect runs before
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// teh general handlers generalized and availble only for admin. were exported to factoryHandler
exports.getUsers = factory.getAllDoc(User);
exports.getUser = factory.getDoc(User);
exports.deleteUser = factory.deleteDoc(User);
exports.updateUser = factory.updateDoc(User);

const multer = require('multer');
const sharp = require('sharp');

// export all the user handlers here for all the endpoints defined in userRoutes. this file is diffrent from authController. in this file the admin will manage user. in authController the user itself can signup, login. change password etc
const catchAsync = require('./../utilis/catchAsync');
const User = require('./../models/userModel');
const AppError = require('./../utilis/AppError');
const factory = require('./factoryHandler');

// STORE FILE TO THE DISK
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     // we have access at user.id here from the currently logged in user. (in ptotect /////middleware we save the current user to req.user) ////
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   }
// });

//////// BEGIN MULTER STACK //////
//STORE FILE TO MEMORY AS A buffer, define multyer storage
const multerStorage = multer.memoryStorage();

// define multer filter
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

// dfine multer upload options
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

// call the middleawre stack with uplod.single multer method. The upload occurs to a memory buffer (defined above), then it is processed y resize middleware below.
exports.uploadUserPhoto = upload.single('photo');

//call sharp to resize and save the file to folder with the fileeme. teh filrname is saved to req.file.filnae in oprder to passe it to modified object filter in updateMe handler.
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  // save photo propriety to req.file
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});
/////// END MULTER STACK //////////////////////////////////

// filter the req.body object for unwanted fileds. This function is called below in updateMe function
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

// //GET ALL USERS
// exports.getUsers = catchAsync(async (req, res, next) => {
//   const users = await User.find();

//   // send the response
//   res.status(200).json({
//     status: 'success',
//     results: users.length,
//     data: {
//       users
//     }
//   });
// });

//UPDATE ME
//this function allows the user to change the name or email but not the password or the role.
exports.updateMe = catchAsync(async (req, res, next) => {
  console.log(req.body);
  console.log(req.file);
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400
      )
    );
  }

  //2) Filtered out unwanted fields names that are not allowed to be updated. call filterObj above
  const filteredBody = filterObj(req.body, 'name', 'email');
  // attache a photo propriety to filteredBody object equal to req.file.filname;
  if (req.file) filteredBody.photo = req.file.filename;

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
  //the req.user.id is availble here because protect runs before
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
exports.createUser = factory.createDoc(User);
exports.updateUser = factory.updateDoc(User);

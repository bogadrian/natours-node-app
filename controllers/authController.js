// user itself routes
const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utilis/catchAsync');
const AppError = require('./../utilis/AppError');
const sendEmail = require('./../utilis/email');

// generate token
const signToken = id => {
  return jwt.sign(
    {
      id
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

// CREATE SEND TOKEN
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

//SIGNUP
//signup user function
exports.signup = catchAsync(async (req, res, next) => {
  //include req.body.role here but make sure not to add 'admin' to the role field in Schema. admin will be created only manually
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role
  });

  // send email on signup
  const url = `${req.protocol}://${req.get('host')}/me`;
  // console.log(url);
  await new Email(newUser, url).sendWelcome();

  // log the new user in when it signs up by issuing the token and sending it back to client
  createSendToken(newUser, 201, res);
});

// LOGIN FUNCTION
exports.login = catchAsync(async (req, res, next) => {
  //get the password and email
  const { email, password } = req.body;

  //check if passsword and email exists and if not, call next with a nea AppError object
  if (!password || !email) {
    return next(new AppError('Plaese provide password and email!', 400));
  }

  // check if the password is correct. first find the user by the id he provides in req.body. include password field here - it was excluded by default in Schema
  const user = await User.findOne({ email }).select('+password');

  // call a instance method in userModel and passe it the candiadate password and the user pasword stored in database: (moved inside if statment because if user does not exits, then the comparation between password don't need to run anymore)
  // now check if user exists and tha password is correct
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(
      new AppError('Please provide a correct email and password', 401)
    );
  }

  // send the response and login client
  createSendToken(user, 200, res);
});

// PROTECT FUNCTION
exports.protect = catchAsync(async (req, res, next) => {
  // get the token from client
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookie.jwt) {
    token = req.cookies.jwt;
  }

  // check if token exists
  if (!token) {
    return next(
      new AppError('You are not log in. Please login to access!', 401)
    );
  }

  //check if the token is correct. use promisify here in order to stay consistent and to be able to await jwt.verify. then call the function with the client token and the secret.
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // check if user still exits here.  use decoded id here to be sure teh jwt.verify has passed and there is an auturhoized user. if user no longer exists (because it was deleted by example), deny the authorization
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401
      )
    );
  }

  // check if password wasn't change after the token was issued. call a changePasswordAfter instance method which lives in userModel and that will compare the Date the token was issued with the Date the passsword was eventualy changed
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  }

  // if every prevoius step went well then GRANT ACCESS TO PROTECTED ROUTE. save the cuurentUser in a filed req.user. that will help finding it by decoded id in req.user object
  req.user = currentUser;
  next();
});

//RESTRICT ACCESS FUNCTIONS
//use clouser here in order to be able to pass an array of roles. so the roles will be accessible in the middleware function which checks if user.role has the permission. If it does not, return and stop the function. if it does call next() to move forward in middleware stack
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You don't have permission to perform this action!", 403)
      );
    }
    next();
  };
};

//FORGOT PASSWORD
//find user by email in database. email the only data availble here. call generate reset token function in userModel. send the email wit the token to user.
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address.', 404));
  }

  // 2) Generate the random reset token. call createPasswordResetToken in userModel in order to do that. then save the user but don't ask for validation by setting validateBeforesave to false. validation will not work here because the password is unknown
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();

    //create the message for the email to be send
    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

    // try to send the email by calling sendEmil in email.js. pass the options to that funcntion, email, subject, message

    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message
    });

    // if thinghs go well send the response
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!'
    });
    // if thinghs go bad, catch the error and set passwordresteToken and passwordResetExpires to undefined in database
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500
    );
  }
});

//RESET PASSWORD FUNCTION
exports.resetPassword = catchAsync(async (req, res, next) => {
  // encrypt the token arrived by reset password request in order to compare it with the token allready encrypted and saved in database (when the forgotPassowrd was called)
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  // 1) Get user based on the token - because at this point only the token is the data that we know about the user;
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  // 2) If token has not expired, and there is an user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) Update changedPasswordAt property for the user
  // 4) Log the user in, send JWT
  createSendToken(user, 200, res);
});

//UPDATE PASSWORD USER allready logged in
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection by id; the id is availble because the user is logged in. Include the password (which was excluded by default). It comes from protect function where we save req.user
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if POSTed current password is correct. call correctPassword in userModel where bcrypt will verify the password provided in req.body.passwordCurrent with the one stored in database
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  // 3) If so, update password and save it in database
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // User.findByIdAndUpdate will NOT work as intended! Only save() works here

  // 4) Log user in, send JWT
  createSendToken(user, 200, res);
});

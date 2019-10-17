const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: 'String',
    required: [true, 'Please provide a name']
  },
  email: {
    type: 'String',
    required: [true, 'Please provide an email'],
    unique: true,
    validate: [validator.isEmail, 'Please provide a correct email'],
    lowercase: true
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide'],
    default: 'user'
  },
  photo: 'String',
  password: {
    type: 'String',
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false
  },
  passwordConfirm: {
    type: 'String',
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function(el) {
        return el === this.password;
      },
      message: 'Password are not the same!'
    }
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
});

// encrypt the password middlware
userSchema.pre('save', async function(next) {
  // check if the password was modified
  if (!this.isModified('password')) return next();

  // encrypt the pasword with bcrypt with the cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // set passwordConfirm field to undefined in order to not be saved in DB
  this.passwordConfirm = undefined;
  next();
});

// create passwordCahnegAt Date when the password is changed or when a new user is created field by middleware
userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();

  // subtract 1 second from this field Date just to make sure the token JWT is not created before the date is assigned to this field;
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

//HIDE THE ACTIVE USER SET TO FALSE WITH A QUERY MIDDLEAWRE
userSchema.pre(/^find/, function(next) {
  // this points to the current query
  this.find({ active: { $ne: false } });
  next();
});

// check if the password is correct. This function is called in authController and it simply compare he password inputed by client with the one stroed in database
userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// check if token was issued after password change. this function - or instance method how it is called, lives in authController. It has the goal of comparing the Date the token was issued with the eventual date the password was changed. Therefor a passwordChangeAt field will be defined in Schema and will be provided when the password is chenged.
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    // a changeTimeStamp variable which transform the Date stored in changePasswordAt in a timestamp similar to the one provided by jwt iat - issued at time - and keept inside the token. avialble after the tokne was decoded
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    // this will return false if the token was issued after an eventual password chenge. will return true otherise and the function will stop here which means the token is old and can't be used
    return JWTTimestamp < changedTimestamp;
  }

  // False means NOT changed, the default function output
  return false;
};

// generate a reset passsword token using nodejs crypto model
userSchema.methods.createPasswordResetToken = function() {
  //generate the token
  const resetToken = crypto.randomBytes(32).toString('hex');

  // encrypt the token and save it to database
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // compare the token encrypted with the one plain (which is send to user)
  console.log({ resetToken }, this.passwordResetToken);

  // expiration time for reset password token genrator (10 minutes valid here)
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;

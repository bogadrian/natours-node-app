const mongoose = require('mongoose');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  name: {
    type: 'String',
    required: [true, 'Please provide a name']
  },
  email: {
    type: 'String',
    required: [true, 'Please provide an email'],
    unique: true,
    validate: [
      validator.isEmail,
      'Please provide a correct email'
    ],
    lowercase: true
  },
  photo: 'String',
  password: {
    type: 'String',
    required: [true, 'Please provide a password'],
    minlength: 8
  },
  passwordConfirm: {
    type: 'String',
    required: [true, 'Please confirm your password']
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;

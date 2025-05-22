const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  first: { 
    type: String, 
    required: [true, 'First name is required'] 
  },
  last: { 
    type: String, 
    required: [true, 'Last name is required'] 
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    enum: ['IT', 'Finance', 'HR', 'Legal', 'Admin']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true, // Important
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8,
    select: false
  },
  confirmPassword: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function (el) {
        // ✅ Only validate confirmPassword when creating a new user
        return !this.isNew || el === this.password;
      },
      message: 'Passwords do not match!'
    }
  },
  status: {
    type: String,
    enum: ['Online', 'Offline'],
    default: 'Offline'
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  photo: {
    type: String,
    default: 'images/pro.png'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Encrypt password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.confirmPassword = undefined;
  next();
});

// Compare input with encrypted password
userSchema.methods.correctPassword = async function (inputPwd, hashedPwd) {
  return await bcrypt.compare(inputPwd, hashedPwd);
};

module.exports = mongoose.model('User', userSchema);

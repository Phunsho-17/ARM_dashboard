// backend/models/userModel.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type:      String,
    required:  true,
    unique:    true,
    lowercase: true
  },
  password: {
    type:     String,  // bcrypt hash
    required: true
  },
  username:   { type: String, default: '' },
  contact:    { type: String, default: '' },
  department: { type: String, default: '' },

  // New field for storing the URL/path to the user’s avatar
  profilePic: {
    type:    String,
    default: '/images/default.png'  
    // this file should live at frontend/images/default.png 
    // so Express.static will serve it at http://…/images/default.png
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);

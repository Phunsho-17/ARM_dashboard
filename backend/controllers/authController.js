const User = require('../models/userModel');
const seedUsers = require('../utils/userSeeder');


// LOGIN — just sets status to "Online"
exports.login = async (req, res) => {
  try {
    let { email } = req.body;

    if (!email) {
      return res.status(400).json({ status: 'fail', message: 'Email is required' });
    }

    email = email.toLowerCase(); // Normalize email

    console.log('Login attempt for:', email);
    const user = await User.findOne({ email });

    if (!user) {
      console.log('No user found with email:', email);
      return res.status(404).json({ status: 'fail', message: 'User not found' });
    }

    user.status = 'Online';
    await user.save();

    res.status(200).json({ status: 'success', message: `${user.username} is now online` });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ status: 'fail', message: 'Login failed' });
  }
};


// LOGOUT — sets status to "Offline"
exports.logout = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ status: 'fail', message: 'User not found' });
    }

    user.status = 'Offline';
    await user.save();

    res.status(200).json({ status: 'success', message: `${user.username} is now offline` });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: 'Logout failed' });
  }
};
exports.seedDemoUsers = async (req, res) => {
  try {
    await seedUsers();
    res.status(200).json({ status: 'success', message: 'Demo users seeded successfully' });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: 'Seeding failed' });
  }
};

// GET ALL USERS (for table display)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, '-password -confirmPassword'); // exclude passwords
    res.status(200).json({ status: 'success', users });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: 'Error fetching users' });
  }
};

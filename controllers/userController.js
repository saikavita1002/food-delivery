const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper: sign a JWT for a given user id
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// POST /api/users/register
const registerUser = async (req, res) => {
  try {
    const { name, email, password, mobile, address, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'A user with this email already exists' });
    }

    // Only allow 'user' or 'restaurant_owner' on self-registration.
    // 'admin' must be assigned manually in the DB, never via public signup.
    const safeRole = role === 'restaurant_owner' ? 'restaurant_owner' : 'user';

    const user = await User.create({ name, email, password, mobile, address, role: safeRole });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
};

// POST /api/users/login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // password is select:false on the schema, so explicitly request it here
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

// GET /api/users/profile  (protected)
const getProfile = async (req, res) => {
  // req.user already excludes password (set in auth middleware)
  res.json(req.user);
};

// PUT /api/users/profile  (protected)
const updateProfile = async (req, res) => {
  try {
    const { name, mobile, address } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.name = name ?? user.name;
    user.mobile = mobile ?? user.mobile;
    user.address = address ?? user.address;

    await user.save();
    res.json({ _id: user._id, name: user.name, email: user.email, mobile: user.mobile, address: user.address });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating profile', error: error.message });
  }
};

// PUT /api/users/change-password  (protected)
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.matchPassword(currentPassword))) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword; // pre('save') hook will hash it
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error changing password', error: error.message });
  }
};

module.exports = { registerUser, loginUser, getProfile, updateProfile, changePassword };

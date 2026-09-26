const User = require('../models/User');
const Farmer = require('../models/Farmer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Generate JWT Helper
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '7d' }
  );
};

// @desc    Register a new user (farmer only for public registration)
// @route   POST /api/register or POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      village,
      mobile,
      landArea,
      soilType,
      irrigationType,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Public registration strictly creates 'farmer' role only
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'farmer',
    });

    const farmerDoc = await Farmer.create({
      userId: user._id,
      farmerName: name,
      village: village || 'Default Village',
      mobile: mobile || '9876543210',
      landArea: landArea ? Number(landArea) : 2.5,
      soilType: soilType || 'Loamy',
      irrigationType: irrigationType || 'Drip Irrigation',
    });

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        farmerId: farmerDoc._id,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration',
    });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/login or POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    let farmerDoc = null;
    if (user.role === 'farmer') {
      farmerDoc = await Farmer.findOne({ userId: user._id });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        farmerId: farmerDoc ? farmerDoc._id : null,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during login',
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    let farmerDoc = null;
    if (user.role === 'farmer') {
      farmerDoc = await Farmer.findOne({ userId: user._id });
    }
    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        farmer: farmerDoc,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new admin account (Admin only)
// @route   POST /api/admin/create-admin
// @access  Private (Admin only)
const createAdmin = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password',
      });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    // Hash password using existing bcrypt configuration
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Explicitly assign role = 'admin' on backend (never trust role from frontend)
    const newAdmin = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'admin',
    });

    return res.status(201).json({
      success: true,
      message: 'Admin account created successfully',
      admin: {
        id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
        createdAt: newAdmin.createdAt,
      },
    });
  } catch (error) {
    console.error('Create admin error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while creating admin account',
    });
  }
};

// @desc    Get all admin users (Admin only)
// @route   GET /api/admin/admins
// @access  Private (Admin only)
const getAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' })
      .select('-password')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: admins.length,
      data: admins,
    });
  } catch (error) {
    console.error('Get admins error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching admins',
    });
  }
};

// @desc    Delete an admin account (Admin only)
// @route   DELETE /api/admin/admins/:id
// @access  Private (Admin only)
const deleteAdmin = async (req, res) => {
  try {
    const targetAdminId = req.params.id;

    // Prevent self-deletion
    if (targetAdminId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own admin account',
      });
    }

    // Check if this is the only remaining admin
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount <= 1) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete the only remaining admin account',
      });
    }

    const admin = await User.findOne({ _id: targetAdminId, role: 'admin' });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin account not found',
      });
    }

    await User.findByIdAndDelete(targetAdminId);

    return res.status(200).json({
      success: true,
      message: `Admin account '${admin.name}' deleted successfully`,
    });
  } catch (error) {
    console.error('Delete admin error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while deleting admin',
    });
  }
};

module.exports = { register, login, getMe, createAdmin, getAdmins, deleteAdmin };

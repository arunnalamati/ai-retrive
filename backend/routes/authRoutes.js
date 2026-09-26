const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  createAdmin,
  getAdmins,
  deleteAdmin,
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Authenticated user profile
router.get('/me', protect, getMe);

// Admin-Only Routes
router.post('/admin/create-admin', protect, authorize('admin'), createAdmin);
router.get('/admin/admins', protect, authorize('admin'), getAdmins);
router.delete('/admin/admins/:id', protect, authorize('admin'), deleteAdmin);

module.exports = router;


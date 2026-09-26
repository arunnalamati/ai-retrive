const express = require('express');
const router = express.Router();
const {
  getFarmers,
  getFarmerById,
  createFarmer,
  updateFarmer,
  deleteFarmer,
} = require('../controllers/farmerController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getFarmers)
  .post(createFarmer);

router.route('/:id')
  .get(getFarmerById)
  .put(updateFarmer)
  .delete(authorize('admin'), deleteFarmer);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  getCrops,
  getCropById,
  createCrop,
  updateCrop,
  deleteCrop,
  getCropStats,
} = require('../controllers/cropController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/stats/summary', getCropStats);

router.route('/')
  .get(getCrops)
  .post(createCrop);

router.route('/:id')
  .get(getCropById)
  .put(updateCrop)
  .delete(deleteCrop);

module.exports = router;

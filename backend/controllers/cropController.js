const Crop = require('../models/Crop');
const Farmer = require('../models/Farmer');

// @desc    Get crops (Farmer gets own, Admin gets all)
// @route   GET /api/crops
// @access  Private
const getCrops = async (req, res) => {
  try {
    let query = {};

    // If farmer, only fetch own crops
    if (req.user.role === 'farmer') {
      query.userId = req.user._id;
    }

    // Optional status filter (e.g. for harvest history)
    if (req.query.status) {
      if (req.query.status.toLowerCase() === 'harvested') {
        query.cropStatus = { $in: ['Harvested', 'Completed'] };
      } else {
        query.cropStatus = req.query.status;
      }
    }

    const crops = await Crop.find(query)
      .populate('farmerId', 'farmerName village mobile landArea')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: crops.length,
      data: crops,
    });
  } catch (error) {
    console.error('Error fetching crops:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single crop by ID
// @route   GET /api/crops/:id
// @access  Private
const getCropById = async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id)
      .populate('farmerId', 'farmerName village mobile')
      .populate('userId', 'name email');

    if (!crop) {
      return res.status(404).json({ success: false, message: 'Crop not found' });
    }

    // Ensure farmer can only view their own crop
    if (req.user.role === 'farmer' && crop.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this crop' });
    }

    return res.status(200).json({ success: true, data: crop });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new crop
// @route   POST /api/crops
// @access  Private (Farmer or Admin)
const createCrop = async (req, res) => {
  try {
    const {
      cropName,
      season,
      sowingDate,
      expectedHarvestDate,
      cropStatus = 'Planted',
      estimatedYield,
      notes,
    } = req.body;

    if (!cropName || !season || !sowingDate || !expectedHarvestDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide cropName, season, sowingDate, and expectedHarvestDate',
      });
    }

    // Find farmer profile if exists
    let farmerDoc = await Farmer.findOne({ userId: req.user._id });

    const crop = await Crop.create({
      userId: req.user._id,
      farmerId: farmerDoc ? farmerDoc._id : null,
      cropName,
      season,
      sowingDate: new Date(sowingDate),
      expectedHarvestDate: new Date(expectedHarvestDate),
      cropStatus,
      estimatedYield: estimatedYield || '',
      notes: notes || '',
    });

    return res.status(201).json({
      success: true,
      message: 'Crop record created successfully',
      data: crop,
    });
  } catch (error) {
    console.error('Error creating crop:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update crop details
// @route   PUT /api/crops/:id
// @access  Private
const updateCrop = async (req, res) => {
  try {
    let crop = await Crop.findById(req.params.id);

    if (!crop) {
      return res.status(404).json({ success: false, message: 'Crop not found' });
    }

    // Verify ownership if role is farmer
    if (req.user.role === 'farmer' && crop.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized to modify this crop' });
    }

    crop = await Crop.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      success: true,
      message: 'Crop updated successfully',
      data: crop,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete crop
// @route   DELETE /api/crops/:id
// @access  Private
const deleteCrop = async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id);

    if (!crop) {
      return res.status(404).json({ success: false, message: 'Crop not found' });
    }

    // Verify ownership if role is farmer
    if (req.user.role === 'farmer' && crop.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this crop' });
    }

    await Crop.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Crop deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get dashboard metrics & summary
// @route   GET /api/crops/stats/summary
// @access  Private
const getCropStats = async (req, res) => {
  try {
    let match = {};
    if (req.user.role === 'farmer') {
      match.userId = req.user._id;
    }

    const allCrops = await Crop.find(match);

    const totalCrops = allCrops.length;
    const activeCrops = allCrops.filter((c) =>
      ['Planted', 'Growing'].includes(c.cropStatus)
    ).length;
    const harvestedCrops = allCrops.filter((c) =>
      ['Harvested', 'Completed'].includes(c.cropStatus)
    ).length;

    // Upcoming harvests: active crops with expectedHarvestDate in the next 30 days
    const now = new Date();
    const nextMonth = new Date();
    nextMonth.setDate(now.getDate() + 30);

    const upcomingHarvests = allCrops.filter((c) => {
      const harvestDate = new Date(c.expectedHarvestDate);
      return (
        ['Planted', 'Growing'].includes(c.cropStatus) &&
        harvestDate >= now &&
        harvestDate <= nextMonth
      );
    }).length;

    return res.status(200).json({
      success: true,
      stats: {
        totalCrops,
        activeCrops,
        harvestedCrops,
        upcomingHarvests,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCrops,
  getCropById,
  createCrop,
  updateCrop,
  deleteCrop,
  getCropStats,
};

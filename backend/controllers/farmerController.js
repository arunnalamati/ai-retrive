const Farmer = require('../models/Farmer');
const Crop = require('../models/Crop');
const User = require('../models/User');

// @desc    Get all farmers
// @route   GET /api/farmers
// @access  Private (Admin / Farmer)
const getFarmers = async (req, res) => {
  try {
    const farmers = await Farmer.find().populate('userId', 'name email').sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: farmers.length,
      data: farmers,
    });
  } catch (error) {
    console.error('Error fetching farmers:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single farmer by ID
// @route   GET /api/farmers/:id
// @access  Private
const getFarmerById = async (req, res) => {
  try {
    const farmer = await Farmer.findById(req.params.id).populate('userId', 'name email');
    if (!farmer) {
      return res.status(404).json({ success: false, message: 'Farmer not found' });
    }
    return res.status(200).json({ success: true, data: farmer });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create farmer profile
// @route   POST /api/farmers
// @access  Private
const createFarmer = async (req, res) => {
  try {
    const { farmerName, village, mobile, landArea, soilType, irrigationType } = req.body;

    const farmer = await Farmer.create({
      userId: req.user?._id,
      farmerName: farmerName || req.user?.name,
      village,
      mobile,
      landArea: Number(landArea) || 1,
      soilType,
      irrigationType,
    });

    return res.status(201).json({ success: true, data: farmer });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update farmer details
// @route   PUT /api/farmers/:id
// @access  Private (Admin or Profile Owner)
const updateFarmer = async (req, res) => {
  try {
    let farmer = await Farmer.findById(req.params.id);
    if (!farmer) {
      return res.status(404).json({ success: false, message: 'Farmer record not found' });
    }

    farmer = await Farmer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    // Also update associated user name if changed
    if (req.body.farmerName && farmer.userId) {
      await User.findByIdAndUpdate(farmer.userId, { name: req.body.farmerName });
    }

    return res.status(200).json({
      success: true,
      message: 'Farmer updated successfully',
      data: farmer,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete farmer
// @route   DELETE /api/farmers/:id
// @access  Private (Admin)
const deleteFarmer = async (req, res) => {
  try {
    const farmer = await Farmer.findById(req.params.id);
    if (!farmer) {
      return res.status(404).json({ success: false, message: 'Farmer record not found' });
    }

    // Delete associated crops
    if (farmer.userId) {
      await Crop.deleteMany({ userId: farmer.userId });
    }
    await Crop.deleteMany({ farmerId: farmer._id });

    // Delete user account if exists
    if (farmer.userId) {
      await User.findByIdAndDelete(farmer.userId);
    }

    await Farmer.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Farmer and associated records removed successfully',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getFarmers,
  getFarmerById,
  createFarmer,
  updateFarmer,
  deleteFarmer,
};

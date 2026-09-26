const mongoose = require('mongoose');

const cropSchema = new mongoose.Schema(
  {
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farmer',
      required: false,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    cropId: {
      type: String,
      unique: true,
      default: () => 'CROP-' + Math.floor(100000 + Math.random() * 900000),
    },
    cropName: {
      type: String,
      required: [true, 'Please provide crop name'],
      trim: true,
    },
    season: {
      type: String,
      required: [true, 'Please select crop season'],
      enum: ['Summer', 'Rainy', 'Winter'],
      default: 'Summer',
    },
    sowingDate: {
      type: Date,
      required: [true, 'Please provide sowing date'],
    },
    expectedHarvestDate: {
      type: Date,
      required: [true, 'Please provide expected harvest date'],
    },
    cropStatus: {
      type: String,
      required: [true, 'Please select crop status'],
      enum: ['Planted', 'Growing', 'Harvested', 'Completed'],
      default: 'Planted',
    },
    estimatedYield: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

module.exports = mongoose.model('Crop', cropSchema);

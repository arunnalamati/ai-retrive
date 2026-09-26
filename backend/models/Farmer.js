const mongoose = require('mongoose');

const farmerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    farmerId: {
      type: String,
      unique: true,
      default: () => 'FARM-' + Math.floor(100000 + Math.random() * 900000),
    },
    farmerName: {
      type: String,
      required: [true, 'Please provide farmer name'],
      trim: true,
    },
    village: {
      type: String,
      required: [true, 'Please provide village name'],
      trim: true,
    },
    mobile: {
      type: String,
      required: [true, 'Please provide mobile number'],
      trim: true,
    },
    landArea: {
      type: Number,
      required: [true, 'Please provide land area in acres'],
      min: [0.1, 'Land area must be greater than 0'],
    },
    soilType: {
      type: String,
      required: [true, 'Please select soil type'],
      enum: ['Alluvial', 'Black', 'Red', 'Clay', 'Sandy', 'Loamy', 'Other'],
      default: 'Loamy',
    },
    irrigationType: {
      type: String,
      required: [true, 'Please select irrigation type'],
      enum: ['Drip Irrigation', 'Sprinkler', 'Canal System', 'Tube Well', 'Rainfed', 'Other'],
      default: 'Drip Irrigation',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

module.exports = mongoose.model('Farmer', farmerSchema);

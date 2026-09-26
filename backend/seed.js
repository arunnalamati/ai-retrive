require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Farmer = require('./models/Farmer');
const Crop = require('./models/Crop');

const seedData = async () => {
  try {
    console.log('Connecting to MongoDB for seeding...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.');

    // Clear existing collections
    await User.deleteMany({});
    await Farmer.deleteMany({});
    await Crop.deleteMany({});
    console.log('Cleared existing users, farmers, and crops.');

    // Common password hash
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('admin123', salt);
    const farmerPassword = await bcrypt.hash('farmer123', salt);

    // 1. Create Admin
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@farmerportal.com',
      password: adminPassword,
      role: 'admin',
    });
    console.log('✅ Admin user created: admin@farmerportal.com (password: admin123)');

    // 2. Create Farmer 1 (Ramesh Patel)
    const farmerUser1 = await User.create({
      name: 'Ramesh Patel',
      email: 'ramesh@farmerportal.com',
      password: farmerPassword,
      role: 'farmer',
    });

    const farmer1 = await Farmer.create({
      userId: farmerUser1._id,
      farmerId: 'FARM-100001',
      farmerName: 'Ramesh Patel',
      village: 'Green Valley',
      mobile: '9876543210',
      landArea: 5.5,
      soilType: 'Black',
      irrigationType: 'Drip Irrigation',
    });

    // 3. Create Farmer 2 (Suresh Kumar)
    const farmerUser2 = await User.create({
      name: 'Suresh Kumar',
      email: 'suresh@farmerportal.com',
      password: farmerPassword,
      role: 'farmer',
    });

    const farmer2 = await Farmer.create({
      userId: farmerUser2._id,
      farmerId: 'FARM-100002',
      farmerName: 'Suresh Kumar',
      village: 'Sunrise Hills',
      mobile: '9871122334',
      landArea: 3.2,
      soilType: 'Alluvial',
      irrigationType: 'Canal System',
    });

    // 4. Create Farmer 3 (Anita Devi)
    const farmerUser3 = await User.create({
      name: 'Anita Devi',
      email: 'anita@farmerportal.com',
      password: farmerPassword,
      role: 'farmer',
    });

    const farmer3 = await Farmer.create({
      userId: farmerUser3._id,
      farmerId: 'FARM-100003',
      farmerName: 'Anita Devi',
      village: 'Riverdale',
      mobile: '9812345678',
      landArea: 4.0,
      soilType: 'Loamy',
      irrigationType: 'Sprinkler',
    });

    console.log('✅ 3 Farmers created.');

    // 5. Create Crops for Ramesh Patel
    await Crop.create([
      {
        userId: farmerUser1._id,
        farmerId: farmer1._id,
        cropId: 'CROP-2001',
        cropName: 'Wheat (PBW 550)',
        season: 'Winter',
        sowingDate: new Date('2026-11-15'),
        expectedHarvestDate: new Date('2026-04-10'),
        cropStatus: 'Growing',
        estimatedYield: '22 Quintals / Acre',
        notes: 'Drip fertigation applied on schedule. Healthy vegetative growth.',
      },
      {
        userId: farmerUser1._id,
        farmerId: farmer1._id,
        cropId: 'CROP-2002',
        cropName: 'Basmati Rice',
        season: 'Rainy',
        sowingDate: new Date('2026-06-20'),
        expectedHarvestDate: new Date('2026-10-25'),
        cropStatus: 'Planted',
        estimatedYield: '18 Quintals / Acre',
        notes: 'Transplanting complete in south field.',
      },
      {
        userId: farmerUser1._id,
        farmerId: farmer1._id,
        cropId: 'CROP-2003',
        cropName: 'Organic Cotton',
        season: 'Rainy',
        sowingDate: new Date('2025-05-10'),
        expectedHarvestDate: new Date('2025-11-15'),
        cropStatus: 'Harvested',
        estimatedYield: '14 Quintals / Acre',
        notes: 'Successfully harvested and stored in village warehouse.',
      },
      {
        userId: farmerUser1._id,
        farmerId: farmer1._id,
        cropId: 'CROP-2004',
        cropName: 'Yellow Mustard',
        season: 'Winter',
        sowingDate: new Date('2025-10-01'),
        expectedHarvestDate: new Date('2026-02-15'),
        cropStatus: 'Completed',
        estimatedYield: '10 Quintals / Acre',
        notes: 'Sold at regional agricultural mandi with good profit margin.',
      },
      {
        userId: farmerUser2._id,
        farmerId: farmer2._id,
        cropId: 'CROP-2005',
        cropName: 'Sweet Corn',
        season: 'Summer',
        sowingDate: new Date('2026-03-01'),
        expectedHarvestDate: new Date('2026-05-30'),
        cropStatus: 'Growing',
        estimatedYield: '30 Quintals / Acre',
        notes: 'Irrigation via canal twice a week.',
      },
      {
        userId: farmerUser3._id,
        farmerId: farmer3._id,
        cropId: 'CROP-2006',
        cropName: 'Chickpeas / Gram',
        season: 'Winter',
        sowingDate: new Date('2025-11-05'),
        expectedHarvestDate: new Date('2026-03-20'),
        cropStatus: 'Harvested',
        estimatedYield: '12 Quintals / Acre',
        notes: 'High quality pulse yield recorded.',
      },
    ]);

    console.log('✅ Sample crops seeded successfully.');
    console.log('\n======================================');
    console.log('SEEDING COMPLETE! LOGIN CREDENTIALS:');
    console.log('👨‍🌾 Farmer Login:');
    console.log('   Email:    ramesh@farmerportal.com');
    console.log('   Password: farmer123');
    console.log('👑 Admin Login:');
    console.log('   Email:    admin@farmerportal.com');
    console.log('   Password: admin123');
    console.log('======================================\n');

    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seedData();

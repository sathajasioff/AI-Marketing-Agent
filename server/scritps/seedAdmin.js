// server/scripts/seedAdmin.js
import mongoose from 'mongoose';
import '../config/env.js';
import Client from '../models/Client.js';

await mongoose.connect(process.env.MONGO_URI);

const adminDefaults = {
  name:             'Admin',
  email:            'admin@elev8.com',
  password:         'Elev8Admin2025!',
  companyName:      'Elev8 Montreal',
  role:             'admin',
  plan:             'agency',
  isActive:         true,
  generationsLimit: 99999,
};

const existing = await Client.findOne({ email: adminDefaults.email });

if (!existing) {
  await Client.create(adminDefaults);
  console.log('✓ Admin created — email: admin@elev8.com / password: Elev8Admin2025!');
} else {
  existing.name = adminDefaults.name;
  existing.password = adminDefaults.password;
  existing.companyName = adminDefaults.companyName;
  existing.role = adminDefaults.role;
  existing.plan = adminDefaults.plan;
  existing.isActive = adminDefaults.isActive;
  existing.generationsLimit = adminDefaults.generationsLimit;
  await existing.save();
  console.log('✓ Admin reset — email: admin@elev8.com / password: Elev8Admin2025!');
}

await mongoose.disconnect();

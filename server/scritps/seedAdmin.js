// server/scripts/seedAdmin.js
import 'dotenv/config';
import mongoose from 'mongoose';
import Client from '../models/Client.js';

await mongoose.connect(process.env.MONGO_URI);

const exists = await Client.findOne({ email: 'admin@elev8.com' });
if (!exists) {
  await Client.create({
    name:             'Admin',
    email:            'admin@elev8.com',
    password:         'Elev8Admin2025!',
    companyName:      'Elev8 Montreal',
    role:             'admin',
    plan:             'agency',
    generationsLimit: 99999,
  });
  console.log('✓ Admin created — email: admin@elev8.com');
} else {
  console.log('Admin already exists');
}

await mongoose.disconnect();
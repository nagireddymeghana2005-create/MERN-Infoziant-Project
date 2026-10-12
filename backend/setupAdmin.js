require('dotenv').config();
const crypto = require('crypto');
const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const connectDB = require('./config/db');

const setupAdmin = async () => {
  try {
    await connectDB();

    const email = (process.env.ADMIN_EMAIL || 'admin@docconnect.com').trim().toLowerCase();
    const existingAdmin = await Admin.findOne({ email });

    if (existingAdmin) {
      console.log(`Admin account already exists for ${email}; its password was not changed.`);
      return;
    }

    const password = process.env.ADMIN_PASSWORD ||
      `${crypto.randomBytes(18).toString('base64url')}A1!`;
    const admin = await Admin.create({
      name: process.env.ADMIN_NAME || 'DOC-CONNECT Administrator',
      email,
      password
    });

    console.log('Admin account created successfully.');
    console.log(`Email: ${admin.email}`);
    if (!process.env.ADMIN_PASSWORD) {
      console.log(`One-time password: ${password}`);
      console.log('Save this password securely; it will not be shown again.');
    } else {
      console.log('Password: ADMIN_PASSWORD from the backend environment.');
    }
  } catch (error) {
    console.error('Admin setup failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

setupAdmin();

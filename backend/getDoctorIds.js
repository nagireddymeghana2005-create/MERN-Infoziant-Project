const mongoose = require('mongoose');
const Doctor = require('./models/Doctor');
require('dotenv').config();
const connectDB = require('./config/db');

const getDoctorIds = async () => {
  try {
    await connectDB();

    const doctors = await Doctor.find({}, '_id name email specialization');
    
    console.log('\nDoctor IDs for Frontend:');
    console.log('==========================');
    doctors.forEach(doc => {
      console.log(`ID: ${doc._id}`);
      console.log(`Name: ${doc.name}`);
      console.log(`Email: ${doc.email}`);
      console.log(`Specialization: ${doc.specialization}`);
      console.log('---');
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

getDoctorIds();

const mongoose = require('mongoose');
const Doctor = require('./models/Doctor');
const connectDB = require('./config/db');
require('dotenv').config();

const doctors = [
  {
    name: 'Dr. Rajesh Kumar',
    email: 'rajesh@docconnect.com',
    password: 'rajesh123',
    phone: '9876543210',
    specialization: 'General Physician',
    experience: 15,
    qualification: 'MBBS, MD',
    isApproved: true
  },
  {
    name: 'Dr. Priya Sharma',
    email: 'priya@docconnect.com',
    password: 'priya123',
    phone: '9876543211',
    specialization: 'Cardiologist',
    experience: 12,
    qualification: 'MBBS, MD (Cardiology)',
    isApproved: true
  },
  {
    name: 'Dr. Amit Patel',
    email: 'amit@docconnect.com',
    password: 'amit123',
    phone: '9876543212',
    specialization: 'Dermatologist',
    experience: 10,
    qualification: 'MBBS, MD (Dermatology)',
    isApproved: true
  },
  {
    name: 'Dr. Sunita Reddy',
    email: 'sunita@docconnect.com',
    password: 'sunita123',
    phone: '9876543213',
    specialization: 'Pediatrician',
    experience: 8,
    qualification: 'MBBS, MD (Pediatrics)',
    isApproved: true
  },
  {
    name: 'Dr. Vikram Singh',
    email: 'vikram@docconnect.com',
    password: 'vikram123',
    phone: '9876543214',
    specialization: 'Orthopedic',
    experience: 18,
    qualification: 'MBBS, MS (Orthopedics)',
    isApproved: true
  },
  {
    name: 'Dr. Anjali Mehta',
    email: 'anjali@docconnect.com',
    password: 'anjali123',
    phone: '9876543215',
    specialization: 'Gynecologist',
    experience: 14,
    qualification: 'MBBS, MD (Gynecology)',
    isApproved: true
  },
  {
    name: 'Dr. Rahul Verma',
    email: 'rahul@docconnect.com',
    password: 'rahul123',
    phone: '9876543216',
    specialization: 'Neurologist',
    experience: 16,
    qualification: 'MBBS, MD (Neurology)',
    isApproved: true
  }
];

const setupDoctors = async () => {
  try {
    await connectDB();

    for (const doctor of doctors) {
      const existingDoctor = await Doctor.findOne({ email: doctor.email });
      const doctorRecord = existingDoctor || new Doctor();

      Object.assign(doctorRecord, doctor);
      await doctorRecord.save();
      console.log(`${existingDoctor ? 'Updated' : 'Created'} doctor: ${doctorRecord.name} (${doctorRecord.email})`);
    }

    console.log('\nDoctor setup completed successfully.');
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error setting up doctors:', error);
    await mongoose.disconnect();
    process.exitCode = 1;
  }
};

setupDoctors();

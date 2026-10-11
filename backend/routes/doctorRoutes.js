const express = require('express');
const jwt = require('jsonwebtoken');
const Doctor = require('../models/Doctor');
const Booking = require('../models/Booking');
const DoctorSchedule = require('../models/DoctorSchedule');
const { DEFAULT_AVAILABLE_DAYS, DEFAULT_TIME_SLOTS } = require('../config/doctorSchedule');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Login doctor
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!normalizedEmail || typeof password !== 'string' || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Check if doctor exists
    const doctor = await Doctor.findOne({ email: normalizedEmail });
    if (!doctor) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (doctor.isActive === false) {
      return res.status(403).json({ message: 'Your account is inactive. Please contact the administrator.' });
    }

    // Check if doctor is approved
    if (doctor.approvalStatus === 'rejected') {
      return res.status(403).json({ message: 'Your account application was rejected. Please contact the administrator.' });
    }
    if (!doctor.isApproved && doctor.approvalStatus !== 'approved') {
      return res.status(403).json({ message: 'Your account is pending approval from admin' });
    }

    // Check password
    const isMatch = await doctor.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate token
    const token = jwt.sign(
      { id: doctor._id, role: 'doctor' },
      process.env.JWT_SECRET || 'docconnect_secret_key_2024',
      { expiresIn: '30d' }
    );

    res.json({
      _id: doctor._id,
      name: doctor.name,
      email: doctor.email,
      specialization: doctor.specialization,
      role: 'doctor',
      token
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Register doctor (for admin to approve)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, specialization, experience, qualification } = req.body;

    // Check if doctor already exists
    const doctorExists = await Doctor.findOne({ email });
    if (doctorExists) {
      return res.status(400).json({ message: 'Doctor already registered with this email' });
    }

    // Create new doctor (not approved by default)
    const doctor = await Doctor.create({
      name,
      email,
      password,
      phone,
      specialization,
      experience,
      qualification,
      isApproved: false
    });

    res.status(201).json({
      _id: doctor._id,
      name: doctor.name,
      email: doctor.email,
      message: 'Registration successful. Please wait for admin approval.'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/public', async (req, res) => {
  try {
    const doctors = await Doctor.find({
      isActive: { $ne: false },
      $or: [
        { approvalStatus: 'approved' },
        { isApproved: true, approvalStatus: { $exists: false } },
        { isApproved: true, approvalStatus: null }
      ]
    })
      .select('name specialization experience qualification')
      .sort({ name: 1 })
      .lean();

    res.json(doctors);
  } catch (error) {
    console.error('Public doctor list error:', error);
    res.status(500).json({ message: 'Unable to load available doctors.' });
  }
});

// Get doctor profile (protected)
router.get('/profile', protect, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.user.id).select('-password');
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get or update the authenticated doctor's booking schedule
router.get('/schedule', protect, async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied. Doctors only.' });
    }

    const schedule = await DoctorSchedule.findOne({ doctorId: req.user.id }).lean();
    res.json(schedule || {
      doctorId: req.user.id,
      availableDays: DEFAULT_AVAILABLE_DAYS,
      timeSlots: DEFAULT_TIME_SLOTS,
      unavailableDates: []
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/schedule', protect, async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied. Doctors only.' });
    }

    const { availableDays, timeSlots, unavailableDates } = req.body;
    const validDate = (value) => {
      if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
      }
      const date = new Date(`${value}T00:00:00.000Z`);
      return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
    };

    if (
      !Array.isArray(availableDays) ||
      !availableDays.every((day) => Number.isInteger(day) && day >= 0 && day <= 6) ||
      !Array.isArray(timeSlots) ||
      !timeSlots.every((slot) => DEFAULT_TIME_SLOTS.includes(slot)) ||
      !Array.isArray(unavailableDates) ||
      !unavailableDates.every(validDate)
    ) {
      return res.status(400).json({ message: 'Schedule contains invalid days, time slots, or dates.' });
    }

    const normalizedDays = [...new Set(availableDays)];
    const normalizedSlots = [...new Set(timeSlots)];
    const normalizedUnavailableDates = [...new Set(unavailableDates)];
    const activeBookings = await Booking.find({
      doctorId: req.user.id,
      status: { $in: ['pending', 'confirmed'] }
    }).select('date timeSlot');
    const conflicts = activeBookings.filter((booking) => {
      const bookingDate = booking.date.toISOString().slice(0, 10);
      return !normalizedDays.includes(booking.date.getUTCDay()) ||
        !normalizedSlots.includes(booking.timeSlot) ||
        normalizedUnavailableDates.includes(bookingDate);
    });

    if (conflicts.length > 0) {
      return res.status(409).json({
        message: `Schedule conflicts with ${conflicts.length} active appointment(s). Cancel or complete them before removing those days or slots.`
      });
    }

    const schedule = await DoctorSchedule.findOneAndUpdate(
      { doctorId: req.user.id },
      {
        doctorId: req.user.id,
        availableDays: normalizedDays,
        timeSlots: normalizedSlots,
        unavailableDates: normalizedUnavailableDates,
        updatedAt: new Date()
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    res.json(schedule);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

const express = require('express');
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const DoctorSchedule = require('../models/DoctorSchedule');
const { DEFAULT_AVAILABLE_DAYS, DEFAULT_TIME_SLOTS } = require('../config/doctorSchedule');
const { protect } = require('../middleware/auth');

const router = express.Router();

const getDateRange = (dateValue) => {
  if (typeof dateValue !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return null;
  }

  const start = new Date(`${dateValue}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime()) || start.toISOString().slice(0, 10) !== dateValue) {
    return null;
  }

  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
};

// Get occupied slots for a doctor on a specific date
router.get('/availability', async (req, res) => {
  try {
    const { doctorId, date } = req.query;
    const dateRange = getDateRange(date);

    if (!mongoose.Types.ObjectId.isValid(doctorId) || !dateRange) {
      return res.status(400).json({ message: 'A valid doctor ID and date are required' });
    }

    const schedule = await DoctorSchedule.findOne({ doctorId }).lean();
    const scheduleDays = schedule ? schedule.availableDays : DEFAULT_AVAILABLE_DAYS;
    const scheduledSlots = schedule ? schedule.timeSlots : DEFAULT_TIME_SLOTS;
    const dateKey = dateRange.start.toISOString().slice(0, 10);
    const isAvailableDate = scheduleDays.includes(dateRange.start.getUTCDay()) &&
      !(schedule?.unavailableDates || []).includes(dateKey);

    const bookings = await Booking.find({
      doctorId,
      date: { $gte: dateRange.start, $lt: dateRange.end },
      status: { $ne: 'cancelled' }
    }).select('timeSlot -_id');

    const bookedSlots = bookings.map((booking) => booking.timeSlot);
    const availableSlots = isAvailableDate
      ? scheduledSlots.filter((slot) => !bookedSlots.includes(slot))
      : [];

    res.json({
      bookedSlots,
      availableSlots,
      isAvailableDate,
      message: isAvailableDate ? undefined : 'This doctor is unavailable on the selected date.'
    });
  } catch (error) {
    console.error('Error fetching slot availability:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create new booking
router.post('/', protect, async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Access denied. Patients only.' });
    }

    const {
      patientAge,
      patientGender,
      patientWeight,
      symptoms,
      doctorId,
      date,
      timeSlot,
      paymentStatus
    } = req.body;

    const dateRange = getDateRange(date);
    if (!mongoose.Types.ObjectId.isValid(doctorId) || !dateRange || !timeSlot) {
      return res.status(400).json({ message: 'A valid doctor ID, date, and time slot are required' });
    }

    const [patient, doctor] = await Promise.all([
      Patient.findById(req.user.id).select('name email phone isActive').lean(),
      Doctor.findById(doctorId).select('name isActive isApproved approvalStatus').lean()
    ]);
    if (!patient || patient.isActive === false) {
      return res.status(403).json({ message: 'An active patient account is required to book an appointment.' });
    }
    if (!doctor || doctor.isActive === false ||
      (doctor.approvalStatus !== 'approved' && doctor.isApproved !== true)) {
      return res.status(404).json({ message: 'The selected doctor is not available for booking.' });
    }

    const schedule = await DoctorSchedule.findOne({ doctorId }).lean();
    const scheduleDays = schedule ? schedule.availableDays : DEFAULT_AVAILABLE_DAYS;
    const scheduledSlots = schedule ? schedule.timeSlots : DEFAULT_TIME_SLOTS;
    const dateKey = dateRange.start.toISOString().slice(0, 10);
    const isAvailableDate = scheduleDays.includes(dateRange.start.getUTCDay()) &&
      !(schedule?.unavailableDates || []).includes(dateKey);

    if (!isAvailableDate || !scheduledSlots.includes(timeSlot)) {
      return res.status(400).json({ message: 'This doctor is not available for the selected date and time.' });
    }

    const existingBooking = await Booking.findOne({
      doctorId,
      date: { $gte: dateRange.start, $lt: dateRange.end },
      timeSlot,
      status: { $ne: 'cancelled' }
    });

    if (existingBooking) {
      return res.status(409).json({ message: 'That time slot has already been booked. Please choose another slot.' });
    }

    const booking = await Booking.create({
      patientName: patient.name,
      patientEmail: patient.email,
      patientPhone: patient.phone,
      patientAge,
      patientGender,
      patientWeight,
      symptoms,
      doctorId,
      doctorName: doctor.name,
      date: dateRange.start,
      timeSlot,
      paymentStatus: paymentStatus || 'paid',
      status: 'pending'
    });

    console.log(`Booking created successfully: ${booking._id}`);
    res.status(201).json(booking);
  } catch (error) {
    console.error('Booking creation error:', error);
    if (error.code === 11000) {
      return res.status(409).json({ message: 'That time slot has already been booked. Please choose another slot.' });
    }
    res.status(500).json({ message: error.message });
  }
});

// Get bookings for a specific doctor (protected)
router.get('/doctor', protect, async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied. Doctors only.' });
    }

    const bookings = await Booking.find({ doctorId: req.user.id })
      .sort({ date: 1, timeSlot: 1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get bookings for a specific patient by email (public)
router.get('/user/:email', async (req, res) => {
  try {
    const { email } = req.params;
    console.log('Fetching bookings for email:', email);

    const bookings = await Booking.find({ patientEmail: email })
      .sort({ createdAt: -1 });

    console.log('Found bookings:', bookings.length);
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get bookings for a specific patient (protected)
router.get('/patient', protect, async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Access denied. Patients only.' });
    }

    const patient = await Patient.findById(req.user.id).select('email');
    if (!patient) {
      return res.status(404).json({ message: 'Patient account not found.' });
    }

    const bookings = await Booking.find({ patientEmail: patient.email })
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/:id/cancel', protect, async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Access denied. Patients only.' });
    }
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid appointment ID.' });
    }

    const patient = await Patient.findById(req.user.id).select('email');
    if (!patient) {
      return res.status(404).json({ message: 'Patient account not found.' });
    }

    const booking = await Booking.findOne({
      _id: req.params.id,
      patientEmail: patient.email
    }).select('status');
    if (!booking) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }
    if (['completed', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({
        message: `A ${booking.status} appointment cannot be cancelled.`
      });
    }

    const cancelledBooking = await Booking.findOneAndUpdate(
      {
        _id: req.params.id,
        patientEmail: patient.email,
        status: { $nin: ['completed', 'cancelled'] }
      },
      { status: 'cancelled' },
      { new: true, runValidators: true }
    );
    if (!cancelledBooking) {
      return res.status(409).json({
        message: 'The appointment changed before it could be cancelled. Refresh and try again.'
      });
    }

    res.json(cancelledBooking);
  } catch (error) {
    console.error('Patient appointment cancellation error:', error);
    res.status(500).json({ message: 'Unable to cancel appointment.' });
  }
});

// Update booking status (doctor only)
router.patch('/:id/status', protect, async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied. Doctors only.' });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid appointment ID.' });
    }

    const { status, cancellationReason } = req.body;
    const allowedTransitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['completed', 'cancelled'],
      completed: [],
      cancelled: []
    };
    if (!Object.prototype.hasOwnProperty.call(allowedTransitions, status)) {
      return res.status(400).json({ message: 'A valid appointment status is required.' });
    }

    const booking = await Booking.findOne({
      _id: req.params.id,
      doctorId: req.user.id
    }).select('status');

    if (!booking) {
      return res.status(404).json({ message: 'Appointment not found for this doctor.' });
    }

    if (!allowedTransitions[booking.status].includes(status)) {
      return res.status(400).json({
        message: `A ${booking.status} appointment cannot be changed to ${status}.`
      });
    }

    const update = { status };
    if (status === 'cancelled') {
      if (typeof cancellationReason !== 'string' || !cancellationReason.trim()) {
        return res.status(400).json({ message: 'A cancellation reason is required.' });
      }
      if (cancellationReason.trim().length > 500) {
        return res.status(400).json({ message: 'Cancellation reason must be 500 characters or fewer.' });
      }
      update.cancellationReason = cancellationReason.trim();
    }

    const updatedBooking = await Booking.findOneAndUpdate(
      {
        _id: req.params.id,
        doctorId: req.user.id,
        status: booking.status
      },
      { $set: update },
      { new: true, runValidators: true }
    );
    if (!updatedBooking) {
      return res.status(409).json({
        message: 'The appointment changed before your update. Refresh and try again.'
      });
    }

    res.json(updatedBooking);
  } catch (error) {
    console.error('Doctor appointment status update error:', error);
    res.status(500).json({ message: 'Unable to update appointment status.' });
  }
});

module.exports = router;

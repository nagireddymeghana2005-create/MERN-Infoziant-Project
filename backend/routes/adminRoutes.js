const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Booking = require('../models/Booking');
const { protect } = require('../middleware/auth');

const router = express.Router();
const ADMIN_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Administrators only.' });
  }
  next();
};

router.get('/settings/profile', protect, requireAdmin, async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id).select('-password').lean();
    if (!admin) return res.status(404).json({ message: 'Admin profile not found.' });
    res.json({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      createdAt: admin.createdAt
    });
  } catch (error) {
    console.error('Admin profile load error:', error);
    res.status(500).json({ message: 'Unable to load admin profile.' });
  }
});

router.patch('/settings/profile', protect, requireAdmin, async (req, res) => {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (!name || name.length > 100) {
      return res.status(400).json({ message: 'Name is required and must be 100 characters or fewer.' });
    }
    if (!ADMIN_EMAIL_PATTERN.test(email) || email.length > 254) {
      return res.status(400).json({ message: 'Enter a valid email address.' });
    }
    if (await Admin.exists({ email, _id: { $ne: req.user.id } })) {
      return res.status(409).json({ message: 'That email address is already used by another admin.' });
    }
    const admin = await Admin.findByIdAndUpdate(
      req.user.id,
      { name, email },
      { new: true, runValidators: true }
    ).select('-password').lean();
    if (!admin) return res.status(404).json({ message: 'Admin profile not found.' });
    res.json({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      createdAt: admin.createdAt
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'That email address is already used by another admin.' });
    }
    console.error('Admin profile update error:', error);
    res.status(500).json({ message: 'Unable to update admin profile.' });
  }
});

router.patch('/settings/password', protect, requireAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (typeof currentPassword !== 'string' || !currentPassword ||
      typeof newPassword !== 'string' || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required.' });
    }
    if (newPassword.length < 8 || newPassword.length > 128) {
      return res.status(400).json({ message: 'New password must be between 8 and 128 characters.' });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({ message: 'New password must differ from the current password.' });
    }
    const admin = await Admin.findById(req.user.id);
    if (!admin) return res.status(404).json({ message: 'Admin account not found.' });
    if (!await admin.matchPassword(currentPassword)) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }
    admin.password = newPassword;
    await admin.save();
    res.json({ message: 'Password changed successfully. Your existing session remains active.' });
  } catch (error) {
    console.error('Admin password update error:', error);
    res.status(500).json({ message: 'Unable to change admin password.' });
  }
});

router.get('/settings/system-info', protect, requireAdmin, async (req, res) => {
  try {
    const [patientCount, doctorCount, bookingCount] = await Promise.all([
      Patient.countDocuments(),
      Doctor.countDocuments(),
      Booking.countDocuments()
    ]);
    const databaseStates = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    res.json({
      application: 'DOC-CONNECT',
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      apiVersion: '1',
      database: {
        status: databaseStates[mongoose.connection.readyState] || 'unknown',
        provider: 'MongoDB'
      },
      records: {
        patients: patientCount,
        doctors: doctorCount,
        bookings: bookingCount
      },
      serverTime: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime())
    });
  } catch (error) {
    console.error('Admin system information error:', error);
    res.status(500).json({ message: 'Unable to load system information.' });
  }
});

const validDoctorFields = (doctor, { requireAll = false } = {}) => {
  const fields = ['name', 'email', 'phone', 'specialization', 'experience', 'qualification'];
  if (requireAll && fields.some((field) => doctor[field] === undefined || doctor[field] === '')) {
    return 'Name, email, phone, specialization, experience, and qualification are required.';
  }

  if (doctor.email !== undefined &&
    (typeof doctor.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(doctor.email.trim()))) {
    return 'A valid email address is required.';
  }
  if (doctor.experience !== undefined &&
    (!Number.isFinite(Number(doctor.experience)) || Number(doctor.experience) < 0)) {
    return 'Experience must be a non-negative number.';
  }
  for (const field of ['name', 'phone', 'specialization', 'qualification']) {
    if (doctor[field] !== undefined &&
      (typeof doctor[field] !== 'string' || !doctor[field].trim())) {
      return `${field} cannot be empty.`;
    }
  }
  return null;
};

const doctorResponse = (doctor) => ({
  _id: doctor._id,
  name: doctor.name,
  email: doctor.email,
  phone: doctor.phone,
  specialization: doctor.specialization,
  experience: doctor.experience,
  qualification: doctor.qualification,
  approvalStatus: doctor.approvalStatus || (doctor.isApproved ? 'approved' : 'pending'),
  isActive: doctor.isActive !== false,
  createdAt: doctor.createdAt
});

const patientResponse = (patient, bookingCount = 0) => ({
  _id: patient._id,
  name: patient.name,
  email: patient.email,
  phone: patient.phone,
  isActive: patient.isActive !== false,
  createdAt: patient.createdAt,
  bookingCount
});

const paymentResponse = (booking) => ({
  _id: booking._id,
  bookingId: booking._id,
  patientName: booking.patientName,
  patientEmail: booking.patientEmail,
  doctorName: booking.doctorName,
  amount: booking.amount ?? 200,
  paymentDate: booking.createdAt,
  paymentDateBasis: 'booking_created_at',
  paymentStatus: booking.paymentStatus,
  transactionType: 'simulated',
  appointmentDate: booking.date,
  timeSlot: booking.timeSlot
});

const istDateKey = (date) => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
}).format(date);

const shiftCalendarDate = (dateKey, offsetDays) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + offsetDays));
  return date.toISOString().slice(0, 10);
};

router.get('/reports/analytics', protect, requireAdmin, async (req, res) => {
  try {
    const todayKey = istDateKey(new Date());
    const dailyKeys = Array.from({ length: 14 }, (_, index) =>
      shiftCalendarDate(todayKey, index - 13)
    );
    const monthlyKeys = Array.from({ length: 12 }, (_, index) => {
      const [year, month] = todayKey.split('-').map(Number);
      const date = new Date(Date.UTC(year, month - 1 - (11 - index), 1));
      return date.toISOString().slice(0, 7);
    });

    const [
      totalPatients,
      totalDoctors,
      totalBookings,
      bookingBuckets,
      doctorBookings,
      appointmentStatuses,
      paymentSummary
    ] = await Promise.all([
      Patient.countDocuments(),
      Doctor.countDocuments(),
      Booking.countDocuments(),
      Booking.aggregate([
        {
          $facet: {
            daily: [
              {
                $group: {
                  _id: {
                    $dateToString: {
                      format: '%Y-%m-%d',
                      date: '$createdAt',
                      timezone: 'Asia/Kolkata'
                    }
                  },
                  count: { $sum: 1 }
                }
              }
            ],
            monthly: [
              {
                $group: {
                  _id: {
                    $dateToString: {
                      format: '%Y-%m',
                      date: '$createdAt',
                      timezone: 'Asia/Kolkata'
                    }
                  },
                  count: { $sum: 1 }
                }
              }
            ]
          }
        }
      ]),
      Booking.aggregate([
        {
          $group: {
            _id: { doctorId: '$doctorId', doctorName: '$doctorName' },
            total: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } }
          }
        },
        { $sort: { total: -1, '_id.doctorName': 1 } }
      ]),
      Booking.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Booking.aggregate([
        {
          $group: {
            _id: '$paymentStatus',
            count: { $sum: 1 },
            simulatedAmount: { $sum: { $ifNull: ['$amount', 200] } }
          }
        }
      ])
    ]);

    const dailyCounts = new Map((bookingBuckets[0]?.daily || []).map(({ _id, count }) => [_id, count]));
    const monthlyCounts = new Map((bookingBuckets[0]?.monthly || []).map(({ _id, count }) => [_id, count]));
    const statuses = new Map(appointmentStatuses.map(({ _id, count }) => [_id, count]));
    const paymentsByStatus = new Map(paymentSummary.map(({ _id, count, simulatedAmount }) => [
      _id,
      { count, simulatedAmount }
    ]));
    const simulatedPaid = paymentsByStatus.get('paid') || { count: 0, simulatedAmount: 0 };
    const simulatedPending = paymentsByStatus.get('pending') || { count: 0, simulatedAmount: 0 };

    res.json({
      generatedAt: new Date(),
      timezone: 'Asia/Kolkata',
      totals: { totalPatients, totalDoctors, totalBookings },
      dailyBookings: dailyKeys.map((date) => ({ date, count: dailyCounts.get(date) || 0 })),
      monthlyBookings: monthlyKeys.map((month) => ({ month, count: monthlyCounts.get(month) || 0 })),
      doctorAppointments: doctorBookings.map(({ _id, ...counts }) => ({
        doctorId: _id.doctorId,
        doctorName: _id.doctorName,
        ...counts
      })),
      appointmentStatuses: {
        pending: statuses.get('pending') || 0,
        confirmed: statuses.get('confirmed') || 0,
        completed: statuses.get('completed') || 0,
        cancelled: statuses.get('cancelled') || 0
      },
      payments: {
        transactionType: 'simulated',
        simulatedPaidCount: simulatedPaid.count,
        simulatedPendingCount: simulatedPending.count,
        simulatedAmountMarkedPaid: simulatedPaid.simulatedAmount,
        simulatedPendingAmount: simulatedPending.simulatedAmount,
        verifiedPaymentCount: 0,
        verifiedRevenue: 0,
        revenueNote: 'No verified payment processor records are available. Simulated payment states are excluded from revenue.'
      }
    });
  } catch (error) {
    console.error('Admin reports analytics error:', error);
    res.status(500).json({ message: 'Unable to load reports and analytics.' });
  }
});

router.get('/payments', protect, requireAdmin, async (req, res) => {
  try {
    const filter = {};
    if (typeof req.query.status === 'string' && req.query.status) {
      if (!['pending', 'paid'].includes(req.query.status)) {
        return res.status(400).json({ message: 'Payment status must be pending or paid.' });
      }
      filter.paymentStatus = req.query.status;
    }
    if (typeof req.query.date === 'string' && req.query.date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(req.query.date)) {
        return res.status(400).json({ message: 'Date must use YYYY-MM-DD format.' });
      }
      const dateParts = req.query.date.split('-').map(Number);
      const start = new Date(Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2]) - 330 * 60 * 1000);
      if (Number.isNaN(start.getTime()) ||
        new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(start) !== req.query.date) {
        return res.status(400).json({ message: 'Invalid payment date.' });
      }
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 1);
      filter.createdAt = { $gte: start, $lt: end };
    }
    const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '';
    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = ['patientName', 'patientEmail', 'doctorName'].map((field) => ({
        [field]: { $regex: escapedSearch, $options: 'i' }
      }));
      if (mongoose.isValidObjectId(search)) {
        filter.$or.push({ _id: search });
      }
    }
    const payments = await Booking.find(filter)
      .select('patientName patientEmail doctorName amount createdAt paymentStatus date timeSlot')
      .sort({ createdAt: -1 })
      .lean();
    res.json(payments.map(paymentResponse));
  } catch (error) {
    console.error('Admin payment list error:', error);
    res.status(500).json({ message: 'Unable to load simulated payment records.' });
  }
});

router.get('/payments/:id', protect, requireAdmin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid booking ID.' });
    }
    const booking = await Booking.findById(req.params.id)
      .select('patientName patientEmail patientPhone patientAge patientGender patientWeight symptoms doctorName amount createdAt paymentStatus date timeSlot status')
      .lean();
    if (!booking) return res.status(404).json({ message: 'Payment record not found.' });
    res.json({
      ...paymentResponse(booking),
      patientPhone: booking.patientPhone,
      patientAge: booking.patientAge,
      patientGender: booking.patientGender,
      patientWeight: booking.patientWeight,
      symptoms: booking.symptoms,
      appointmentStatus: booking.status
    });
  } catch (error) {
    console.error('Admin payment details error:', error);
    res.status(500).json({ message: 'Unable to load simulated payment details.' });
  }
});

router.get('/appointments', protect, requireAdmin, async (req, res) => {
  try {
    const filter = {};
    if (typeof req.query.status === 'string' && req.query.status) {
      if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(req.query.status)) {
        return res.status(400).json({ message: 'Invalid appointment status filter.' });
      }
      filter.status = req.query.status;
    }
    if (typeof req.query.date === 'string' && req.query.date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(req.query.date)) {
        return res.status(400).json({ message: 'Date must use YYYY-MM-DD format.' });
      }
      const start = new Date(`${req.query.date}T00:00:00.000Z`);
      if (Number.isNaN(start.getTime()) || start.toISOString().slice(0, 10) !== req.query.date) {
        return res.status(400).json({ message: 'Invalid appointment date.' });
      }
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 1);
      filter.date = { $gte: start, $lt: end };
    }
    if (typeof req.query.doctorId === 'string' && req.query.doctorId) {
      if (!mongoose.isValidObjectId(req.query.doctorId)) {
        return res.status(400).json({ message: 'Invalid doctor filter.' });
      }
      filter.doctorId = req.query.doctorId;
    }
    const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '';
    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = ['patientName', 'patientEmail', 'doctorName', 'symptoms'].map((field) => ({
        [field]: { $regex: escapedSearch, $options: 'i' }
      }));
    }
    const appointments = await Booking.find(filter)
      .sort({ date: -1, timeSlot: 1, createdAt: -1 })
      .lean();
    res.json(appointments);
  } catch (error) {
    console.error('Admin appointment list error:', error);
    res.status(500).json({ message: 'Unable to load appointments.' });
  }
});

router.patch('/appointments/:id/status', protect, requireAdmin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid appointment ID.' });
    }
    const allowedTransitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['completed', 'cancelled'],
      completed: [],
      cancelled: []
    };
    const appointment = await Booking.findById(req.params.id).select('status');
    if (!appointment) return res.status(404).json({ message: 'Appointment not found.' });
    const { status } = req.body;
    if (!allowedTransitions[appointment.status]?.includes(status)) {
      return res.status(400).json({
        message: `A ${appointment.status} appointment cannot be changed to ${status}.`
      });
    }
    const updatedAppointment = await Booking.findOneAndUpdate(
      { _id: req.params.id, status: appointment.status },
      { status },
      { new: true, runValidators: true }
    );
    if (!updatedAppointment) {
      return res.status(409).json({ message: 'The appointment changed before your update. Refresh and try again.' });
    }
    res.json(updatedAppointment);
  } catch (error) {
    console.error('Admin appointment status update error:', error);
    res.status(500).json({ message: 'Unable to update appointment status.' });
  }
});

router.get('/patients', protect, requireAdmin, async (req, res) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '';
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const filter = search
      ? {
          $or: ['name', 'email'].map((field) => ({
            [field]: { $regex: escapedSearch, $options: 'i' }
          }))
        }
      : {};
    const patients = await Patient.find(filter).sort({ createdAt: -1 }).lean();
    const bookingCounts = await Booking.aggregate([
      { $group: { _id: '$patientEmail', count: { $sum: 1 } } }
    ]);
    const countsByEmail = new Map(bookingCounts.map(({ _id, count }) => [_id?.toLowerCase(), count]));
    res.json(patients.map((patient) => patientResponse(
      patient,
      countsByEmail.get(patient.email.toLowerCase()) || 0
    )));
  } catch (error) {
    console.error('Admin patient list error:', error);
    res.status(500).json({ message: 'Unable to load patients.' });
  }
});

router.get('/patients/:id', protect, requireAdmin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid patient ID.' });
    }
    const patient = await Patient.findById(req.params.id).select('-password').lean();
    if (!patient) return res.status(404).json({ message: 'Patient not found.' });

    const bookings = await Booking.find({ patientEmail: patient.email })
      .select('doctorName date timeSlot status paymentStatus amount patientAge patientGender patientWeight symptoms createdAt')
      .sort({ date: -1, createdAt: -1 })
      .lean();
    res.json({
      patient: patientResponse(patient, bookings.length),
      bookings
    });
  } catch (error) {
    console.error('Admin patient details error:', error);
    res.status(500).json({ message: 'Unable to load patient details.' });
  }
});

router.patch('/patients/:id/active', protect, requireAdmin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid patient ID.' });
    }
    if (typeof req.body.isActive !== 'boolean') {
      return res.status(400).json({ message: 'isActive must be a boolean.' });
    }
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { isActive: req.body.isActive },
      { new: true, runValidators: true }
    ).select('-password').lean();
    if (!patient) return res.status(404).json({ message: 'Patient not found.' });
    res.json(patientResponse(patient));
  } catch (error) {
    console.error('Admin patient activation update error:', error);
    res.status(500).json({ message: 'Unable to update patient access.' });
  }
});

router.get('/doctors', protect, requireAdmin, async (req, res) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '';
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const filter = search
      ? {
          $or: ['name', 'email', 'phone', 'specialization'].map((field) => ({
            [field]: { $regex: escapedSearch, $options: 'i' }
          }))
        }
      : {};
    const doctors = await Doctor.find(filter).sort({ createdAt: -1 }).lean();
    res.json(doctors.map(doctorResponse));
  } catch (error) {
    console.error('Admin doctor list error:', error);
    res.status(500).json({ message: 'Unable to load doctors.' });
  }
});

router.post('/doctors', protect, requireAdmin, async (req, res) => {
  try {
    const validationError = validDoctorFields(req.body, { requireAll: true });
    if (validationError) return res.status(400).json({ message: validationError });
    if (typeof req.body.password !== 'string' || req.body.password.length < 8) {
      return res.status(400).json({ message: 'A password of at least 8 characters is required.' });
    }

    const email = req.body.email.trim().toLowerCase();
    if (await Doctor.exists({ email })) {
      return res.status(409).json({ message: 'A doctor with this email already exists.' });
    }

    const doctor = await Doctor.create({
      name: req.body.name.trim(),
      email,
      password: req.body.password,
      phone: req.body.phone.trim(),
      specialization: req.body.specialization.trim(),
      experience: Number(req.body.experience),
      qualification: req.body.qualification.trim(),
      isApproved: false,
      approvalStatus: 'pending',
      isActive: true
    });
    res.status(201).json(doctorResponse(doctor));
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'A doctor with this email already exists.' });
    }
    console.error('Admin doctor creation error:', error);
    res.status(500).json({ message: 'Unable to create doctor.' });
  }
});

router.patch('/doctors/:id', protect, requireAdmin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid doctor ID.' });
    }
    const allowedFields = ['name', 'email', 'phone', 'specialization', 'experience', 'qualification'];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([field]) => allowedFields.includes(field))
    );
    if (!Object.keys(updates).length) {
      return res.status(400).json({ message: 'Provide at least one doctor detail to update.' });
    }
    const validationError = validDoctorFields(updates);
    if (validationError) return res.status(400).json({ message: validationError });
    if (updates.email !== undefined) updates.email = updates.email.trim().toLowerCase();
    for (const field of ['name', 'phone', 'specialization', 'qualification']) {
      if (updates[field] !== undefined) updates[field] = updates[field].trim();
    }
    if (updates.experience !== undefined) updates.experience = Number(updates.experience);

    const doctor = await Doctor.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    });
    if (!doctor) return res.status(404).json({ message: 'Doctor not found.' });
    res.json(doctorResponse(doctor));
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'A doctor with this email already exists.' });
    }
    console.error('Admin doctor update error:', error);
    res.status(500).json({ message: 'Unable to update doctor.' });
  }
});

router.patch('/doctors/:id/approval', protect, requireAdmin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid doctor ID.' });
    }
    const { approvalStatus } = req.body;
    if (!['approved', 'rejected', 'pending'].includes(approvalStatus)) {
      return res.status(400).json({ message: 'Approval status must be approved, rejected, or pending.' });
    }
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, {
      approvalStatus,
      isApproved: approvalStatus === 'approved'
    }, { new: true, runValidators: true });
    if (!doctor) return res.status(404).json({ message: 'Doctor not found.' });
    res.json(doctorResponse(doctor));
  } catch (error) {
    console.error('Admin doctor approval update error:', error);
    res.status(500).json({ message: 'Unable to update doctor approval.' });
  }
});

router.patch('/doctors/:id/active', protect, requireAdmin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid doctor ID.' });
    }
    if (typeof req.body.isActive !== 'boolean') {
      return res.status(400).json({ message: 'isActive must be a boolean.' });
    }
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { isActive: req.body.isActive },
      { new: true, runValidators: true }
    );
    if (!doctor) return res.status(404).json({ message: 'Doctor not found.' });
    res.json(doctorResponse(doctor));
  } catch (error) {
    console.error('Admin doctor activation update error:', error);
    res.status(500).json({ message: 'Unable to update doctor access.' });
  }
});

// Login admin
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!normalizedEmail || typeof password !== 'string' || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Check if admin exists
    const admin = await Admin.findOne({ email: normalizedEmail });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate token
    const token = jwt.sign(
      { id: admin._id, role: 'admin' },
      process.env.JWT_SECRET || 'docconnect_secret_key_2024',
      { expiresIn: '30d' }
    );

    res.json({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: 'admin',
      token
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all pending doctor approvals (protected)
router.get('/pending-doctors', protect, requireAdmin, async (req, res) => {
  try {
    const pendingDoctors = await Doctor.find({
      isApproved: false,
      approvalStatus: { $ne: 'rejected' }
    }).select('-password');
    res.json(pendingDoctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Approve doctor (protected)
router.put('/approve-doctor/:id', protect, requireAdmin, async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { isApproved: true, approvalStatus: 'approved' },
      { new: true }
    ).select('-password');

    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/dashboard/summary', protect, requireAdmin, async (req, res) => {
  try {
    const dateParts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(new Date()).reduce((parts, part) => {
      if (part.type !== 'literal') {
        parts[part.type] = Number(part.value);
      }
      return parts;
    }, {});
    const todayStart = new Date(Date.UTC(dateParts.year, dateParts.month - 1, dateParts.day) - 330 * 60 * 1000);
    const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const [
      totalPatients,
      totalDoctors,
      totalBookings,
      todaysAppointments,
      simulatedPaidResult
    ] = await Promise.all([
      Patient.countDocuments(),
      Doctor.countDocuments(),
      Booking.countDocuments(),
      Booking.countDocuments({
        date: { $gte: todayStart, $lt: tomorrowStart },
        status: { $ne: 'cancelled' }
      }),
      Booking.aggregate([
        { $match: { paymentStatus: 'paid', status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: { $ifNull: ['$amount', 200] } } } }
      ])
    ]);

    res.json({
      totalPatients,
      totalDoctors,
      totalBookings,
      todaysAppointments,
      totalRevenue: 0,
      verifiedPaymentCount: 0,
      simulatedAmountMarkedPaid: simulatedPaidResult[0]?.total || 0
    });
  } catch (error) {
    console.error('Admin dashboard summary error:', error);
    res.status(500).json({ message: 'Unable to load dashboard summary.' });
  }
});

router.get('/dashboard/recent-bookings', protect, requireAdmin, async (req, res) => {
  try {
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isInteger(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 50)
      : 10;
    const bookings = await Booking.find()
      .select('patientName patientEmail doctorName date timeSlot status paymentStatus amount createdAt')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json(bookings);
  } catch (error) {
    console.error('Admin recent bookings error:', error);
    res.status(500).json({ message: 'Unable to load recent bookings.' });
  }
});

module.exports = router;

const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  patientName: {
    type: String,
    required: true
  },
  patientEmail: {
    type: String,
    required: true
  },
  patientPhone: {
    type: String,
    required: true
  },
  patientAge: {
    type: String,
    required: true
  },
  patientGender: {
    type: String,
    required: true
  },
  patientWeight: {
    type: String,
    required: true
  },
  symptoms: {
    type: String,
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  doctorName: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  timeSlot: {
    type: String,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending'
  },
  amount: {
    type: Number,
    default: 200
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  cancellationReason: {
    type: String,
    trim: true,
    maxlength: 500
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

bookingSchema.index(
  { doctorId: 1, date: 1, timeSlot: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ['pending', 'confirmed', 'completed'] }
    }
  }
);

module.exports = mongoose.model('Booking', bookingSchema);

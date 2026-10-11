const mongoose = require('mongoose');

const doctorScheduleSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
    unique: true
  },
  availableDays: {
    type: [Number],
    default: [0, 1, 2, 3, 4, 5, 6]
  },
  timeSlots: {
    type: [String],
    default: []
  },
  unavailableDates: {
    type: [String],
    default: []
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('DoctorSchedule', doctorScheduleSchema);

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Patient = require('../models/Patient');
const { protect } = require('../middleware/auth');
const {
  RESET_TOKEN_TTL_MS,
  createResetToken,
  hashResetToken,
  isValidResetToken,
  getPasswordValidationError
} = require('../utils/passwordReset');
const {
  getPasswordResetEmailConfig,
  sendPasswordResetEmail
} = require('../utils/passwordResetEmail');

const router = express.Router();

const passwordResetResponseMessage = 'If an eligible account exists for that address, reset instructions may be sent. This response does not confirm whether the email is registered or whether delivery completed.';

// Register new patient
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!name || !normalizedEmail || !password || !phone) {
      return res.status(400).json({ message: 'Name, email, password, and phone are required.' });
    }

    // Check if patient already exists
    const patientExists = await Patient.findOne({ email: normalizedEmail });
    if (patientExists) {
      return res.status(400).json({ message: 'Patient already registered with this email' });
    }

    // Create new patient
    const patient = await Patient.create({
      name,
      email: normalizedEmail,
      password,
      phone
    });

    // Generate token
    const token = jwt.sign(
      { id: patient._id, role: 'patient' },
      process.env.JWT_SECRET || 'docconnect_secret_key_2024',
      { expiresIn: '30d' }
    );

    res.status(201).json({
      _id: patient._id,
      name: patient.name,
      email: patient.email,
      phone: patient.phone,
      role: 'patient',
      token
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login patient
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!normalizedEmail || typeof password !== 'string' || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Check if patient exists
    const patient = await Patient.findOne({ email: normalizedEmail });
    if (!patient) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await patient.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (patient.isActive === false) {
      return res.status(403).json({ message: 'Your account is inactive. Please contact support.' });
    }

    // Generate token
    const token = jwt.sign(
      { id: patient._id, role: 'patient' },
      process.env.JWT_SECRET || 'docconnect_secret_key_2024',
      { expiresIn: '30d' }
    );

    res.json({
      _id: patient._id,
      name: patient.name,
      email: patient.email,
      phone: patient.phone,
      role: 'patient',
      token
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/forgot-password', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';

  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Enter a valid email address.' });
  }

  if (!getPasswordResetEmailConfig()) {
    return res.status(503).json({
      message: 'Password reset email is not configured. Please contact support.'
    });
  }

  try {
    const patient = await Patient.findOne({ email }).select('_id').lean();
    if (patient) {
      const token = createResetToken();
      const tokenHash = hashResetToken(token);
      const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

      await Patient.updateOne(
        { _id: patient._id },
        { $set: { passwordResetTokenHash: tokenHash, passwordResetExpiresAt: expiresAt } }
      );

      try {
        await sendPasswordResetEmail(email, token);
      } catch (error) {
        console.error('Password reset email delivery failed:', error.message);
        await Patient.updateOne(
          { _id: patient._id, passwordResetTokenHash: tokenHash },
          { $unset: { passwordResetTokenHash: 1, passwordResetExpiresAt: 1 } }
        );
      }
    }

    return res.status(202).json({ message: passwordResetResponseMessage });
  } catch (error) {
    console.error('Password reset request failed:', error);
    return res.status(500).json({ message: 'Unable to process the request right now. Please try again later.' });
  }
});

router.post('/reset-password', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const { token, password } = req.body;

  if (!isValidResetToken(token)) {
    return res.status(400).json({ message: 'This reset link is invalid or has expired. Request a new one.' });
  }

  const passwordError = getPasswordValidationError(password);
  if (passwordError) {
    return res.status(400).json({ message: passwordError });
  }

  try {
    const tokenHash = hashResetToken(token);
    const validTokenQuery = {
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { $gt: new Date() }
    };
    const patient = await Patient.findOne(validTokenQuery).select('_id').lean();

    if (!patient) {
      return res.status(400).json({ message: 'This reset link is invalid or has expired. Request a new one.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const updatedPatient = await Patient.findOneAndUpdate(
      { _id: patient._id, ...validTokenQuery },
      {
        $set: { password: hashedPassword },
        $unset: { passwordResetTokenHash: 1, passwordResetExpiresAt: 1 }
      },
      { returnDocument: 'after', runValidators: true }
    ).select('_id');

    if (!updatedPatient) {
      return res.status(400).json({ message: 'This reset link is invalid or has expired. Request a new one.' });
    }

    return res.json({ message: 'Your password has been reset. You can now sign in.' });
  } catch (error) {
    console.error('Password reset failed:', error);
    return res.status(500).json({ message: 'Unable to reset your password right now. Please try again later.' });
  }
});

// Get patient profile (protected)
router.get('/profile', protect, async (req, res) => {
  try {
    const patient = await Patient.findById(req.user.id).select('-password');

    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

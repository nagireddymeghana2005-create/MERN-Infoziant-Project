require('dotenv').config();
const express = require('express');
const cors = require('cors');
const https = require('https');
const http = require('http');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/patient', require('./routes/patientRoutes'));
app.use('/api/doctor', require('./routes/doctorRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/booking', require('./routes/bookingRoutes'));

app.get('/', (req, res) => {
  res.send('DocConnect Backend Server');
});

// Health check endpoint for keep-alive ping (no data stored)
app.get('/ping', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Keep-alive: self-ping every 14 minutes so Render free tier doesn't spin down
 * (Render spins down after 15 min of inactivity on free plan)
 */
const startKeepAlive = (serverUrl) => {
  const PING_INTERVAL_MS = 14 * 60 * 1000; // 14 minutes

  setInterval(() => {
    const url = new URL('/ping', serverUrl);
    const lib = url.protocol === 'https:' ? https : http;
    const req = lib.get(url.toString(), (res) => {
      console.log(`[keep-alive] self-ping status: ${res.statusCode}`);
      res.resume(); // discard response body
    });
    req.on('error', (err) => {
      console.warn(`[keep-alive] self-ping error: ${err.message}`);
    });
    req.end();
  }, PING_INTERVAL_MS);

  console.log(`[keep-alive] self-ping configured every 14 min → ${serverUrl}/ping`);
};

/**
 * Keep-alive: mongoose ping every 10 minutes to prevent MongoDB Atlas connection timeout
 */
const startMongoKeepAlive = () => {
  const MONGO_PING_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

  setInterval(async () => {
    try {
      await mongoose.connection.db.admin().ping();
      console.log('[keep-alive] MongoDB ping: ok');
    } catch (err) {
      console.warn('[keep-alive] MongoDB ping failed:', err.message);
    }
  }, MONGO_PING_INTERVAL_MS);

  console.log('[keep-alive] MongoDB ping configured every 10 min');
};

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);

      // Keep-alive: runs locally and in production
      const selfUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
      startKeepAlive(selfUrl);
      startMongoKeepAlive();
    });
  })
  .catch((error) => {
    console.error('Server startup failed:', error.message);
    process.exitCode = 1;
  });

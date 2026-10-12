const assert = require('node:assert/strict');
const net = require('node:net');
const path = require('node:path');
const test = require('node:test');
const dotenv = require('dotenv');
const express = require('express');
const mongoose = require('mongoose');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { getMongoUri } = require('../config/db');
const Patient = require('../models/Patient');
const { hashResetToken } = require('../utils/passwordReset');

const createSmtpTestServer = () => {
  const messages = [];
  const server = net.createServer((socket) => {
    socket.setEncoding('utf8');
    socket.write('220 localhost ESMTP\r\n');

    let buffer = '';
    let messageLines = null;
    socket.on('data', (chunk) => {
      buffer += chunk;
      let newlineIndex = buffer.indexOf('\n');

      while (newlineIndex !== -1) {
        const line = buffer.slice(0, newlineIndex).replace(/\r$/, '');
        buffer = buffer.slice(newlineIndex + 1);

        if (messageLines) {
          if (line === '.') {
            messages.push(messageLines.join('\n'));
            messageLines = null;
            socket.write('250 Message accepted\r\n');
          } else {
            messageLines.push(line.startsWith('..') ? line.slice(1) : line);
          }
        } else if (/^EHLO\b/i.test(line) || /^HELO\b/i.test(line)) {
          socket.write('250-localhost\r\n250 AUTH PLAIN LOGIN\r\n');
        } else if (/^AUTH\b/i.test(line)) {
          socket.write('235 Authentication successful\r\n');
        } else if (/^(MAIL FROM|RCPT TO)\b/i.test(line)) {
          socket.write('250 Accepted\r\n');
        } else if (/^DATA\b/i.test(line)) {
          messageLines = [];
          socket.write('354 End data with <CR><LF>.<CR><LF>\r\n');
        } else if (/^RSET\b/i.test(line)) {
          socket.write('250 Reset\r\n');
        } else if (/^QUIT\b/i.test(line)) {
          socket.write('221 Bye\r\n');
        } else {
          socket.write('250 OK\r\n');
        }

        newlineIndex = buffer.indexOf('\n');
      }
    });
  });

  return {
    messages,
    listen: () => new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', () => {
        server.removeListener('error', reject);
        resolve(server.address().port);
      });
    }),
    close: () => new Promise((resolve) => server.close(resolve))
  };
};

test('patient password reset sends a one-time token and preserves login behavior', {
  timeout: 30000,
  skip: !process.env.MONGODB_URI
}, async (t) => {
  const smtp = createSmtpTestServer();
  const smtpPort = await smtp.listen();
  const mongoUri = getMongoUri();
  const testDatabase = `docconnect_password_reset_test_${process.pid}`;

  process.env.SMTP_HOST = '127.0.0.1';
  process.env.SMTP_PORT = String(smtpPort);
  process.env.SMTP_SECURE = 'false';
  process.env.SMTP_USER = 'test-user';
  process.env.SMTP_PASSWORD = 'test-password';
  process.env.SMTP_FROM = 'DOC-CONNECT Test <reset@example.test>';
  process.env.FRONTEND_URL = 'http://localhost:5173';
  process.env.JWT_SECRET = 'password-reset-test-secret';

  const app = express();
  app.use(express.json());
  app.use('/api/patient', require('../routes/patientRoutes'));

  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}/api/patient`;
  const email = `reset-${process.pid}@example.test`;
  let patient;

  t.after(async () => {
    server.close();
    await new Promise((resolve) => server.once('close', resolve));
    await smtp.close();
    if (mongoose.connection.readyState !== 0) {
      await Patient.deleteMany({ email });
      await mongoose.connection.dropDatabase();
      await mongoose.disconnect();
    }
  });

  await mongoose.connect(mongoUri, { dbName: testDatabase });
  patient = await Patient.create({
    name: 'Reset Flow Test',
    email,
    password: 'old-password-123',
    phone: '0000000000'
  });

  const post = async (pathName, body) => {
    const response = await fetch(`${baseUrl}/${pathName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return { response, data: await response.json() };
  };

  const unknownRequest = await post('forgot-password', { email: 'unknown@example.test' });
  const firstRequest = await post('forgot-password', { email });
  assert.equal(unknownRequest.response.status, 202);
  assert.equal(firstRequest.response.status, 202);
  assert.deepEqual(firstRequest.data, unknownRequest.data);
  assert.equal(smtp.messages.length, 1);

  const firstTokenMatch = smtp.messages[0].match(/[a-f0-9]{64}/i);
  assert.ok(firstTokenMatch, 'reset email should contain a reset token');
  const firstToken = firstTokenMatch[0];
  let storedPatient = await Patient.findById(patient._id)
    .select('+passwordResetTokenHash +passwordResetExpiresAt');
  assert.equal(storedPatient.passwordResetTokenHash, hashResetToken(firstToken));
  assert.notEqual(storedPatient.passwordResetTokenHash, firstToken);
  assert.ok(storedPatient.passwordResetExpiresAt > new Date());

  await Patient.updateOne(
    { _id: patient._id },
    { $set: { passwordResetExpiresAt: new Date(Date.now() - 1000) } }
  );
  const expiredAttempt = await post('reset-password', {
    token: firstToken,
    password: 'new-password-456'
  });
  assert.equal(expiredAttempt.response.status, 400);

  const secondRequest = await post('forgot-password', { email });
  assert.equal(secondRequest.response.status, 202);
  assert.equal(smtp.messages.length, 2);
  const secondTokenMatch = smtp.messages[1].match(/[a-f0-9]{64}/i);
  assert.ok(secondTokenMatch, 'second reset email should contain a reset token');
  const token = secondTokenMatch[0];
  assert.notEqual(token, firstToken);

  const weakPasswordAttempt = await post('reset-password', { token, password: 'short' });
  assert.equal(weakPasswordAttempt.response.status, 400);
  assert.match(weakPasswordAttempt.data.message, /at least 8 characters/);

  const successfulReset = await post('reset-password', {
    token,
    password: 'new-password-456'
  });
  assert.equal(successfulReset.response.status, 200);

  const reuseAttempt = await post('reset-password', {
    token,
    password: 'another-password-789'
  });
  assert.equal(reuseAttempt.response.status, 400);

  storedPatient = await Patient.findById(patient._id)
    .select('+passwordResetTokenHash +passwordResetExpiresAt');
  assert.equal(storedPatient.passwordResetTokenHash, undefined);
  assert.equal(storedPatient.passwordResetExpiresAt, undefined);
  assert.equal(await storedPatient.matchPassword('new-password-456'), true);
  assert.equal(await storedPatient.matchPassword('old-password-123'), false);

  const loginWithNewPassword = await post('login', { email, password: 'new-password-456' });
  const loginWithOldPassword = await post('login', { email, password: 'old-password-123' });
  assert.equal(loginWithNewPassword.response.status, 200);
  assert.equal(loginWithOldPassword.response.status, 401);
});

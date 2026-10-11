const nodemailer = require('nodemailer');

const getPasswordResetEmailConfig = () => {
  const { SMTP_HOST, SMTP_USER, SMTP_PASSWORD, SMTP_FROM, FRONTEND_URL } = process.env;
  const frontendUrl = typeof FRONTEND_URL === 'string' ? FRONTEND_URL.trim().replace(/\/+$/, '') : '';

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD || !SMTP_FROM || !frontendUrl) {
    return null;
  }

  let parsedFrontendUrl;
  try {
    parsedFrontendUrl = new URL(frontendUrl);
  } catch {
    return null;
  }

  if (!['http:', 'https:'].includes(parsedFrontendUrl.protocol)) {
    return null;
  }

  const port = Number(process.env.SMTP_PORT || 587);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return null;
  }

  return {
    host: SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
    from: SMTP_FROM,
    frontendUrl
  };
};

const sendPasswordResetEmail = async (email, token, config = getPasswordResetEmailConfig()) => {
  if (!config) {
    throw new Error('Password reset email is not configured.');
  }

  const resetUrl = `${config.frontendUrl}/patient/reset-password/${encodeURIComponent(token)}`;
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
  });

  try {
    return await transporter.sendMail({
      from: config.from,
      to: email,
      subject: 'Reset your DOC-CONNECT password',
      text: `Use this one-time link to reset your DOC-CONNECT password. It expires in 15 minutes:\n\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
      html: `<p>Use this one-time link to reset your DOC-CONNECT password. It expires in 15 minutes:</p><p><a href="${resetUrl}">Reset password</a></p><p>If you did not request this, you can ignore this email.</p>`
    });
  } finally {
    transporter.close();
  }
};

module.exports = { getPasswordResetEmailConfig, sendPasswordResetEmail };

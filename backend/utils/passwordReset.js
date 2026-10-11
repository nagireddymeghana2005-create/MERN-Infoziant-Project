const crypto = require('crypto');

const RESET_TOKEN_BYTES = 32;
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_BYTES = 72;

const createResetToken = () => crypto.randomBytes(RESET_TOKEN_BYTES).toString('hex');

const hashResetToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const isValidResetToken = (token) => typeof token === 'string' && /^[a-f0-9]{64}$/i.test(token);

const getPasswordValidationError = (password) => {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`;
  }

  if (Buffer.byteLength(password, 'utf8') > MAX_PASSWORD_BYTES) {
    return `Password must not exceed ${MAX_PASSWORD_BYTES} UTF-8 bytes.`;
  }

  return '';
};

module.exports = {
  RESET_TOKEN_TTL_MS,
  createResetToken,
  hashResetToken,
  isValidResetToken,
  getPasswordValidationError
};

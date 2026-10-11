# Patient password reset configuration

Patient password reset uses SMTP delivery. It does not send messages through a development or production fallback.

Configure these variables in `backend/.env`:

| Variable | Purpose |
| --- | --- |
| `SMTP_HOST` | SMTP server hostname |
| `SMTP_PORT` | SMTP port, normally `587` for STARTTLS or `465` for implicit TLS |
| `SMTP_SECURE` | `true` for implicit TLS (normally port 465), otherwise `false` |
| `SMTP_USER` | SMTP authentication username |
| `SMTP_PASSWORD` | SMTP authentication password or provider-issued app password |
| `SMTP_FROM` | Verified sender address, for example `DOC-CONNECT <no-reply@example.com>` |
| `FRONTEND_URL` | Frontend base URL used in reset links; use `http://localhost:5173` locally and HTTPS in production |

Keep the real `.env` file private and never commit SMTP credentials. The checked-in `.env.example` contains placeholders only. In production, configure a verified sender and HTTPS frontend URL before enabling reset requests.

## Flow and protections

- `POST /api/patient/forgot-password` accepts `{ "email": "..." }`.
- For valid requests, it returns the same generic response whether the patient exists or not. The response does not confirm account existence or email delivery.
- `POST /api/patient/reset-password` accepts `{ "token": "...", "password": "..." }`.
- Reset tokens contain 256 bits of cryptographic randomness, are valid for 15 minutes, and can be used once. MongoDB stores only their SHA-256 hashes.
- New passwords must be at least 8 characters and no more than 72 UTF-8 bytes. Passwords are hashed with bcrypt before the atomic token-consumption update.
- SMTP delivery errors are logged server-side and the corresponding token is invalidated. No plaintext password is emailed or stored.

## Verification

Run `npm test` from `backend`. The end-to-end reset test uses the configured MongoDB connection with a temporary isolated database and a local SMTP test server; it does not send email externally. Run `npm run build` from `frontend` to validate the UI.

# DOC-CONNECT

## Run locally

Run the backend from `backend` with `npm install` and `npm start`, then run the
frontend from `frontend` with `npm install` and `npm run dev`. The Vite
development server proxies `/api` requests to `http://localhost:5000`.

## Deploy to Render

Deploy the backend and frontend as separate Render services:

1. **Backend Web Service**
   - Root directory: `backend`
   - Build command: `npm install`
   - Start command: `npm start`
   - Add `MONGODB_URI` with the MongoDB Atlas connection string.
   - Add `MONGODB_DB=docconnect`.
   - Add `JWT_SECRET` with a long, random secret. Keep this identical across
     backend restarts so existing login tokens remain valid.
   - Add any needed mail settings (`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`,
     `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM`) for password reset email.

2. **Frontend Static Site**
   - Root directory: `frontend`
   - Build command: `npm install && npm run build`
   - Publish directory: `dist`
   - Add `VITE_API_URL` with the full public backend URL, for example
     `https://your-backend-service.onrender.com` (no trailing slash).
   - Trigger a new deploy after setting or changing this variable; Vite embeds
     it into the static frontend at build time.
   - Add a rewrite rule from `/*` to `/index.html` with status `200` so
     client-side routes continue to work on refresh.

The backend listens on Render's `PORT` and exposes `/` as its health-check
endpoint. Do not put database credentials or other secrets in frontend
environment variables.
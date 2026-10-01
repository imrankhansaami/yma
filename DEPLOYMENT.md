# YMA Bouncy Castle - Deployment Guide

> **Note:** this document describes the earlier Vercel deployment.
> For the current DigitalOcean + ServerAvatar setup, see **`DEPLOY-DIGITALOCEAN.md`**.

This repo is a monorepo with two apps:

| App | Path | Stack | Host |
|---|---|---|---|
| Frontend | `frontend/` | Next.js 15 (App Router), React Query, Zustand, Tailwind | Vercel |
| Backend | `backend/` | Express + TypeScript, Mongoose, JWT | Vercel (serverless) |
| Database | — | MongoDB (Atlas) | `MONGO_URI` env var |

---

## 1. How it fits together

```
Browser (ymabouncycastles.uk)
  │
  │  /api/v1/*  →  Next.js route handler (frontend/src/app/api/v1/[...path]/route.ts)
  │                 forwards server-side to NEXT_PUBLIC_SERVER_URI
  ▼
Backend (Express on Vercel)
  │  middlewares: protectRoute → isAdmin
  ▼
MongoDB Atlas  (database name is forced to "YMA" in backend/src/app/config/db.ts)
  ▲
  └─ Cloudinary (images) · Resend (email) · Google (OAuth / Maps)
```

Key point: the browser only talks to the **frontend** domain. The frontend proxies API
calls to the backend, so the backend URL is never exposed to the browser.

---

## 2. Environment variables

### Backend (`backend/.env` locally, or Vercel → Project → Settings → Environment Variables)

| Variable | Purpose |
|---|---|
| `NODE_ENV` | `production` in production |
| `MONGO_URI` | MongoDB Atlas connection string (db name forced to `YMA`) |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Long random strings |
| `JWT_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | e.g. `90d` / `30d` |
| `BCRYPT_SALT_ROUNDS` | e.g. `12` |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Image uploads |
| `RESEND_API_KEY` | **Required for all email** (order confirmations, invoices, verification) |
| `SENDER_EMAIL` / `EMAIL_FROM` / `EMAIL_FROM_NAME` | Email "from" identity |
| `ADMIN_EMAIL` / `SUPPORT_EMAIL` | Notification recipients |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_CALLBACK_URL` | Google sign-in |
| `REVALIDATION_SECRET` | Shared secret with frontend for ISR revalidation |
| `FRONTEND_URL` / `CORS_ORIGIN` / `CLIENT_URL` | Frontend origin(s) |
| `API_PUBLIC_URL` / `BASE_URL` | Public backend URL |

### Frontend (`frontend/.env` locally, or Vercel frontend project)

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SERVER_URI` | Backend URL the proxy forwards to (e.g. `https://<backend>.vercel.app`) |
| `REVALIDATION_SECRET` | Must equal the backend value |
| `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` | Google Maps embed (optional) |
| `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` / `NEXT_PUBLIC_GOOGLE_PLACES_PLACE_ID` | Live testimonials (optional) |

> ⚠️ **Config gotchas**
> - Do **not** leave a literal `\n` at the end of env values (Vercel CLI sometimes adds one).
>   It breaks CORS origin matching, the Google OAuth callback, and email links.
> - `NODE_ENV` must be `production` on the deployed backend.
> - `SENDGRID_*` and `EMAIL_HOST/PORT/USER/PASS` are **not used** by the code — the email
>   service only uses Resend (`RESEND_API_KEY`).
> - `PORT` is ignored on Vercel serverless.

---

## 3. Local development

```bash
# install (npm workspaces)
npm install

# run frontend + backend together
npm run dev
# or individually
npm run dev:frontend   # http://localhost:3000
npm run dev:backend    # http://localhost:8000 (PORT from backend/.env)
```

The backend needs `backend/.env` (copy from `backend/.env.example`) with at least
`MONGO_URI` and `JWT_SECRET`. Local MongoDB is available via `backend/docker-compose.yml`.

Frontend admin panel: http://localhost:3000/admin

---

## 4. Production deployment (Vercel)

Both apps deploy as **separate Vercel projects**.

### Step 1 — Database (MongoDB Atlas)
1. Create a cluster + database user.
2. Under Network Access, allow your deployment (Vercel) / IPs.
3. Copy the connection string into the backend's `MONGO_URI`. The app uses database `YMA`.

### Step 2 — Backend
1. Import `backend/` as a Vercel project (it uses `vercel.json` → `@vercel/node`).
2. Add all backend env vars above (see `backend/.env.example`).
3. Deploy and note the URL.

### Step 3 — Frontend
1. Import `frontend/` as a Vercel project (Next.js auto-detected).
2. Set `NEXT_PUBLIC_SERVER_URI` to the backend URL and the shared `REVALIDATION_SECRET`.
3. Deploy.

### Step 4 — Custom domain
1. In the frontend Vercel project → **Settings → Domains** → add your domain.
2. Add the DNS records Vercel shows at your registrar.
3. Add the domain to `allowedOrigins` in `backend/src/app.ts` if the backend is called
   directly from the browser, then redeploy the backend.

---

## 5. Admin access

The admin panel lives at `/admin` on the frontend (e.g. `https://<domain>/admin`).
Logged-out users are redirected to `/login`.

A demo admin can be created/updated with:

```bash
cd backend
$env:MONGO_URI = "mongodb+srv://..."
npm run seed:demo-admin
```

Defaults (overridable via `DEMO_ADMIN_EMAIL` / `DEMO_ADMIN_PASSWORD`):

- **Email:** `demo.admin@yma.test`
- **Password:** `YmaDemoAdmin2026!`
- **Role:** `admin`

> 🔐 The `isAdmin` middleware grants access to users whose `role` is `admin`/`superadmin`
> **or** whose email equals `DEMO_ADMIN_EMAIL`. Change the demo password (or create a
> dedicated admin) before going live, and never commit real secrets to this repo.

---

## 6. Admin endpoints quick reference

All under `/api/v1` and require an admin token:

| Endpoint | Purpose |
|---|---|
| `GET /orders/admin/dashboard-stats` | Dashboard KPI cards |
| `GET /orders/admin/revenue/over-time` | Revenue chart |
| `GET /orders/admin/all` | Orders table |
| `GET /admin/dashboard/summary` | Admin summary |
| `PATCH /orders/admin/:id/status` | Update order status |

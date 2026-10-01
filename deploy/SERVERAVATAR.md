# Deploying on ServerAvatar

This is a **monorepo with two processes**. ServerAvatar runs each as its own
application (and manages PM2 for you), so this guide creates **two apps from
the same repository**:

```
Internet -> nginx (ServerAvatar) -> Next.js :3000 -> Express :8001 -> MongoDB Atlas
                                          |
                            server-side proxy to 127.0.0.1:8001
```

The browser only ever talks to the frontend domain. The Express API stays on
loopback and is never exposed. This is why `NEXT_PUBLIC_SERVER_URI` points at
`127.0.0.1`.

---

## Why two apps

| | Frontend | Backend |
|---|---|---|
| Path | repo root (`npm start`) | `backend/` (`npm run start:backend`) |
| Process | `next start` | `node dist/server.js` |
| Port | 3000 | 8001 |
| Needs | MongoDB via the API | MongoDB, Cloudinary, Resend |

A single ServerAvatar app cannot run both, because the platform starts one
foreground process per application.

### Why the backend does not need a public domain

`NEXT_PUBLIC_SERVER_URI` is only read **on the server**:

```ts
// frontend/src/services/product.service.ts
if (typeof window === "undefined") {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URI;   // server only
  fetch(`${baseUrl}/api/v1/products/slug/${slug}`);
}
// in the browser it falls through to axios with baseURL "/api/v1",
// i.e. the request goes back through the frontend's own proxy route.
```

The axios client (`frontend/src/api/api.ts`) uses the relative base URL
`/api/v1`, so browser traffic is always proxied. Give the backend a temporary
domain if ServerAvatar requires one, but nothing needs to call it.

---

## Prerequisites (once)

1. A ServerAvatar **Node stack** server (the DigitalOcean droplet).
2. `git` and Node are handled by ServerAvatar; no manual PM2 install is needed.
3. MongoDB Atlas: allow the droplet's IP under **Network Access**.
   The cluster being `M0` free tier sleeps after idle, so the first request
   after a quiet period is slow.

---

## App 1 - Backend (create this FIRST)

ServerAvatar uses PM2 internally; the "PM2" section of the app dashboard shows
the process and its logs.

| Field | Value |
|---|---|
| Application Name | `yma-backend` |
| Method | Git |
| Provider | GitHub |
| Repository Type | Public (or Private + deploy key) |
| Clone HTTPS URL | `https://github.com/imrankhansaami/yma` |
| Branch | `main` |
| Rendering Type | Server Side Rendering |
| Package Manager | npm |
| Process Mode | Fork |
| **Port** | **8001** |
| Package Installation Command | `npm ci` |
| Build Command | `npm run build:backend` |
| Start App Command | `npm run start:backend` |

`npm ci` must run at the **repository root**. There is only one lockfile
(`package-lock.json` at the root); `backend/` and `frontend/` have none, so
installing inside a subdirectory fails. npm workspaces hoist dependencies to
the root `node_modules`, which is why this works.

### Backend environment variables

Set these in **Application Dashboard -> Settings -> Environment Variables**.
They feed `process.env`, which is read by `backend/src/app/config/config.ts`
and friends. Do not commit them.

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `8001` (must match the Port field) |
| `MONGO_URI` | Atlas connection string |
| `JWT_SECRET` | `openssl rand -base64 48` |
| `JWT_REFRESH_SECRET` | `openssl rand -base64 48` |
| `JWT_EXPIRES_IN` | `90d` |
| `JWT_COOKIE_EXPIRES_IN` | `90` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `JWT_REFRESH_EXPIRES_DAYS` | `7` |
| `BCRYPT_SALT_ROUNDS` | `12` |
| `FRONTEND_URL` | `https://<your-domain>` |
| `BASE_URL` | `https://<your-domain>` |
| `API_PUBLIC_URL` | `https://<your-domain>` |
| `CORS_ORIGIN` | `https://<your-domain>,https://www.<your-domain>` |
| `ADMIN_URL` | `https://<your-domain>/admin` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google Cloud OAuth client |
| `GOOGLE_CALLBACK_URL` | `https://<your-domain>/api/v1/auth/google/callback` |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | image uploads |
| `RESEND_API_KEY` | all transactional email |
| `SENDER_EMAIL` / `EMAIL_FROM` / `EMAIL_FROM_NAME` | email identity |
| `EMAIL_USER` / `ADMIN_EMAIL` / `SUPPORT_EMAIL` | recipients |
| `REVALIDATION_SECRET` | any long random string; must match the frontend |

---

## App 2 - Frontend

| Field | Value |
|---|---|
| Application Name | `yma-frontend` |
| Clone HTTPS URL | `https://github.com/imrankhansaami/yma` |
| Branch | `main` |
| Rendering Type | Server Side Rendering |
| Package Manager | npm |
| Process Mode | Fork |
| **Port** | **3000** |
| Package Installation Command | `npm ci` |
| Build Command | `npm run build:frontend` |
| Start App Command | `npm start` |

### Frontend environment variables

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `NEXT_PUBLIC_SERVER_URI` | `http://127.0.0.1:8001` |
| `REVALIDATION_SECRET` | same value as the backend |
| `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` | optional |
| `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` | optional (testimonials) |
| `NEXT_PUBLIC_GOOGLE_PLACES_PLACE_ID` | optional |

---

## Deploy order matters

Create and start the **backend first**, then the frontend.

The frontend's listing pages (`/blog`, `/booking-catalog`) are prerendered at
build time with `revalidate`, so they fetch from the API during
`npm run build:frontend`. There is no `generateStaticParams`, and the service
functions catch errors and return empty, so a missing backend will **not break
the build** - it silently produces empty listing pages that only fill in after
the first revalidation. Starting the backend first avoids that.

---

## Gotchas

- **`NEXT_PUBLIC_*` is inlined at build time.** Setting or changing
  `NEXT_PUBLIC_SERVER_URI` after a build has no effect. Rebuild the frontend
  whenever it changes.
- **`PORT` must be set explicitly.** `backend/src/app/config/config.ts`
  falls back to `5000` (`process.env.PORT || 5000`), which is neither the
  documented `8001` nor what the proxy expects. If `PORT` is missing the API
  listens on 5000 and every request fails. Set both the Port field and the
  `PORT` variable to `8001`.
- **`next start` respects `PORT`.** Make sure the frontend Port field is 3000.
- **`.env` files are not used in this setup.** Secrets live in the ServerAvatar
  UI. `backend/src/server.ts` calls `dotenv.config()`, which is harmless when
  no `.env` is present, because real values come from the environment already.
- **Build output is not committed.** `.next/`, `dist/` and `node_modules/` are
  gitignored; every deploy rebuilds them on the server.

---

## Verifying

From the ServerAvatar terminal or over SSH:

```bash
curl -fsS http://127.0.0.1:8001/healthz     # backend
curl -fsS http://127.0.0.1:3000/            # frontend
curl -fsS http://127.0.0.1:3000/api/v1/products?limit=1   # proxy chain
```

The third command is the one that matters: it proves nginx -> Next.js ->
Express -> MongoDB all work end to end.

Then from your machine:

```bash
DOMAIN=https://<your-domain> bash deploy/smoke-test.sh
```

---

## Switching the live domain

`ymabouncycastles.uk` currently resolves to WordPress + WooCommerce on
Hostinger, not to this droplet. Deploying here has no effect on the public
site until DNS is repointed.

That cutover needs a redirect map for the ~99 indexed URLs (the WordPress
scheme uses `/shop/`, `/my-account/`, `/faq/`, `/news/`, `/our-locations/`
and flat `/bouncy-castles-hire-in-<place>/` URLs, while this app uses
`/booking-catalog`, `/profile`, `/faqs`, `/blog/<slug>` and
`/locations/<slug>`). The redirect middleware in `frontend/src/middleware.ts`
reads from the database via `/api/v1/redirects/active`, so the map can be
loaded as data rather than code.

# Deploying YMA to a DigitalOcean droplet

Deployment guide for the YMA Bouncy Castle site: **Next.js frontend + Express backend on one
DigitalOcean droplet, managed by ServerAvatar, with the database staying on MongoDB Atlas.**

This supersedes the Vercel-oriented instructions in `DEPLOYMENT.md`.

---

## What you are deploying

```
Internet
  |
  v
nginx :443  (ServerAvatar: SSL + TLS termination)
  |
  v
Next.js :3000            <- PM2 process "yma-frontend"
  |  /api/v1/*  (server-side proxy, frontend/src/app/api/v1/[...path]/route.ts)
  v
Express :8001            <- PM2 process "yma-backend"
  |
  v
MongoDB Atlas  (cluster: simplifaiclients / db: YMA, forced in backend/src/app/config/db.ts)
  |
  +--> Cloudinary (images)  +--> SendGrid (email)  +--> Google (OAuth / Maps)
```

Two things follow from this diagram:

1. **Only port 3000 needs an nginx upstream.** Ports 3000 and 8001 stay bound to
   `127.0.0.1` and are never exposed.
2. **The database is not on this server.** You never install or back up MongoDB here.

---

## 0. Blockers to clear first

| # | Task | Why |
|---|---|---|
| 1 | **Resize the droplet** to at least 2 vCPU / 4 GB | `next build` peaks at 2-3 GB. On the current 512 MB it is OOM-killed every time. |
| 2 | **Rotate every secret** | `backend/.env` was shared in chat. Rotate `MONGO_URI` password, `JWT_SECRET`, `JWT_REFRESH_SECRET`, Cloudinary, Google, SendGrid. |
| 3 | **Remove local MongoDB** | Your data is on Atlas. A local `mongod` just consumes RAM and ~1.5 GB of disk. |
| 4 | **Delete the demo admin** | `demo.admin@yma.test` / `YmaDemoAdmin2026!` must not exist in production. |

### Resize the droplet

DigitalOcean control panel: **Power Off -> Resize -> 2 vCPU / 4 GB / 80 GB -> Power On**.
Disk can only grow, so this is one-way. The ServerAvatar agent survives a resize.

### Remove the local MongoDB

```bash
systemctl stop mongod 2>/dev/null
systemctl disable mongod 2>/dev/null
apt-get purge -y 'mongodb*' 'mongodb-org*' 2>/dev/null
rm -rf /var/lib/mongodb /var/log/mongodb
df -h /
```

---

## 1. DNS

At your registrar, point the domain at the droplet:

| Type | Host  | Value            | TTL |
|------|-------|------------------|-----|
| A    | `@`   | `<DROPLET_IP>` | 300 |
| A    | `www` | `<DROPLET_IP>` | 300 |

Confirm propagation **before** requesting SSL, or certificate issuance fails:

```powershell
nslookup example.com
```

---

## 2. Allow the droplet into MongoDB Atlas

Atlas -> **Network Access -> Add IP Address -> `<DROPLET_IP>`**.

Until this is done, the backend will start but every database query will hang and time out.

> If the cluster is an `M0` free tier it sleeps after 30 minutes idle, and the first request
> afterwards is slow while it wakes. That is expected, not a bug.

---

## 3. Put the code in Git

ServerAvatar deploys from Git, and right now this directory is not a repository.

```powershell
cd C:\Users\imran\Documents\yma\YMA-Website-main
git init -b main
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/<you>/yma-website.git
git push -u origin main
```

Use a **private** repository.

Before pushing, confirm no real secrets are staged:

```powershell
git status --porcelain | Select-String "\.env$|\.env\.production$"
```

That command must print **nothing**. `.env.example` and `.env.production.example` are
intentionally committed; the filled-in files are not.

---

## 4. First-time server setup

```bash
ssh root@<DROPLET_IP>
git clone https://github.com/<you>/yma-website.git /var/www/yma
cd /var/www/yma
bash deploy/setup-server.sh
```

`deploy/setup-server.sh` installs git, Node 22 and PM2, and creates a swap file. It
deliberately does not touch nginx or the firewall, because ServerAvatar owns those.

---

## 5. Environment files

```bash
cd /var/www/yma

cp backend/.env.production.example  backend/.env
cp frontend/.env.production.example frontend/.env.production

nano backend/.env
nano frontend/.env.production
```

Fill in the real values. Two rules matter:

* **`REVALIDATION_SECRET` must be identical in both files.** Generate one value with
  `openssl rand -base64 48` and paste it into both. If they differ, admin edits still work
  but the public pages only refresh after the 5-minute ISR window instead of immediately.
* **`NEXT_PUBLIC_*` values are baked in at build time.** They must be present *before* you
  run the frontend build.

Lock the files down:

```bash
chmod 600 backend/.env frontend/.env.production
```

---

## 6. Build and start

```bash
cd /var/www/yma
npm ci                  # root install; workspaces install frontend + backend

npm run build:backend   # tsc -> backend/dist
npm run build:frontend  # next build -> frontend/.next

pm2 start ecosystem.config.js
pm2 save
```

Verify the processes came up and can reach Atlas:

```bash
pm2 status
curl -s http://127.0.0.1:8001/healthz
curl -I http://127.0.0.1:3000/
pm2 logs yma-backend --lines 40
```

If the build mysteriously dies with no error, it was the OOM killer:

```bash
journalctl -k | grep -i -E "oom|killed process" | tail
```

That means the droplet is still too small.

---

## 7. Nginx and SSL (ServerAvatar)

In the ServerAvatar panel:

1. **Applications -> Add -> Node.js** (or create a site for the domain). Let ServerAvatar
   issue the Let's Encrypt certificate for **both** `example.com` and
   `www.example.com`, with auto-renewal on.
2. Open the application's **Nginx configuration** editor and replace the generated vhost
   with the contents of `deploy/nginx-yma.conf`, updating the `ssl_certificate` paths to
   the ones ServerAvatar shows on the SSL tab.
3. Save and reload.

If you prefer to manage nginx directly instead of through the panel:

```bash
cp /var/www/yma/deploy/nginx-yma.conf /etc/nginx/sites-available/yma.conf
ln -sf /etc/nginx/sites-available/yma.conf /etc/nginx/sites-enabled/yma.conf
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

Same TLS configuration as the app's `X-Frame-Options`/HSTS headers, so both layers agree.

> **Port 80 must stay open** for ACME validation, or certificate renewal fails silently
> 60 days from now.
>
> **`http2 on;` needs nginx >= 1.25.1.** If `nginx -t` rejects it, follow the note at the
> bottom of `deploy/nginx-yma.conf`.

---

## 8. Google OAuth

The backend derives the callback URL from the incoming request host, so no code change is
needed. Google just has to know about it:

Google Cloud Console -> **APIs & Services -> Credentials** -> your OAuth 2.0 Client ID:

* **Authorized JavaScript origins**: `https://example.com`
* **Authorized redirect URIs**: `https://example.com/api/v1/auth/google/callback`

---

## 9. Verify

```bash
cd /var/www/yma
bash deploy/smoke-test.sh
```

Then in a browser, check each of these:

- [ ] Homepage loads with real products and all locations
- [ ] `/booking-catalog` shows products, not skeletons
- [ ] `/admin` login works
- [ ] **Edit something in admin** (e.g. publish a blog post) and confirm the public page
      updates within a few seconds. This proves the ISR secret matches.
- [ ] Submit a booking end to end
- [ ] Google sign-in completes
- [ ] Image upload works (Cloudinary)
- [ ] `/contact` renders the Google Maps embed (the `X-Frame-Options` header interacts
      with iframes, so verify this one specifically)

---

## 10. Deploying updates

```bash
ssh root@<DROPLET_IP>
cd /var/www/yma
bash deploy/deploy.sh
```

That script pulls, reinstalls, rebuilds both apps and reloads PM2 with no downtime.

Useful commands:

```bash
pm2 status
pm2 logs yma-frontend --lines 100
pm2 logs yma-backend  --lines 100
pm2 monit
pm2 restart yma-frontend
```

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Build exits silently, no error | OOM killer | Resize droplet, or add swap |
| `502 Bad Gateway` from nginx | PM2 process down | `pm2 status`, `pm2 logs` |
| Site loads, API calls fail | Backend can't reach Atlas | Add droplet IP to Atlas Network Access |
| Admin edits take ~5 min to appear | `REVALIDATION_SECRET` mismatch | Make both values identical, rebuild frontend |
| Google sign-in redirect URI error | Callback not whitelisted | Add it in Google Cloud Console |
| Images broken | Cloudinary creds wrong or missing | Check `backend/.env`, `pm2 restart yma-backend` |
| Env change had no effect on frontend | `NEXT_PUBLIC_*` is build-time | Rebuild: `npm run build:frontend && pm2 restart yma-frontend` |
| Disk filling up | Old `.next` build output | `pm2 flush`, clear old builds, expand disk |

---

## Files added for this deployment

| File | Purpose |
|---|---|
| `ecosystem.config.js` | PM2 definitions for both apps with memory ceilings |
| `deploy/setup-server.sh` | One-time server provisioning (Node, PM2, swap) |
| `deploy/deploy.sh` | Pull + rebuild + zero-downtime reload |
| `deploy/nginx-yma.conf` | nginx vhost with TLS, gzip, proxy settings |
| `deploy/smoke-test.sh` | Post-deploy verification |
| `backend/.env.production.example` | Backend environment template |
| `frontend/.env.production.example` | Frontend environment template |

Run the shell scripts with `bash deploy/<script>.sh` — they do not need the executable bit.

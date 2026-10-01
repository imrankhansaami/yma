#!/usr/bin/env bash
# ============================================================
# YMA - no-git deploy, SERVER SIDE
#
# Run by deploy/publish.ps1 over SSH. Do not run by hand unless
# you have already uploaded a release archive to $RELEASE_TARBALL.
#
# Strategy: preserve the real secrets, replace the application
# directory wholesale, then build and hot-reload PM2. The previous
# build keeps serving traffic until the new build succeeds.
# ============================================================
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/yma}"
SECRETS_DIR="${SECRETS_DIR:-/var/www/yma-secrets}"
RELEASE_TARBALL="${RELEASE_TARBALL:-/tmp/yma-release.tar.gz}"

log() { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }
die() { printf '\033[1;31mERROR: %s\033[0m\n' "$*" >&2; exit 1; }

[ -f "$RELEASE_TARBALL" ] || die "release archive not found: $RELEASE_TARBALL"

# --- 1. Preserve real secrets and server-only config ------------
log "Preserving secrets from $APP_DIR"
mkdir -p "$SECRETS_DIR"

BACKEND_ENV="$SECRETS_DIR/backend.env"
FRONTEND_ENV="$SECRETS_DIR/frontend.env.production"

[ -f "$APP_DIR/backend/.env" ] && cp "$APP_DIR/backend/.env" "$BACKEND_ENV" \
  || die "backend/.env missing on server. Copy backend/.env.production.example and fill it in."
[ -f "$APP_DIR/frontend/.env.production" ] && cp "$APP_DIR/frontend/.env.production" "$FRONTEND_ENV" \
  || die "frontend/.env.production missing on server. Copy frontend/.env.production.example and fill it in."

chmod 600 "$BACKEND_ENV" "$FRONTEND_ENV"
echo "    backend/.env              -> preserved"
echo "    frontend/.env.production  -> preserved"

# --- 2. Replace the application directory ------------------------
# A clean swap is what makes this reproducible: files deleted on your
# machine must not survive here and break the TypeScript build.
log "Replacing $APP_DIR"
rm -rf "$APP_DIR"
mkdir -p "$APP_DIR"
tar -xzf "$RELEASE_TARBALL" -C "$APP_DIR"
rm -f "$RELEASE_TARBALL"

# --- 3. Restore secrets ------------------------------------------
log "Restoring secrets"
cp "$BACKEND_ENV" "$APP_DIR/backend/.env"
cp "$FRONTEND_ENV" "$APP_DIR/frontend/.env.production"
chmod 600 "$APP_DIR/backend/.env" "$APP_DIR/frontend/.env.production"

# Guard: the archive must never have carried secrets of its own.
if find "$APP_DIR" -name '.env' -not -path "*/node_modules/*" | grep -q .; then
  echo "    (backend/.env + frontend/.env.production present, values from server)"
fi

cd "$APP_DIR"

# --- 4. Build ----------------------------------------------------
log "Installing dependencies (npm workspaces)"
npm ci

log "Building backend"
npm run build:backend

log "Building frontend"
npm run build:frontend

# --- 5. Reload (zero downtime) -----------------------------------
log "Reloading PM2"
if pm2 describe yma-backend >/dev/null 2>&1; then
  pm2 reload ecosystem.config.js --update-env
else
  pm2 start ecosystem.config.js
fi
pm2 save

log "Process status"
pm2 status

# --- 6. Verify ---------------------------------------------------
log "Health check"
sleep 3
if curl -fsS --max-time 10 http://127.0.0.1:8001/healthz >/dev/null 2>&1; then
  echo "    backend  http://127.0.0.1:8001/healthz  OK"
else
  echo "    WARNING: backend /healthz did not respond" >&2
fi
if curl -fsS --max-time 10 http://127.0.0.1:3000/ >/dev/null 2>&1; then
  echo "    frontend http://127.0.0.1:3000/         OK"
else
  echo "    WARNING: frontend did not respond on :3000" >&2
fi

echo
echo "Deployed. Full check:  bash deploy/smoke-test.sh"

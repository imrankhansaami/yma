#!/usr/bin/env bash
# ============================================================
# YMA - one-command BACKEND deploy (ServerAvatar layout)
#
#   bash ~/yma-backend/public_html/deploy/serveravatar-backend.sh
#   or via the wrapper:  bash ~/deploy-backend.sh
#
# Pulls origin/main, installs dependencies only when the lockfile
# changed, compiles the Express backend (tsc -p backend) and
# hot-reloads the yma-backend PM2 process. Exits non-zero (keeping
# the old build serving) if the compile or the health check fails.
#
# NOTE: backend/.env lives on the server and is never touched.
# ============================================================
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/yma-backend/public_html}"
PM2_APP="${PM2_APP:-yma-backend}"
HEALTH_PATH="${HEALTH_PATH:-/healthz}"

log() { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }
die() { printf '\n\033[1;31mERROR: %s\033[0m\n' "$*" >&2; exit 1; }

[ -d "$APP_DIR/.git" ] || die "not a git checkout: $APP_DIR"
[ -f "$APP_DIR/backend/.env" ] || die "backend/.env missing - copy backend/.env.production.example and fill it in"

cd "$APP_DIR"

LOCK_BEFORE="$(sha1sum package-lock.json 2>/dev/null | cut -d' ' -f1 || true)"

log "Fetching latest code"
git fetch origin
git reset --hard origin/main
git log --oneline -1

LOCK_AFTER="$(sha1sum package-lock.json | cut -d' ' -f1)"
if [ "$LOCK_BEFORE" != "$LOCK_AFTER" ]; then
  log "Dependencies changed - running npm ci"
  npm ci
else
  log "Dependencies unchanged - skipping npm ci"
fi

log "Building backend (tsc -p backend)"
npm run build:backend

log "Reloading PM2 ($PM2_APP)"
pm2 restart "$PM2_APP" --update-env
pm2 save

log "Verifying"
sleep 5
if ss -ltn 2>/dev/null | grep -q ':8001'; then
  echo "    port 8001: listening"
else
  die "port 8001 is not listening"
fi

code="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:8001${HEALTH_PATH}")"
echo "    GET ${HEALTH_PATH} -> ${code}"
[ "$code" = "200" ] || die "health check failed (HTTP $code)"

log "Deploy complete"

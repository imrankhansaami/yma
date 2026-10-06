#!/usr/bin/env bash
# ============================================================
# YMA - one-command FRONTEND deploy (ServerAvatar layout)
#
#   bash ~/ymabouncy/public_html/deploy/serveravatar-frontend.sh
#   or via the wrapper:  bash ~/deploy.sh
#
# Pulls origin/main, installs dependencies only when the lockfile
# changed, rebuilds the Next.js frontend and hot-reloads the PM2
# process. Exits non-zero (keeping the old build serving) if the
# build or the health check fails.
# ============================================================
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/ymabouncy/public_html}"
FRONTEND_DIR="$APP_DIR/frontend"
PM2_APP="${PM2_APP:-ymabouncy}"
HEALTH_PATH="${HEALTH_PATH:-/faqs}"

log() { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }
die() { printf '\n\033[1;31mERROR: %s\033[0m\n' "$*" >&2; exit 1; }

[ -d "$APP_DIR/.git" ] || die "not a git checkout: $APP_DIR"
[ -f "$FRONTEND_DIR/package.json" ] || die "frontend not found at $FRONTEND_DIR"

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

log "Building frontend"
cd "$FRONTEND_DIR"
# This droplet is small (~2 GB RAM). Cap the build heap so `next build` does
# not get OOM-killed, and recover from a stale `.next/types` if it appears.
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=1200}"
export NEXT_TELEMETRY_DISABLED=1
if ! npm run build; then
  log "Build failed - clearing stale .next and retrying once"
  rm -rf .next
  npm run build
fi

log "Reloading PM2 ($PM2_APP)"
pm2 restart "$PM2_APP" --update-env
pm2 save

log "Verifying"
sleep 5
if ss -ltn 2>/dev/null | grep -q ':3000'; then
  echo "    port 3000: listening"
else
  die "port 3000 is not listening"
fi

code="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:3000${HEALTH_PATH}")"
echo "    GET ${HEALTH_PATH} -> ${code}"
[ "$code" = "200" ] || die "health check failed (HTTP $code)"

# A partial .next still serves HTML but 404s/400s its JS chunks, so check one.
chunk="$(curl -s "http://127.0.0.1:3000/" | grep -oE '/_next/static/chunks/[^"]+\.js' | head -1 || true)"
if [ -n "$chunk" ]; then
  asset_code="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:3000${chunk}")"
  echo "    asset ${chunk} -> ${asset_code}"
  [ "$asset_code" = "200" ] || die "static asset check failed (HTTP $asset_code)"
fi

echo "    BUILD_ID: $(cat "$FRONTEND_DIR/.next/BUILD_ID" 2>/dev/null || echo unknown)"

log "Deploy complete"

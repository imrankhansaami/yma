#!/usr/bin/env bash
# ============================================================
# YMA - deploy / update the running site
#
#   sudo bash deploy/deploy.sh
#
# Pulls the latest code, reinstalls dependencies, rebuilds both apps and
# reloads PM2 with zero downtime.
# ============================================================
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/yma}"
cd "${APP_DIR}"

log() { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }

if [ ! -f backend/.env ]; then
  echo "ERROR: backend/.env is missing. Copy backend/.env.production.example first." >&2
  exit 1
fi

if [ ! -f frontend/.env.production ]; then
  echo "ERROR: frontend/.env.production is missing. Copy frontend/.env.production.example first." >&2
  exit 1
fi

log "Fetching latest code"
git pull --ff-only

log "Installing dependencies (root, workspaces)"
npm ci

log "Building backend"
npm run build:backend

log "Building frontend"
npm run build:frontend

log "Reloading processes"
if pm2 describe yma-backend >/dev/null 2>&1; then
  pm2 reload ecosystem.config.js --update-env
else
  pm2 start ecosystem.config.js
fi
pm2 save

log "Process status"
pm2 status

echo
echo "Deployed. Verify with:  bash deploy/smoke-test.sh"

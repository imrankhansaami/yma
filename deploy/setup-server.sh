#!/usr/bin/env bash
# ============================================================
# YMA - one-time server provisioning (DigitalOcean droplet)
#
# Safe to re-run. Deliberately does NOT touch nginx or the firewall,
# because ServerAvatar manages those.
#
#   sudo bash deploy/setup-server.sh
#
# Override defaults with env vars, e.g.
#   sudo APP_DIR=/var/www/yma SWAP_SIZE_GB=4 bash deploy/setup-server.sh
# ============================================================
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/yma}"
SWAP_SIZE_GB="${SWAP_SIZE_GB:-2}"
NODE_MAJOR="${NODE_MAJOR:-22}"

log()  { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }
warn() { printf '\n\033[1;33m!! %s\033[0m\n' "$*"; }

log "Installing base packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y git curl ca-certificates

log "Node.js ${NODE_MAJOR}.x"
if command -v node >/dev/null 2>&1; then
  echo "already installed: $(node -v)"
else
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
  apt-get install -y nodejs
  echo "installed: $(node -v)"
fi

log "PM2"
if ! command -v pm2 >/dev/null 2>&1; then
  npm install -g pm2
fi
pm2 --version

log "Swap file (${SWAP_SIZE_GB} GB)"
if swapon --show | grep -q '/swapfile'; then
  echo "swap already active"
else
  if [ ! -f /swapfile ]; then
    fallocate -l "${SWAP_SIZE_GB}G" /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=$((SWAP_SIZE_GB * 1024))
    chmod 600 /swapfile
    mkswap /swapfile
  fi
  swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi
swapon --show

log "Application directory: ${APP_DIR}"
mkdir -p "${APP_DIR}"

log "PM2 boot hook"
pm2 startup systemd -u root --hp /root >/dev/null 2>&1 || true
echo "PM2 will be (re)saved when you start the apps."

log "Done."
cat <<EOF

Next steps:
  1. Clone the repo into ${APP_DIR}
  2. Create backend/.env and frontend/.env.production from the .example files
  3. npm ci && npm run build:backend && npm run build:frontend
  4. pm2 start ecosystem.config.js && pm2 save

EOF
warn "Building this Next.js app peaks around 2-3 GB of RAM. A 512 MB droplet will be OOM-killed."
warn "Confirm the droplet has at least 2 vCPU / 4 GB before building."

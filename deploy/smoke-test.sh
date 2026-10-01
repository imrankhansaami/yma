#!/usr/bin/env bash
# ============================================================
# YMA - post-deploy smoke test
#
#   bash deploy/smoke-test.sh
#   DOMAIN=https://staging.example.com bash deploy/smoke-test.sh
# ============================================================
set -uo pipefail

DOMAIN="${DOMAIN:-https://example.com}"
fail=0

check() {
  local label="$1"; shift
  local code
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 60 "$@" 2>/dev/null || echo "000")
  if [ "$code" = "200" ]; then
    printf '  [PASS] %-38s %s\n' "$label" "$code"
  else
    printf '  [FAIL] %-38s %s\n' "$label" "$code"
    fail=1
  fi
}

echo "== PM2 processes =="
if command -v pm2 >/dev/null 2>&1; then
  pm2 jlist 2>/dev/null | node -e '
    let s = "";
    process.stdin.on("data", d => (s += d)).on("end", () => {
      try {
        const apps = JSON.parse(s);
        if (!apps.length) return console.log("  (no processes registered)");
        apps.forEach(a =>
          console.log("  " + a.name.padEnd(16) + (a.pm2_env?.status ?? "?"))
        );
      } catch {
        console.log("  (could not parse pm2 output)");
      }
    });'
else
  echo "  pm2 not installed"
fi

echo
echo "== Local upstreams =="
check "backend  http://127.0.0.1:8001/healthz" http://127.0.0.1:8001/healthz
check "frontend http://127.0.0.1:3000/"        http://127.0.0.1:3000/

echo
echo "== Public site (${DOMAIN}) =="
check "homepage"             "${DOMAIN}/"
check "booking catalog"      "${DOMAIN}/booking-catalog"
check "locations"            "${DOMAIN}/locations"
check "blog"                 "${DOMAIN}/blog"
check "admin (login page)"   "${DOMAIN}/admin"
check "API proxy -> Atlas"   "${DOMAIN}/api/v1/products?limit=1"
check "sitemap.xml"          "${DOMAIN}/sitemap.xml"
check "robots.txt"           "${DOMAIN}/robots.txt"

echo
if [ "$fail" -eq 0 ]; then
  echo "All checks passed."
else
  echo "Some checks FAILED - see above."
fi
exit "$fail"

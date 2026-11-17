/**
 * PM2 process definitions for the YMA stack on a single DigitalOcean droplet.
 *
 * This is an npm workspaces monorepo, so dependencies (including `next`) are
 * hoisted to the repository-root node_modules. Both entries below therefore
 * reference the root when locating binaries.
 *
 *   pm2 start ecosystem.config.js
 *   pm2 save
 *
 * To apply changes after a deploy:
 *
 *   pm2 reload ecosystem.config.js --update-env
 */
const path = require("path");

const ROOT = __dirname;

module.exports = {
  apps: [
    {
      name: "yma-backend",
      cwd: path.join(ROOT, "backend"),
      script: path.join(ROOT, "backend", "dist", "server.js"),
      exec_mode: "fork",
      instances: 1,
      max_memory_restart: "400M",
      kill_timeout: 10000,
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "yma-frontend",
      cwd: path.join(ROOT, "frontend"),
      // Next's standalone output is the supported server entry once
      // `output: "standalone"` is set in frontend/next.config.ts (Hostinger's
      // runtime starts the same bundle).
      script: path.join(
        ROOT,
        "frontend",
        ".next",
        "standalone",
        "frontend",
        "server.js",
      ),
      exec_mode: "fork",
      instances: 1,
      max_memory_restart: "900M",
      kill_timeout: 10000,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "127.0.0.1",
      },
    },
  ],
};

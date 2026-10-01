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
      // `next` lives in the root node_modules because of workspace hoisting.
      script: path.join(ROOT, "node_modules", "next", "dist", "bin", "next"),
      args: "start --port 3000 --hostname 127.0.0.1",
      exec_mode: "fork",
      instances: 1,
      max_memory_restart: "900M",
      kill_timeout: 10000,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};

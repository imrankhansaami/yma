/**
 * Hostinger's Next.js runtime starts the standalone server from
 * `.next/standalone/server.js`. This is an npm-workspaces monorepo, so Next
 * nests the entry under the workspace path (`.next/standalone/frontend/
 * server.js`) and puts the traced `node_modules` at the standalone root.
 *
 * Mirror the nested entry at the flat location their launcher expects. It is
 * inert everywhere else (and skipped when a flat entry already exists).
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd(), ".next", "standalone");
const nested = path.join(root, "frontend", "server.js");
const flat = path.join(root, "server.js");

if (!fs.existsSync(root)) {
  console.log("[standalone-shim] no standalone output - nothing to do");
} else if (!fs.existsSync(nested)) {
  console.log("[standalone-shim] nested entry not found - nothing to do");
} else if (fs.existsSync(flat)) {
  console.log("[standalone-shim] flat entry already exists - nothing to do");
} else {
  fs.writeFileSync(flat, 'require("./frontend/server.js");\n');
  console.log("[standalone-shim] wrote", flat);
}

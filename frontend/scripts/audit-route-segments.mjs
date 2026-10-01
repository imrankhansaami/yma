import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const APP_DIR = join(process.cwd(), "src", "app");
const ROUTE_FILE_NAMES = new Set([
  "page.tsx",
  "layout.tsx",
  "error.tsx",
  "not-found.tsx",
  "route.ts",
  "default.tsx",
]);

function isDynamicSegment(segment) {
  return /^\[\[?\.{0,3}[a-zA-Z0-9_-]+\]?\]$/.test(segment);
}

function isRouteGroup(segment) {
  return /^\(.+\)$/.test(segment);
}

function isValidStaticSegment(segment) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(segment);
}

function walk(dir, routeSegments = [], violations = []) {
  const entries = readdirSync(dir);
  const hasRouteFile = entries.some((entry) => ROUTE_FILE_NAMES.has(entry));

  if (hasRouteFile) {
    for (const segment of routeSegments) {
      if (!segment || isRouteGroup(segment) || isDynamicSegment(segment)) continue;
      if (!isValidStaticSegment(segment)) {
        violations.push({
          route: `/${routeSegments.filter((s) => !isRouteGroup(s)).join("/")}`.replace(
            /\/+/g,
            "/",
          ),
          segment,
          path: relative(process.cwd(), dir),
        });
      }
      if (segment.includes("_")) {
        violations.push({
          route: `/${routeSegments.filter((s) => !isRouteGroup(s)).join("/")}`.replace(
            /\/+/g,
            "/",
          ),
          segment,
          path: relative(process.cwd(), dir),
          reason: "underscore_not_allowed",
        });
      }
    }
  }

  for (const entry of entries) {
    const abs = join(dir, entry);
    if (!statSync(abs).isDirectory()) continue;
    walk(abs, [...routeSegments, entry], violations);
  }

  return violations;
}

const violations = walk(APP_DIR);

if (violations.length === 0) {
  console.log("Route segment audit passed.");
  process.exit(0);
}

console.error("Route segment audit failed:");
violations.forEach((violation) => {
  console.error(
    `- ${violation.route} | segment="${violation.segment}" | path=${violation.path}${violation.reason ? ` | reason=${violation.reason}` : ""}`,
  );
});
process.exit(1);

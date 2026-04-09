#!/usr/bin/env node
/**
 * Ensures root mcp.json pins the same version as mcp/package.json.
 * Run from repo root: node scripts/check-mcp-version.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "mcp/package.json"), "utf8"));
const mcp = JSON.parse(fs.readFileSync(path.join(root, "mcp.json"), "utf8"));

const args = mcp.mcpServers?.redmine?.args;
const joined = Array.isArray(args) ? args.join(" ") : "";
const m = joined.match(/redmine-cursor-mcp@([\d.]+)/);

if (!m) {
  console.error(
    "check-mcp-version: could not find redmine-cursor-mcp@X.Y.Z in mcp.json redmine.args (expected e.g. [\"-y\", \"redmine-cursor-mcp@0.1.0\"])"
  );
  process.exit(1);
}

const pinned = m[1];
if (pinned !== pkg.version) {
  console.error(
    `check-mcp-version: mismatch — mcp.json pins redmine-cursor-mcp@${pinned}, mcp/package.json is ${pkg.version}`
  );
  process.exit(1);
}

console.log(`check-mcp-version: OK (${pkg.version})`);

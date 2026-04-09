#!/usr/bin/env bash
# Copy this plugin into ~/.cursor/plugins/local/ for local testing.
# Cursor often fails to load plugins that are only symlinked (see cursor/plugins#35).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="${HOME}/.cursor/plugins/local/redmine-plugin"

mkdir -p "$(dirname "$DEST")"

if command -v rsync >/dev/null 2>&1; then
  rsync -a --delete \
    --exclude node_modules \
    --exclude .git \
    --exclude .idea \
    --exclude .cursor \
    "${ROOT}/" "${DEST}/"
else
  rm -rf "${DEST}"
  mkdir -p "${DEST}"
  cp -R "${ROOT}/." "${DEST}/"
  rm -rf "${DEST}/node_modules" "${DEST}/.git" "${DEST}/.idea" 2>/dev/null || true
fi

echo "Installed to: ${DEST}"
echo "Next: Cursor → Command Palette → Developer: Reload Window"
echo "MCP: plugin uses npx redmine-cursor-mcp@… (must be published to npm; see README)."
echo "Env: REDMINE_BASE_URL + REDMINE_API_KEY in shell profile, full Cursor restart."

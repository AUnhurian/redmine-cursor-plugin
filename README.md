# Redmine plugin for Cursor

Connect Cursor to your Redmine instance. Fetch issues with full context, comments, and image attachments via MCP.

## Setup

The plugin requires two environment variables set on your system (not in project files).

| Variable | Required | Description |
|---|---|---|
| `REDMINE_BASE_URL` | yes | Your Redmine instance URL, e.g. `https://redmine.example.com` |
| `REDMINE_API_KEY` | yes | Your Redmine API key (found in My account > API access key) |

### macOS / Linux

Add to your shell profile (`~/.zshrc`, `~/.bashrc`, or equivalent):

```bash
export REDMINE_BASE_URL="https://redmine.example.com"
export REDMINE_API_KEY="your-api-key-here"
```

Then restart Cursor (it reads env from the shell profile at launch).

### Verify

Open Cursor Settings > MCP. The **redmine** server should appear as connected. Ask the agent:

> Get Redmine issue #12345

## Available tools

| Tool | Description |
|---|---|
| `get_redmine_issue` | Fetch a Redmine issue by ID with metadata, comments, and image attachments |

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `issueId` | integer | yes | — | Redmine issue ID |
| `includeImages` | boolean | no | `true` | Download and embed image attachments |

## How the MCP server is started

The plugin runs the server via **`npx -y redmine-cursor-mcp@<version>`** (version pinned in [`mcp.json`](mcp.json)). That pulls the **npm package** `redmine-cursor-mcp` and runs its `bin`, so the plugin folder path on disk (`~/.cursor/plugins/local/…`, marketplace cache, etc.) **does not affect** MCP.

**Requirement:** the package must be **published to npm** at the version referenced in `mcp.json`. Until you publish, end users will not get a working MCP from the plugin alone.

### Publish the MCP package (maintainers)

From `mcp/`:

```bash
cd mcp
npm run build
npm publish
```

`prepublishOnly` runs typecheck, build, and [`scripts/check-mcp-version.mjs`](scripts/check-mcp-version.mjs) so the version in [`mcp/package.json`](mcp/package.json) matches the pin in root [`mcp.json`](mcp.json).

When you release a new version:

1. Bump `version` in `mcp/package.json`.
2. Bump the pin in root `mcp.json` (`redmine-cursor-mcp@X.Y.Z`).
3. Run `node scripts/check-mcp-version.mjs` from the repo root.
4. `cd mcp && npm publish`.

If the package name `redmine-cursor-mcp` is already taken on npm, rename `name` in `mcp/package.json` and update the `args` entry in `mcp.json` accordingly (e.g. scoped `@your-scope/redmine-cursor-mcp`).

### Local testing in Cursor (full plugin folder)

1. **Publish** `redmine-cursor-mcp` at least once (or use the dev workaround below).
2. Copy the plugin into `~/.cursor/plugins/local/redmine-plugin/` — **avoid symlinks** for now: [cursor/plugins#35](https://github.com/cursor/plugins/issues/35).
3. **Developer: Reload Window** (or restart Cursor).
4. Set `REDMINE_BASE_URL` / `REDMINE_API_KEY`, **quit Cursor completely**, open again.
5. **Settings → MCP** → server **redmine** should connect.

```bash
./scripts/sync-to-cursor-local.sh
```

Re-run after manifest/logo/rules changes. You do **not** need to copy `mcp/dist` for MCP anymore if `npx` resolves the published package.

### Developing MCP before npm publish

**Option A — publish a pre-release** (simplest for real testing): `npm publish` with `0.1.0` (or `0.0.1`).

**Option B — run from this repo as workspace:** create `.cursor/mcp.json` (not committed) with:

```json
{
  "mcpServers": {
    "redmine": {
      "command": "node",
      "args": ["${workspaceFolder}/mcp/dist/index.mjs"],
      "env": {
        "REDMINE_BASE_URL": "${env:REDMINE_BASE_URL}",
        "REDMINE_API_KEY": "${env:REDMINE_API_KEY}"
      }
    }
  }
}
```

Then `cd mcp && npm run build`, open this repo in Cursor. If the installed plugin also registers **redmine** via `npx`, disable one of the two entries under **Settings → MCP** to avoid duplicates.

`mcp/dist/` is gitignored; the bundle is produced locally and included in the npm package via `prepublishOnly`.

### One-command sync

From the repository root:

```bash
./scripts/sync-to-cursor-local.sh
```

### If you still use `ln -s`

- The symlink path must be the **link itself**, not a directory with a trailing slash:
  - Correct: `ln -sfn /path/to/redmine-plugin ~/.cursor/plugins/local/redmine-plugin`
  - Wrong: `... ~/.cursor/plugins/local/redmine-plugin/` — can nest the link one level too deep so Cursor never sees `.cursor-plugin/plugin.json` at the expected root.

Even with the correct `ln` path, symlinks may still fail until the Cursor bug is fixed — prefer **copy/rsync** via the script above.

## Development

```bash
cd mcp
npm install
npm run typecheck
npm run build
```

The build writes `mcp/dist/index.mjs` (gitignored). Runtime deps are bundled; published users get this file from npm, not from git.

## License

MIT

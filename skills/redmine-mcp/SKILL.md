---
name: redmine-mcp
description: Use the Redmine MCP to load issues by ID with metadata, comments, and optional image attachments. Use when the user mentions Redmine tickets, issue IDs, or needs full issue context from Redmine.
---

# Redmine MCP

## Prerequisites

The **redmine** MCP server must be enabled in Cursor (Settings → MCP). The user needs `REDMINE_BASE_URL` and `REDMINE_API_KEY` in the environment Cursor was started with. If tools are missing or calls fail with auth errors, say so and point them to the plugin README.

## Tool

| Tool | Purpose |
|------|---------|
| `get_redmine_issue` | Fetch one issue by numeric ID |

### Arguments

- **`issueId`** (required): positive integer Redmine issue id (e.g. `12345`).
- **`includeImages`** (optional): default behaves like `true` in the server — image attachments are downloaded and returned as image blocks. Set **`false`** when the user only needs text/metadata or when responses may be large/slow.

## When to use

- User references an issue by id or URL (`/issues/12345`).
- You need authoritative description, status, assignee, project, or discussion notes from Redmine.
- You should ground a plan or code change in the ticket text.

## Practices

1. Prefer **`includeImages: false`** unless the user explicitly needs screenshots or diagrams from attachments.
2. Summarize the returned JSON for the user; link the issue using the `url` field when present.
3. On **“Redmine issue not found”**, confirm the id and that the user’s key can see that project.
4. On **auth errors**, suggest checking the API key and permissions in Redmine.

## Do not

- Guess issue ids; ask if unclear.
- Assume Redmine is reachable without trying the tool (or report the tool error).

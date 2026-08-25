# occ-cli

CLI for searching jobs on **OCC Mundial** (www.occ.com.mx), Mexico's largest job board.

**Data source**: OCC's public server-rendered search pages (`/empleos/de-<query>/en-<location>/`)
and the JobPosting JSON-LD embedded in detail pages (`/empleo/oferta/<id>`).
**Authentication**: None required.
**Dependencies**: None (plain `bun` + `node:http2`). `bun install` is optional and only pulls dev type defs.
**Transport**: HTTP/2 via `node:http2` — OCC's WAF rejects HTTP/1.1 requests to detail pages,
and bun's `fetch` only speaks HTTP/1.1.

> **Personal use only.** This reads OCC's public job pages. Keep volume low, don't use it
> commercially or for bulk data collection, and run it on your own responsibility.

## Installation

```bash
cd .agents/skills/occ-search/cli
bun install   # optional — only installs TypeScript dev types
```

The CLI runs without any install because it has zero runtime dependencies.

## Commands

| Command | Description |
|---------|-------------|
| `search` | Search for job listings (at least one of `--query`/`--location` required) |
| `detail` | Fetch full detail for a single job posting |

`search` accepts `--format json|table|plain` (default `json`); `detail` accepts `--format json|plain`.
All errors are written to **stderr** as `{ "error": "...", "code": "..." }` with exit code `1`.

## Quick examples

```bash
# Fullstack roles anywhere in Mexico
bun run src/cli.ts search -q "desarrollador fullstack" --format table

# React roles in Guadalajara, last 14 days
bun run src/cli.ts search -q "desarrollador react" -l "Guadalajara" --jobage 14 --format table

# AWS consultants in Monterrey
bun run src/cli.ts search -q "consultor aws" -l "Monterrey" --limit 5

# Full detail for one posting
bun run src/cli.ts detail 21247400 --format plain
```

See `../SKILL.md` for the full flag reference and `../url-reference.md` for endpoint docs.

## Search flags

| Flag | Alias | Description |
|------|-------|-------------|
| `--query` | `-q` | Keywords (title / skill / role). At least one of query/location required. |
| `--location` | `-l` | Mexican state or city, e.g. `"Ciudad de México"`, `"Monterrey"`. |
| `--jobage` | | Posted within N days: `1`, `2`, `3`, `7`, `14`, `30`, `60`. |
| `--page` | | 1-indexed page (20 results/page). |
| `--limit` | `-n` | Cap results emitted (client-side). |
| `--format` | | `json` \| `table` \| `plain`. |

## Tests

```bash
bun run typecheck   # tsc --noEmit
bun run test        # offline parsing tests + live smoke tests (few real requests)
```

# computrabajo-cli

CLI for searching jobs on **Computrabajo México** (mx.computrabajo.com), Mexico's
largest job board — any city or state, any sector.

**Data source**: Computrabajo's public server-rendered search pages
(`/trabajo-de-<query>[-en-<location>]`) and offer detail pages.
**Authentication**: None required.
**Dependencies**: None (plain `bun` + `fetch`). `bun install` is optional and only pulls dev type defs.

> **Personal use only.** This reads Computrabajo's public job pages and stays within
> robots.txt (disallowed filter params such as `pubdate=` are never sent; `--jobage`
> filters client-side). Keep volume low, don't use it commercially or for bulk data
> collection, and run it on your own responsibility.

## Installation

```bash
cd .agents/skills/computrabajo-search/cli
bun install   # optional — only installs TypeScript dev types
```

The CLI runs without any install because it has zero runtime dependencies.

## Commands

| Command | Description |
|---------|-------------|
| `search` | Search for job listings (`--query` required) |
| `detail` | Fetch full detail for a single job listing |

`search` accepts `--format json|table|plain` (default `json`); `detail` accepts `--format json|plain`.
All errors are written to **stderr** as `{ "error": "...", "code": "..." }` with exit code `1`.

## Quick examples

```bash
# Fullstack roles anywhere in Mexico
bun run src/cli.ts search -q "desarrollador fullstack" --format table

# React roles in Mexico City, last 7 days
bun run src/cli.ts search -q "desarrollador react" -l "Ciudad de México" --jobage 7 --format table

# Node.js roles in Estado de México
bun run src/cli.ts search -q "desarrollador nodejs" -l "Estado de México" --limit 10

# Full detail for one job
bun run src/cli.ts detail 3711D8CB3155475961373E686DCF3405 --format plain
```

See `../SKILL.md` for the full flag reference and `../url-reference.md` for URL
patterns and robots.txt notes.

## Search flags

| Flag | Alias | Description |
|------|-------|-------------|
| `--query` | `-q` | **Required.** Role/keywords, e.g. `"desarrollador fullstack"`. Accents OK. |
| `--location` | `-l` | Optional city or state, e.g. `"Ciudad de México"`, `"Guadalajara"`, `"Jalisco"`. |
| `--jobage` | | Posted within N days — client-side filter (robots.txt disallows `pubdate=`). |
| `--page` | | 1-indexed page (20 results/page). |
| `--limit` | `-n` | Cap results emitted (client-side). |
| `--format` | | `json` \| `table` \| `plain`. |

## Tests

```bash
bun run typecheck
bun run test        # offline parsing/error tests + a minimal live smoke test
```

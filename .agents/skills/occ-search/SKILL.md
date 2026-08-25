---
name: occ-search
version: 1.0.0
description: >
  Make sure to use this skill whenever the user wants to search for jobs in Mexico,
  find Mexican job listings, look up a specific job posting on OCC Mundial
  (www.occ.com.mx, Mexico's largest job board), or asks anything about the Mexican
  job market — even if they don't mention OCC explicitly. Invoke this skill for
  open positions, vacancies, hiring in Mexican states or cities (Ciudad de México,
  Guadalajara, Monterrey, Querétaro, etc.), or when the user wants to find work in
  Mexico. Trigger phrases include: OCC, occ.com.mx, OCC Mundial, empleos, vacantes,
  bolsa de trabajo, buscar trabajo México, trabajo en México, empleo en CDMX,
  vacantes en Guadalajara, ofertas de trabajo, busco trabajo, jobs in Mexico,
  mexican jobs, job search mexico, work in mexico, developer jobs mexico city,
  find a job in Monterrey, hiring in Mexico, job openings mexico.
context: fork
allowed-tools: Bash(bun run .agents/skills/occ-search/cli/src/cli.ts *)
---

# OCC Mundial Search Skill

Search live job listings from **OCC Mundial** (www.occ.com.mx), Mexico's largest job
board. No authentication, no API key, and **zero runtime dependencies** — it runs with
just `bun`. Covers hundreds of thousands of postings across all Mexican states and
sectors, updated in real time.

## When to use this skill

- Search for job openings anywhere in Mexico, by keyword and/or state/city
- Filter by recency (posted today / last N days)
- Get the full description, salary, and employment type of a specific OCC posting

## Commands

### Search job listings

```bash
bun run .agents/skills/occ-search/cli/src/cli.ts search [-q "<keywords>"] [-l "<place>"] [flags]
```

Key flags (at least one of `--query`/`--location` is required):
- `--query <text>` / `-q <text>` — keywords (job title, skill, or role), e.g. `"desarrollador fullstack"`.
- `--location <text>` / `-l <text>` — Mexican state or city, e.g. `"Ciudad de México"`, `"Guadalajara"`, `"Monterrey"`, `"Nuevo León"`. Accents are handled automatically.
- `--jobage <days>` — posted within N days: `1`, `2`, `3`, `7`, `14`, `30`, `60`. Omit for all postings.
- `--page <n>` — page number (1-indexed, 20 results per page).
- `--limit <n>` / `-n <n>` — cap total results emitted (client-side).
- `--format json|table|plain` — default `json`.

### Fetch full job detail

```bash
bun run .agents/skills/occ-search/cli/src/cli.ts detail <id|url> [--format json|plain]
```

`id` is the numeric offer ID from `search` results (e.g. `21247400`). You may also pass
a full OCC offer URL (`https://www.occ.com.mx/empleo/oferta/21247400-...`). Returns the
full description, employment type, salary range, posting/expiry dates, and canonical URL.

## Usage examples

```bash
# Fullstack developer roles anywhere in Mexico, human-readable
bun run .agents/skills/occ-search/cli/src/cli.ts search -q "desarrollador fullstack" --format table

# React developer roles in Guadalajara, last 14 days
bun run .agents/skills/occ-search/cli/src/cli.ts search -q "desarrollador react" -l "Guadalajara" --jobage 14 --format table

# AWS consultant roles in Monterrey, first 5 as JSON (for piping IDs to detail)
bun run .agents/skills/occ-search/cli/src/cli.ts search -q "consultor aws" -l "Monterrey" --limit 5

# Everything posted today in Ciudad de México
bun run .agents/skills/occ-search/cli/src/cli.ts search -l "Ciudad de México" --jobage 1 --format table

# Page 2 of a broad query
bun run .agents/skills/occ-search/cli/src/cli.ts search -q "ingeniero de datos" --page 2

# Full details for a specific posting
bun run .agents/skills/occ-search/cli/src/cli.ts detail 21247400 --format plain
```

## Output formats

| Format | Best for |
|--------|----------|
| `json` | Default — programmatic use, passing IDs to `detail` |
| `table` | Quick human-readable scanning (includes salary column) |
| `plain` | Reading a single job's full detail (`detail` command) |

All errors are written to **stderr** as `{ "error": "...", "code": "..." }` and the process exits with code `1`.

## Notes

- Data comes from OCC's public server-rendered search pages and the schema.org
  JobPosting JSON-LD embedded in each detail page. OCC's `/rest?server=jobs` JSON API
  exists but returns 401 without an app token, so it is not used.
- OCC's WAF requires **HTTP/2**, a browser User-Agent, **and** an `Accept-Language`
  header (HTTP/1.1 requests to detail pages get 403). The CLI talks HTTP/2 via
  `node:http2` — still zero runtime dependencies. A 403 usually means rate limiting;
  wait and retry.
- Searches with few local matches are broadened by OCC itself: it pads the results
  with related postings from other locations (the page reports the same total).
- Search-result dates are relative Spanish phrases ("Hoy", "Ayer", "Hace 3 días",
  "Hace 1 semana/mes"); the CLI converts them to ISO dates. Week/month phrases are
  approximate (7/30 days). The `detail` command returns the exact `DatePosted`.
- Salaries are shown when disclosed (MXN, monthly); confidential postings have
  `company: null`.
- OCC repeats a featured card at the top of results; the CLI dedupes by ID.
- Page size is fixed at 20; `meta.total` reports the portal-wide match count.
- Keep request volume low — this reads public pages for personal job searching, not
  bulk data collection.

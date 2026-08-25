---
name: computrabajo-search
version: 1.0.0
description: >
  Use this skill whenever the user wants to search for jobs in Mexico on
  Computrabajo (mx.computrabajo.com), Mexico's largest job board — job listings,
  vacancies, and full posting details for any Mexican city or state. Trigger
  phrases (English): find jobs in Mexico, Mexican job search, jobs in Mexico City /
  Guadalajara / Monterrey, Computrabajo. Trigger phrases (Spanish): empleos,
  vacantes, bolsa de trabajo, trabajo México, buscar trabajo, ofertas de trabajo,
  empleo en Ciudad de México, Computrabajo.
context: fork
allowed-tools: Bash(bun run .agents/skills/computrabajo-search/cli/src/cli.ts *)
---

# Computrabajo México Search Skill

Search live job listings from **Computrabajo México** (mx.computrabajo.com), the
largest job board in Mexico. No authentication, no API key, and **zero runtime
dependencies** — it runs with just `bun`. Queries and locations go in the URL path
(`/trabajo-de-<query>-en-<location>`), so all requests stay on paths allowed by the
site's robots.txt.

## ⚠️ Personal use only

This uses Computrabajo's public job pages. Keep volume low, don't use it commercially
or for bulk data collection, and run it on your own responsibility. The CLI honors
robots.txt: it never sends the disallowed filter params (`pubdate=`, `sal=`, `cont=`,
`dis=`, `by=`, `emp=`, …) and never touches `/Ajax/` or `/_services/` endpoints.

## When to use this skill

- Search job openings anywhere in Mexico (or narrowed to a city/state)
- Filter by posting recency (`--jobage`, applied client-side — see Notes)
- Get the full description, salary, contract type, and requirements of a listing

## Commands

### Search job listings

```bash
bun run .agents/skills/computrabajo-search/cli/src/cli.ts search --query "<role>" [flags]
```

Key flags:
- `--query <text>` / `-q <text>` — **required.** Role or keywords, e.g. `"desarrollador fullstack"`. Accents are handled (`"diseñador gráfico"` works).
- `--location <text>` / `-l <text>` — optional city or state, e.g. `"Ciudad de México"`, `"Estado de México"`, `"Guadalajara"`, `"Monterrey"`, `"Jalisco"`. Omit to search all of Mexico.
- `--jobage <days>` — posted within N days (e.g. `1`, `7`, `30`). **Client-side filter** on each card's relative date; see Notes.
- `--page <n>` — page number (1-indexed, 20 results per page).
- `--limit <n>` / `-n <n>` — cap total results emitted (client-side).
- `--format json|table|plain` — default `json`.

### Fetch full job detail

```bash
bun run .agents/skills/computrabajo-search/cli/src/cli.ts detail <id|url> [--format json|plain]
```

`id` is the 32-character hex ID from `search` results (e.g.
`3711D8CB3155475961373E686DCF3405`). A full `mx.computrabajo.com/ofertas-de-trabajo/...`
URL also works. Returns the full description, salary, contract type, schedule, and
requirements.

## Usage examples

```bash
# Fullstack roles anywhere in Mexico
bun run .agents/skills/computrabajo-search/cli/src/cli.ts search -q "desarrollador fullstack" --format table

# React roles in Mexico City, posted in the last 7 days
bun run .agents/skills/computrabajo-search/cli/src/cli.ts search -q "desarrollador react" -l "Ciudad de México" --jobage 7 --format table

# Node.js roles in Estado de México, first 10 results as JSON
bun run .agents/skills/computrabajo-search/cli/src/cli.ts search -q "desarrollador nodejs" -l "Estado de México" --limit 10

# Frontend roles in Guadalajara, page 2
bun run .agents/skills/computrabajo-search/cli/src/cli.ts search -q "desarrollador frontend" -l "Guadalajara" --page 2 --format table

# Fresh postings only (today)
bun run .agents/skills/computrabajo-search/cli/src/cli.ts search -q "desarrollador fullstack" --jobage 1 --format table

# Full details for a specific job
bun run .agents/skills/computrabajo-search/cli/src/cli.ts detail 3711D8CB3155475961373E686DCF3405 --format plain
```

## Output formats

| Format | Best for |
|--------|----------|
| `json` | Default — programmatic use, passing IDs to `detail` |
| `table` | Quick human-readable scanning |
| `plain` | Reading a single job's full detail (`detail` command) |

Search JSON is `{ "meta": { "count", "page", "total" }, "results": [...] }`; every
result always carries `id`, `title`, `company`, `location`, `salary`, `date`,
`dateText`, `url` (missing values are `null`, never omitted).

All errors are written to **stderr** as `{ "error": "...", "code": "..." }` and the
process exits with code `1`.

## Notes

- **`--jobage` is client-side by design.** Computrabajo's server-side posting-age
  filter uses the `pubdate=` query param, which is **disallowed by robots.txt** on
  `/ofertas-de-trabajo/`. The CLI therefore fetches the unfiltered (allowed) listing
  and filters locally on each card's relative date ("Hace 6 horas", "Ayer",
  "Hace 2 días"). Cards whose age cannot be determined are excluded when the filter
  is active. Since filtering happens per page, a `--jobage`-filtered page can return
  fewer than 20 results even when older matches exist on later pages.
- The site shows only **relative** dates, so `date` is an estimated ISO date derived
  from them; the raw phrase is kept in `dateText`. "Hace más de 30 días" postings get
  `date: null` (age is only known to be >30 days).
- Page size is fixed at 20 results; `meta.total` is the site's total match count.
- Job IDs are 32-char hex (e.g. `3711D8CB3155475961373E686DCF3405`) — pass them as-is
  to `detail`. Unknown IDs redirect to a listing page; the CLI detects this and
  reports `NOT_FOUND` instead of parsing garbage.
- `--location` accepts a city (`Guadalajara`) or a state (`Jalisco`,
  `Estado de México`). If a niche query + small city yields nothing, retry without
  `--location` or with the state name — or include the city in `--query`.
- Salary appears only when the employer publishes it (`$ 23,000.00 (Mensual)`).
- Rate limiting: the CLI retries 429/5xx with exponential backoff + jitter (max 6
  retries). Keep request volume low.

---
name: workana-search
version: 1.0.0
description: >
  Use this skill whenever the user wants to search for freelance projects on
  Workana, the leading LATAM freelance marketplace (Spanish-first, also
  Portuguese and English), or to look up a specific Workana project posting.
  Invoke for freelance gigs, remote project work, and contract opportunities
  across Latin America and Spain — software, design, marketing, writing,
  translation, admin, and more. Results are PROJECTS with budgets, not salaried
  jobs. Trigger phrases: freelance, freelance work, freelance projects, find
  freelance gigs, Workana, "proyectos freelance", "trabajo freelance",
  "proyectos remotos", "busco proyectos", "trabajos freelance de <skill>",
  "clientes en LATAM", freelance marketplace, remote gigs latin america.
context: fork
allowed-tools: Bash(bun run .agents/skills/workana-search/cli/src/cli.ts *)
---

# Workana Search Skill

Search live **freelance projects** from [Workana](https://www.workana.com), the largest
freelance marketplace in Latin America (Spanish-first; also serves Portuguese and English
projects). No authentication, no API key, and **zero runtime dependencies** — it runs with
just `bun`.

> **Freelance marketplace, not a job board.** Results are client-posted *projects* with
> **budgets** (e.g. `USD 250 - 500`, `Menos de USD 50 / hora`), not salaried positions.
> The `company` field is the client's display name and `location` is the client's country —
> the work itself is remote.

## ⚠️ Personal use only

This reads Workana's public search and project pages. Workana's `robots.txt` disallows
`/api/` — this skill **never uses the API**, only the allowed public HTML pages. Keep
volume low and don't use it commercially or for bulk data collection.

## When to use this skill

- Find freelance projects by skill, technology, or role (in Spanish, Portuguese, or English)
- Filter by client country (MX, AR, CO, CL, PE, BR, ES, …), category, language, or recency
- Get the full description, scope, and required skills of a specific project

## Commands

### Search projects

```bash
bun run .agents/skills/workana-search/cli/src/cli.ts search [flags]
```

Key flags:
- `--query <text>` / `-q <text>` — keyword search (skill, tech, or role). Recommended. Spanish queries match best.
- `--country <ISO2>` / `-c <ISO2>` — filter by **client country**, e.g. `MX`, `AR`, `CO`, `CL`, `PE`, `BR`, `ES`.
- `--category <slug>` — Workana category, e.g. `it-programming`, `design-multimedia`, `writing-translation`, `sales-marketing`.
- `--language <lang>` — project language: `es`, `en`, or `pt`. Omit for all.
- `--jobage <days>` — posted within N days (client-side filter on the posted date; Workana has no server param).
- `--page <n>` — page number (1-indexed).
- `--limit <n>` / `-n <n>` — cap results emitted (client-side).
- `--format json|table|plain` — default `json`.

### Fetch full project detail

```bash
bun run .agents/skills/workana-search/cli/src/cli.ts detail <slug|url> [--format json|plain]
```

`slug` is the project ID from `search` results (e.g.
`desarrollo-de-tienda-online-con-react`). A full `workana.com/job/<slug>` URL also works.
Returns the full description, category/subcategory, scope, deadline, status, and skills.

## Usage examples

```bash
# React projects, Spanish-language, human-readable table
bun run .agents/skills/workana-search/cli/src/cli.ts search -q "react" --language es --format table

# Node.js projects posted in the last 7 days
bun run .agents/skills/workana-search/cli/src/cli.ts search -q "node.js" --jobage 7

# Web development projects from clients in Mexico
bun run .agents/skills/workana-search/cli/src/cli.ts search -q "desarrollo web" -c MX --format table

# AWS / cloud projects in the IT category, page 2
bun run .agents/skills/workana-search/cli/src/cli.ts search -q "aws" --category it-programming --page 2

# Design gigs from Argentine clients
bun run .agents/skills/workana-search/cli/src/cli.ts search -q "diseño de logo" -c AR --category design-multimedia

# Full details for a specific project
bun run .agents/skills/workana-search/cli/src/cli.ts detail desarrollo-de-tienda-online-con-react --format plain
```

## Output format

`search --format json` emits `{ "meta": { "count", "page", "total" }, "results": [...] }`.
Each result always has these keys (missing values are `null`, never omitted):

| Field | Meaning |
|-------|---------|
| `id` | Project slug — pass to `detail` |
| `title` | Project title |
| `company` | Client's display name (e.g. `"HECTOR M."`) or `null` |
| `location` | Client's country (e.g. `"México"`), or `"Remote"` if none shown |
| `date` | Posted date as ISO `yyyy-mm-dd` (derived from the relative date) or `null` |
| `url` | `https://www.workana.com/job/<slug>` |
| `budget` | Budget string, e.g. `"USD 250 - 500"`, `"Más de USD 3.000"`, `"Menos de USD 15 / hora"`, or `null` |
| `postedAgo` | Raw relative date as shown on the site, e.g. `"Hace 9 horas"`, `"Ayer"` |
| `hourly` | `true` when the budget is per-hour |
| `skills` | Required skills listed on the project card |

All errors are written to **stderr** as `{ "error": "...", "code": "..." }` and the process
exits with code `1`.

## Notes

- **~7 results per page.** The server-rendered page embeds only the first ~7 of each
  20-result page; the rest load through the disallowed `/api/`, which this skill does not
  touch. Use `--page` to fetch more.
- **Dates are relative.** Workana shows `"Hace 9 horas"` / `"Ayer"` / `"Hace 2 días"`; the
  CLI converts them to ISO dates (day precision), which `--jobage` filters on. Results with
  unparseable dates are dropped when `--jobage` is set.
- **Budget granularity.** Budgets are ranges/buckets chosen by the client, in USD. Hourly
  projects show `"/ hora"` and `hourly: true`.
- **Detail page hides the budget** for logged-out visitors (shows only project status like
  `"Abierto"`), so `detail` often returns `budget: null` — take the budget from the search
  result instead. `detail`'s `location` is a 2-letter country code (only a flag is exposed).
- **Spanish-first.** Most projects are in Spanish; query in Spanish for best coverage
  (`"desarrollo web"`, `"tienda online"`), or set `--language en`/`pt` to narrow.
- Workana may rate-limit; the CLI retries 429/5xx with exponential backoff and jitter.
  Keep volume low.

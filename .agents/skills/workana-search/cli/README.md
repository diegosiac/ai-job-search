# workana-cli

Zero-runtime-dependency CLI for searching **freelance projects** on
[Workana](https://www.workana.com) (LATAM freelance marketplace, Spanish-first).
Runs on [bun](https://bun.sh) — `fetch` + regex/JSON only; dev-only deps for types.

> Personal use only. Reads Workana's public pages (`/jobs`, `/job/<slug>`);
> Workana's robots.txt disallows `/api/`, which this CLI never touches. Keep volume low.

## Setup

```bash
bun install        # dev-only deps (typescript, @types/bun)
```

## Usage

```bash
# Search (results are projects with budgets, not salaried jobs)
bun run src/cli.ts search -q "react" --language es --format table
bun run src/cli.ts search -q "desarrollo web" -c MX --jobage 7 --limit 10
bun run src/cli.ts search -q "aws" --category it-programming --page 2

# Detail (slug from search results, or a full /job/<slug> URL)
bun run src/cli.ts detail <slug> --format plain
```

Flags: `--query/-q`, `--country/-c <ISO2>`, `--category <slug>`, `--language es|en|pt`,
`--jobage <days>` (client-side), `--page <n>`, `--limit/-n <n>`, `--format json|table|plain`.

JSON output shape: `{ "meta": { "count", "page", "total" }, "results": [...] }` with
`id` (slug), `title`, `company` (client name), `location` (client country), `date`
(ISO, from the Spanish relative date), `url`, `budget`, `postedAgo`, `hourly`, `skills`.
Missing values are `null`, never omitted. Errors go to **stderr** as
`{ "error", "code" }` with exit code 1.

## How it works

The `/jobs` page is server-rendered Vue; the project data lives in an
HTML-entity-encoded JSON blob inside the `:results-initials='…'` attribute. The CLI
extracts the attribute, decodes entities, and `JSON.parse`s it — each result is then
mapped independently so one malformed entry can't break the rest. The `/job/<slug>`
detail page is plain SSR HTML parsed with regex. See `../url-reference.md`.

Quirks: only ~7 results per page are embedded server-side; the detail page hides the
budget for logged-out visitors (use the search result's `budget`).

## Scripts

```bash
bun run typecheck   # tsc --noEmit
bun run test        # live smoke tests against workana.com (needs network)
```

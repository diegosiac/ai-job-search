#!/usr/bin/env bun
// Self-contained CLI for searching freelance projects on Workana's public
// /jobs pages (LATAM freelance marketplace, Spanish-first). No external CLI
// framework, so it runs anywhere `bun` is available with zero install beyond
// the repo clone.
//
// Personal use only. This reads Workana's public pages; keep volume low and
// do not use it commercially or for bulk data collection. Workana's robots.txt
// disallows /api/ — this CLI never uses it.

import { runSearch, type SearchOpts } from "./commands/search.js"
import { runDetail, type DetailOpts } from "./commands/detail.js"

interface Flags {
  _: string[]
  [k: string]: string | boolean | string[]
}

function parseFlags(argv: string[]): Flags {
  const flags: Flags = { _: [] }
  const alias: Record<string, string> = { q: "query", n: "limit", c: "country" }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith("--") || a.startsWith("-")) {
      const key = alias[a.replace(/^-+/, "")] ?? a.replace(/^-+/, "")
      const next = argv[i + 1]
      if (next === undefined || next.startsWith("-")) {
        flags[key] = true
      } else {
        flags[key] = next
        i++
      }
    } else {
      ;(flags._ as string[]).push(a)
    }
  }
  return flags
}

const HELP = `workana-cli — search freelance projects on Workana (LATAM marketplace)

USAGE
  bun run src/cli.ts search [flags]
  bun run src/cli.ts detail <slug|url> [--format json|plain]

SEARCH FLAGS
  --query, -q <text>      Keywords (skill, role, or tech). Recommended.
  --country, -c <ISO2>    Client country filter, e.g. MX, AR, CO, CL, PE, BR.
  --category <slug>       Category slug, e.g. it-programming, design-multimedia.
  --language <lang>       Project language: es | en | pt. Default: all.
  --jobage <days>         Posted within N days (client-side filter).
  --page <n>              1-indexed page. Default 1.
  --limit, -n <n>         Cap results emitted (client-side).
  --format <fmt>          json (default) | table | plain.

EXAMPLES
  bun run src/cli.ts search -q "react" --language es --format table
  bun run src/cli.ts search -q "node.js" --category it-programming --jobage 7
  bun run src/cli.ts search -q "desarrollo web" -c MX --format table
  bun run src/cli.ts detail desarrollo-de-tienda-online --format plain

Personal use only — uses Workana's public pages; keep volume low.
`

async function main(): Promise<number> {
  const argv = process.argv.slice(2)
  const flags = parseFlags(argv)
  const cmd = (flags._ as string[])[0]

  if (!cmd || flags.help || flags.h) {
    process.stdout.write(HELP)
    return cmd ? 0 : 1
  }

  if (cmd === "search") {
    const fmt = (flags.format as string) || "json"

    const parseIntFlag = (name: string, raw: string | boolean | string[]): number | null => {
      const val = parseInt(raw as string, 10)
      if (isNaN(val)) {
        process.stderr.write(JSON.stringify({ error: `--${name} must be a number, got "${raw}"`, code: "BAD_ARG" }) + "\n")
        return null
      }
      return val
    }

    if (flags.jobage !== undefined) {
      const v = parseIntFlag("jobage", flags.jobage)
      if (v === null) return 1
      flags.jobage = String(v)
    }
    if (flags.page !== undefined) {
      const v = parseIntFlag("page", flags.page)
      if (v === null) return 1
      flags.page = String(v)
    }
    if (flags.limit !== undefined) {
      const v = parseIntFlag("limit", flags.limit)
      if (v === null) return 1
      flags.limit = String(v)
    }
    if (flags.country !== undefined && !/^[a-zA-Z]{2}$/.test(String(flags.country))) {
      process.stderr.write(
        JSON.stringify({
          error: `--country must be a 2-letter ISO code (e.g. MX, AR, CO), got "${flags.country}"`,
          code: "BAD_ARG",
        }) + "\n",
      )
      return 1
    }
    if (flags.language !== undefined && !["es", "en", "pt"].includes(String(flags.language))) {
      process.stderr.write(
        JSON.stringify({
          error: `--language must be one of es, en, pt — got "${flags.language}"`,
          code: "BAD_ARG",
        }) + "\n",
      )
      return 1
    }

    const opts: SearchOpts = {
      query: typeof flags.query === "string" ? flags.query : undefined,
      country: typeof flags.country === "string" ? flags.country : undefined,
      category: typeof flags.category === "string" ? flags.category : undefined,
      language: typeof flags.language === "string" ? flags.language : undefined,
      jobage: flags.jobage ? parseInt(flags.jobage as string, 10) : 9999,
      page: flags.page ? Math.max(1, parseInt(flags.page as string, 10)) : 1,
      limit: flags.limit ? parseInt(flags.limit as string, 10) : undefined,
      format: (["json", "table", "plain"].includes(fmt) ? fmt : "json") as SearchOpts["format"],
    }
    return runSearch(opts)
  }

  if (cmd === "detail") {
    const id = (flags._ as string[])[1]
    if (!id) {
      process.stderr.write(JSON.stringify({ error: "detail requires a <slug|url>", code: "NO_ID" }) + "\n")
      return 1
    }
    const fmt = (flags.format as string) || "json"
    const opts: DetailOpts = {
      id,
      format: (fmt === "plain" ? "plain" : "json") as DetailOpts["format"],
    }
    return runDetail(opts)
  }

  process.stderr.write(JSON.stringify({ error: `Unknown command "${cmd}"`, code: "BAD_CMD" }) + "\n")
  return 1
}

main().then((code) => process.exit(code))

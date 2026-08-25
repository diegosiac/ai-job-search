import {
  SEARCH_URL,
  htmlFetch,
  extractSearchPayload,
  daysSince,
  writeError,
  type ProjectCard,
} from "../helpers.js"

export interface SearchOpts {
  query?: string
  country?: string // ISO-3166 alpha-2, e.g. MX, AR, CO
  category?: string // Workana category slug, e.g. it-programming
  language?: string // es | en | pt
  jobage: number // client-side filter on the posted date
  page: number
  limit?: number
  format: "json" | "table" | "plain"
}

function buildUrl(opts: SearchOpts): string {
  const params = new URLSearchParams()
  if (opts.query) params.set("query", opts.query)
  if (opts.language) params.set("language", opts.language)
  if (opts.category) params.set("category", opts.category)
  if (opts.country) params.set("country", opts.country.toUpperCase())
  if (opts.page > 1) params.set("page", String(opts.page))
  const qs = params.toString()
  return qs ? `${SEARCH_URL}?${qs}` : SEARCH_URL
}

function renderTable(cards: ProjectCard[]): string {
  if (cards.length === 0) return "No results."
  const rows = cards.map((c) => {
    const id = c.id.slice(0, 38).padEnd(38)
    const title = (c.title || "").slice(0, 40).padEnd(40)
    const budget = (c.budget || "—").slice(0, 20).padEnd(20)
    const loc = (c.location || "—").slice(0, 14).padEnd(14)
    const date = c.date || "—"
    return `${id} ${title} ${budget} ${loc} ${date}`
  })
  const header =
    "ID (slug)".padEnd(38) +
    " " +
    "TITLE".padEnd(40) +
    " " +
    "BUDGET".padEnd(20) +
    " " +
    "LOCATION".padEnd(14) +
    " DATE"
  return [header, "-".repeat(header.length), ...rows].join("\n")
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  try {
    const html = await htmlFetch(buildUrl(opts))
    if (!html) {
      writeError("Search page not found (404)", "NOT_FOUND")
      return 1
    }
    const payload = extractSearchPayload(html)
    if (!payload) {
      writeError(
        "Could not find the embedded results JSON on the search page (layout may have changed)",
        "PARSE_FAILED",
      )
      return 1
    }

    let cards = payload.results
    // Workana has no server-side posted-date param, so --jobage filters
    // client-side; results whose date could not be parsed are dropped.
    if (opts.jobage > 0 && opts.jobage < 9999) {
      cards = cards.filter((c) => c.date !== null && daysSince(c.date) <= opts.jobage)
    }
    if (opts.limit !== undefined && opts.limit >= 0) cards = cards.slice(0, opts.limit)

    if (opts.format === "table") {
      process.stdout.write(renderTable(cards) + "\n")
    } else if (opts.format === "plain") {
      process.stdout.write(
        cards
          .map(
            (c) =>
              `${c.title}\n  ${c.company || "—"} · ${c.location || "—"} · ${c.budget || "—"} · ${c.postedAgo || c.date || "—"}\n  id: ${c.id}\n  ${c.url}`,
          )
          .join("\n\n") + "\n",
      )
    } else {
      process.stdout.write(
        JSON.stringify(
          {
            meta: {
              count: cards.length,
              page: payload.page ?? opts.page,
              total: payload.total,
            },
            results: cards,
          },
          null,
          2,
        ) + "\n",
      )
    }
    return 0
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "SEARCH_FAILED")
    return 1
  }
}

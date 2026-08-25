import {
  buildSearchUrl,
  htmlFetch,
  parseJobCards,
  parseTotalCount,
  relativeDateToAgeDays,
  writeError,
  type JobCard,
} from "../helpers.js"

export interface SearchOpts {
  query: string
  location?: string
  /** Client-side posting-age filter, in days (robots.txt disallows pubdate=). */
  jobage?: number
  page: number
  limit?: number
  format: "json" | "table" | "plain"
}

function renderTable(cards: JobCard[]): string {
  if (cards.length === 0) return "No results."
  const rows = cards.map((c) => {
    const title = (c.title || "").slice(0, 38).padEnd(38)
    const company = (c.company || "—").slice(0, 30).padEnd(30)
    const loc = (c.location || "—").slice(0, 28).padEnd(28)
    const date = c.dateText || c.date || "—"
    return `${c.id.padEnd(33)} ${title} ${company} ${loc} ${date}`
  })
  const header =
    "ID".padEnd(33) +
    " " +
    "TITLE".padEnd(38) +
    " " +
    "COMPANY".padEnd(30) +
    " " +
    "LOCATION".padEnd(28) +
    " DATE"
  return [header, "-".repeat(header.length), ...rows].join("\n")
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  try {
    const html = await htmlFetch(buildSearchUrl(opts.query, opts.location, opts.page))
    const total = parseTotalCount(html)
    let cards = parseJobCards(html)

    // --jobage is CLIENT-SIDE: Computrabajo's pubdate= filter param is
    // disallowed by robots.txt, so we filter on each card's relative date.
    // Cards whose age cannot be determined are excluded when the filter is on.
    if (opts.jobage !== undefined && opts.jobage > 0 && opts.jobage < 9999) {
      cards = cards.filter((c) => {
        const age = relativeDateToAgeDays(c.dateText)
        return age !== null && age <= opts.jobage!
      })
    }
    if (opts.limit !== undefined && opts.limit >= 0) cards = cards.slice(0, opts.limit)

    if (opts.format === "table") {
      process.stdout.write(renderTable(cards) + "\n")
    } else if (opts.format === "plain") {
      process.stdout.write(
        cards
          .map(
            (c) =>
              `${c.title}\n  ${c.company || "—"} · ${c.location || "—"} · ${c.dateText || c.date || "—"}${c.salary ? ` · ${c.salary}` : ""}\n  id: ${c.id}\n  ${c.url}`,
          )
          .join("\n\n") + "\n",
      )
    } else {
      process.stdout.write(
        JSON.stringify(
          { meta: { count: cards.length, page: opts.page, total }, results: cards },
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

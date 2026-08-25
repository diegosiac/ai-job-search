import {
  BASE_URL,
  htmlFetch,
  parseJobCards,
  parseTotalOffers,
  slugify,
  writeError,
  type JobCard,
} from "../helpers.js"

export interface SearchOpts {
  query?: string
  location?: string
  jobage: number
  page: number
  limit?: number
  format: "json" | "table" | "plain"
}

/**
 * OCC search URLs are path-based SEO slugs:
 *   /empleos/de-<query-slug>/                       query only
 *   /empleos/en-<location-slug>/                    location only
 *   /empleos/de-<query-slug>/en-<location-slug>/    both
 * Query params: ?page=<n> (20 results/page) and ?tm=<days> (posting age).
 */
export function buildUrl(opts: SearchOpts): string {
  let path = "/empleos/"
  if (opts.query) path += `de-${slugify(opts.query)}/`
  if (opts.location) path += `en-${slugify(opts.location)}/`
  const params = new URLSearchParams()
  if (opts.jobage > 0 && opts.jobage < 9999) params.set("tm", String(opts.jobage))
  if (opts.page > 1) params.set("page", String(opts.page))
  const qs = params.toString()
  return `${BASE_URL}${path}${qs ? `?${qs}` : ""}`
}

function renderTable(cards: JobCard[]): string {
  if (cards.length === 0) return "No results."
  const rows = cards.map((c) => {
    const title = (c.title || "").slice(0, 40).padEnd(40)
    const company = (c.company || "—").slice(0, 26).padEnd(26)
    const loc = (c.location || "—").slice(0, 22).padEnd(22)
    const salary = (c.salary || "—").slice(0, 26).padEnd(26)
    const date = c.date || "—"
    return `${c.id.padEnd(9)} ${title} ${company} ${loc} ${salary} ${date}`
  })
  const header =
    "ID".padEnd(9) +
    " " +
    "TITLE".padEnd(40) +
    " " +
    "COMPANY".padEnd(26) +
    " " +
    "LOCATION".padEnd(22) +
    " " +
    "SALARY".padEnd(26) +
    " DATE"
  return [header, "-".repeat(header.length), ...rows].join("\n")
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  try {
    const html = await htmlFetch(buildUrl(opts))
    const total = html ? parseTotalOffers(html) : null
    let cards = html ? parseJobCards(html) : []
    if (opts.limit !== undefined && opts.limit >= 0) cards = cards.slice(0, opts.limit)

    if (opts.format === "table") {
      process.stdout.write(renderTable(cards) + "\n")
    } else if (opts.format === "plain") {
      process.stdout.write(
        cards
          .map(
            (c) =>
              `${c.title}\n  ${c.company || "—"} · ${c.location || "—"} · ${c.salary || "—"} · ${c.date || "—"}\n  id: ${c.id}\n  ${c.url}`,
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

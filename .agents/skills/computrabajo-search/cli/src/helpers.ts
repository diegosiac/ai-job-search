// Data source: Computrabajo México public search pages (mx.computrabajo.com).
// No authentication required. Search results are server-rendered HTML with one
// <article class="box_offer"> per job card; detail pages are a single job's HTML.
// We parse with regex (the markup is shallow and stable; a DOM parser is
// unnecessary and would add a runtime dependency).
//
// robots.txt note: /trabajo-de-* search paths and ?p= pagination are allowed.
// The filter query params dis=, cont=, pubdate=, sal=, by=, emp= (and their
// em-prefixed variants) are DISALLOWED on /ofertas-de-trabajo/ — so this CLI
// never sends them. Posting-age filtering (--jobage) is done CLIENT-SIDE on
// the relative dates parsed from each card.

export const BASE_URL = "https://mx.computrabajo.com"

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

/** Fetch HTML with exponential backoff on 429/5xx. Returns "" on a 404. */
export async function htmlFetch(url: string): Promise<string> {
  const maxRetries = 6
  let delay = 500
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "es-MX,es;q=0.9,en;q=0.8",
      },
      redirect: "follow",
    })
    if (response.status === 429 || response.status >= 500) {
      if (attempt === maxRetries) {
        throw new Error(`Request failed: ${response.status} ${response.statusText}`)
      }
      const jitter = Math.floor(Math.random() * 500)
      await new Promise((r) => setTimeout(r, delay + jitter))
      delay = Math.min(delay * 2, 8000)
      continue
    }
    if (response.status === 404) return ""
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`)
    }
    return response.text()
  }
  throw new Error("Request failed after max retries")
}

export interface JobCard {
  id: string
  title: string
  company: string | null
  location: string | null
  salary: string | null
  /** Estimated ISO date (YYYY-MM-DD) derived from the card's relative date. */
  date: string | null
  /** Raw relative date text from the card, e.g. "Hace 2 días". */
  dateText: string | null
  url: string
}

export interface JobDetail {
  id: string
  title: string
  company: string | null
  location: string | null
  salary: string | null
  contractType: string | null
  schedule: string | null
  date: string | null
  dateText: string | null
  url: string
  description: string | null
  requirements: string[]
}

/**
 * Convert a Unicode code point to a string. Uses `fromCodePoint` so
 * supplementary-plane code points decode correctly, and drops out-of-range
 * values instead of throwing.
 */
function numericEntity(cp: number): string {
  return cp >= 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : ""
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    // Numeric character references: decimal (&#233;) and hexadecimal (&#xE9;).
    .replace(/&#(\d+);/g, (_, dec) => numericEntity(parseInt(dec, 10)))
    .replace(/&#[xX]([0-9a-fA-F]+);/g, (_, hex) => numericEntity(parseInt(hex, 16)))
    .replace(/&nbsp;/g, " ")
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

function clean(html: string): string {
  return decodeHtmlEntities(stripTags(html))
}

/**
 * Slugify a query or location for Computrabajo's path-based search URLs:
 * lowercase, accents stripped (é→e, ñ→n), non-alphanumerics collapsed to "-".
 * e.g. "diseñador gráfico" → "disenador-grafico".
 */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/**
 * Build a search URL. Query lives in the path (`/trabajo-de-<query>`), an
 * optional location is appended as `-en-<location>`, and pagination uses `?p=N`
 * (all allowed by robots.txt — see header note).
 */
export function buildSearchUrl(query: string, location: string | undefined, page: number): string {
  let path = `/trabajo-de-${slugify(query)}`
  if (location) path += `-en-${slugify(location)}`
  const suffix = page > 1 ? `?p=${page}` : ""
  return `${BASE_URL}${path}${suffix}`
}

/**
 * Parse a Spanish relative date ("Hace 6 horas", "Hace 2 días", "Ayer",
 * "Hace más de 30 días", "Hace 6 días (actualizada)") into an age in days.
 * Returns null when the text is not a recognizable relative date.
 */
export function relativeDateToAgeDays(text: string | null): number | null {
  if (!text) return null
  const t = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
  if (/mas de\s*30\s*dias/.test(t)) return 31
  if (/\bayer\b/.test(t)) return 1
  if (/\bhoy\b/.test(t)) return 0
  const m = t.match(/hace\s+(\d+)\s*(minuto|hora|dia|semana|mes|ano)/)
  if (!m) return null
  const n = parseInt(m[1], 10)
  switch (m[2]) {
    case "minuto":
    case "hora":
      return 0
    case "dia":
      return n
    case "semana":
      return n * 7
    case "mes":
      return n * 30
    case "ano":
      return n * 365
    default:
      return null
  }
}

/**
 * Estimated ISO date (YYYY-MM-DD) for an age in days, relative to `now`.
 * Uses LOCAL date components (not toISOString/UTC) so "Hace N horas" never
 * yields tomorrow's date for viewers west of UTC.
 */
export function ageDaysToISO(ageDays: number | null, now: Date = new Date()): string | null {
  if (ageDays === null || ageDays > 30) return null // ">30 días" has no reliable date
  const d = new Date(now.getTime() - ageDays * 86_400_000)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

/** Total result count from the listing heading: <h1><span class="fwB"> N </span>…</h1> */
export function parseTotalCount(html: string): number | null {
  const m = html.match(/<h1[^>]*>\s*<span class="fwB">\s*([\d.,]+)\s*<\/span>/i)
  if (!m) return null
  const n = parseInt(m[1].replace(/[.,]/g, ""), 10)
  return isNaN(n) ? null : n
}

/**
 * Parse the search listing: one <article class="box_offer"> per job. We split
 * on the article opening tag and parse each chunk independently so one
 * malformed card cannot break the rest.
 */
export function parseJobCards(html: string, now: Date = new Date()): JobCard[] {
  const results: JobCard[] = []
  const chunks = html.split(/<article class="box_offer/).slice(1)

  for (const chunk of chunks) {
    const idMatch = chunk.match(/data-id=['"]([0-9A-Fa-f]{16,40})['"]/)
    if (!idMatch) continue
    const id = idMatch[1].toUpperCase()

    // Title + offer link: <a class="js-o-link fc_base" href="/ofertas-de-trabajo/…-<id>#lc=…">Title</a>
    const link = chunk.match(/<a class="js-o-link[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i)
    if (!link) continue
    const href = decodeHtmlEntities(link[1]).split("#")[0]
    const url = href.startsWith("http") ? href : `${BASE_URL}${href}`
    const title = clean(link[2])
    if (!title) continue

    // Company: <p class="dFlex vm_fx fs16 fc_base mt5"> — either an inner
    // <a … offer-grid-article-company-url>Name</a>, or plain text (confidential
    // companies have no profile link). The linked variant also carries a rating
    // ("4.2" + star icon), so prefer the anchor's own text.
    let company: string | null = null
    const companyP = chunk.match(/<p class="dFlex vm_fx fs16 fc_base mt5"[^>]*>([\s\S]*?)<\/p>/i)
    if (companyP) {
      const a = companyP[1].match(/<a[^>]*offer-grid-article-company-url[^>]*>([\s\S]*?)<\/a>/i)
      company = a ? clean(a[1]) || null : clean(companyP[1]) || null
    }

    // Location: <p class="fs16 fc_base mt5"> (exact class — the company <p> has
    // extra classes in front, so this anchor never matches it).
    const loc = chunk.match(/<p class="fs16 fc_base mt5"[^>]*>([\s\S]*?)<\/p>/i)
    const location = loc ? clean(loc[1]) || null : null

    // Salary (optional): <span class="icon i_salary"></span> $ 23,000.00 (Mensual)
    const sal = chunk.match(/class="icon i_salary"[^>]*><\/span>\s*([^<]+)/i)
    const salary = sal ? clean(sal[1]) || null : null

    // Relative date: <p class="fs13 fc_aux mt15"> Hace 2 días </p>
    const dt = chunk.match(/<p class="fs13 fc_aux mt15"[^>]*>([\s\S]*?)<\/p>/i)
    const dateText = dt ? clean(dt[1]) || null : null
    const date = ageDaysToISO(relativeDateToAgeDays(dateText), now)

    results.push({ id, title, company, location, salary, date, dateText, url })
  }

  return results
}

/**
 * Detail URL for a job ID. The site keys the page on the trailing hex ID and
 * ignores the slug words, but the path must still match
 * `oferta-de-trabajo-de-<slug>-<id>` (a bare `oferta-de-trabajo-<id>`
 * redirects to a search listing instead of the offer).
 */
export function detailUrl(id: string): string {
  return `${BASE_URL}/ofertas-de-trabajo/oferta-de-trabajo-de-x-${id}`
}

/** Accept a bare 32-hex job ID or any Computrabajo URL containing one. */
export function normalizeId(input: string): string | null {
  const m = input.match(/([0-9A-Fa-f]{32})/)
  return m ? m[1].toUpperCase() : null
}

/**
 * Parse a job detail page. Returns null when the HTML is not a detail page
 * (unknown IDs 301-redirect to a search listing instead of returning 404).
 */
export function parseJobDetail(html: string, id: string, now: Date = new Date()): JobDetail | null {
  const titleMatch = html.match(/<h1 class="fwB fs24[^"]*"[^>]*>([\s\S]*?)<\/h1>/i)
  if (!titleMatch) return null
  const title = clean(titleMatch[1])

  // Directly after the <h1>: <p class="fs16">Company - City, State</p>
  let company: string | null = null
  let location: string | null = null
  const sub = html
    .slice(titleMatch.index! + titleMatch[0].length)
    .match(/<p class="fs16"[^>]*>([\s\S]*?)<\/p>/i)
  if (sub) {
    const text = clean(sub[1])
    const sep = text.lastIndexOf(" - ")
    if (sep > 0) {
      company = text.slice(0, sep).trim() || null
      location = text.slice(sep + 3).trim() || null
    } else {
      company = text || null
    }
  }

  // Offer tags: <span class="tag base mb10">…</span> — salary, contract, schedule.
  const tags: string[] = []
  const tagRe = /<span class="tag base[^"]*"[^>]*>([\s\S]*?)<\/span>/gi
  let tm: RegExpExecArray | null
  while ((tm = tagRe.exec(html)) !== null) {
    const t = clean(tm[1])
    if (t) tags.push(t)
  }
  const salary = tags.find((t) => /\$|mensual|salario/i.test(t)) ?? null
  const contractType = tags.find((t) => /contrato/i.test(t)) ?? null
  const schedule = tags.find((t) => /tiempo|turno|jornada|horario/i.test(t) && !/contrato/i.test(t)) ?? null

  // Description: the offer section's first <p class="mbB"> (rich text with <br/>).
  let description: string | null = null
  const desc = html.match(/div-link="oferta"[\s\S]*?<p class="mbB"[^>]*>([\s\S]*?)<\/p>/i)
  if (desc) {
    const withBreaks = desc[1]
      .replace(/<\s*br\s*\/?>/gi, "\n")
      .replace(/<\/(p|li|ul|ol|div|h\d)>/gi, "\n")
    description =
      decodeHtmlEntities(withBreaks.replace(/<[^>]+>/g, " "))
        .split("\n")
        .map((l) => l.replace(/\s+/g, " ").trim())
        .join("\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim() || null
  }

  // Requirements: <ul class="disc mbB"><li>…</li>…</ul>
  const requirements: string[] = []
  const reqBlock = html.match(/<ul class="disc mbB"[^>]*>([\s\S]*?)<\/ul>/i)
  if (reqBlock) {
    const liRe = /<li[^>]*>([\s\S]*?)<\/li>/gi
    let lm: RegExpExecArray | null
    while ((lm = liRe.exec(reqBlock[1])) !== null) {
      const t = clean(lm[1])
      if (t) requirements.push(t)
    }
  }

  // Posting date: <p class="fc_aux fs13">Hace 6 días (actualizada)</p>
  // (exact class — the "Palabras clave" paragraph has extra classes).
  const dt = html.match(/<p class="fc_aux fs13"[^>]*>([\s\S]*?)<\/p>/i)
  const dateText = dt ? clean(dt[1]) || null : null
  const date = ageDaysToISO(relativeDateToAgeDays(dateText), now)

  return {
    id,
    title: title || "(untitled)",
    company,
    location,
    salary,
    contractType,
    schedule,
    date,
    dateText,
    url: detailUrl(id),
    description,
    requirements,
  }
}

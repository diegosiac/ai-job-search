// Data source: Workana's public /jobs search pages (server-side rendered).
// The job data is embedded in the page as an HTML-entity-encoded JSON blob in
// the `:results-initials='...'` attribute of the <search> Vue component, so we
// extract that attribute, decode entities, and JSON.parse — no DOM parser and
// no runtime dependencies needed. The detail page (/job/<slug>) is plain SSR
// HTML parsed with regex.
//
// robots.txt disallows /api/ — this CLI never touches it; /jobs and /job/<slug>
// are allowed public pages. Keep volume low: personal use only.

export const BASE_URL = "https://www.workana.com"
export const SEARCH_URL = `${BASE_URL}/jobs`
export const DETAIL_URL = `${BASE_URL}/job`

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
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
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

export interface ProjectCard {
  id: string // project slug
  title: string
  company: string | null // client (project author) name
  location: string | null // client country, or "Remote"
  date: string | null // ISO yyyy-mm-dd derived from the relative posted date
  url: string
  budget: string | null // e.g. "USD 250 - 500", "Menos de USD 50"
  postedAgo: string | null // raw relative date, e.g. "Hace 9 horas"
  hourly: boolean
  skills: string[]
}

export interface ProjectDetail {
  id: string
  title: string
  company: string | null
  location: string | null // client country ISO code (detail page only exposes a flag)
  date: string | null
  url: string
  budget: string | null
  status: string | null // e.g. "Evaluando propuestas"
  category: string | null
  subcategory: string | null
  scope: string | null
  deadline: string | null
  skills: string[]
  description: string | null
}

/**
 * Convert a Unicode code point to a string. Uses `fromCodePoint` so
 * supplementary-plane code points decode correctly, and drops out-of-range
 * values instead of throwing.
 */
function numericEntity(cp: number): string {
  return cp >= 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : ""
}

/** Decode HTML entities. `&amp;` is decoded LAST to avoid double-decoding. */
export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, dec) => numericEntity(parseInt(dec, 10)))
    .replace(/&#[xX]([0-9a-fA-F]+);/g, (_, hex) => numericEntity(parseInt(hex, 16)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

export function clean(html: string): string {
  return decodeHtmlEntities(stripTags(html))
}

/** Convert an HTML fragment to plain text, keeping line breaks readable. */
export function htmlToText(html: string): string {
  const withBreaks = html
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/(p|li|ul|ol|div|h\d)>/gi, "\n")
  return decodeHtmlEntities(stripTags2(withBreaks)).replace(/\n{3,}/g, "\n\n").trim()
}

/** Like stripTags but preserves newlines inserted by htmlToText. */
function stripTags2(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .trim()
}

// ---------------------------------------------------------------------------
// Search-page JSON blob extraction
// ---------------------------------------------------------------------------

interface RawResult {
  slug?: string
  title?: string
  authorName?: string
  description?: string
  isHourly?: boolean
  postedDate?: string
  budget?: string
  country?: string
  skills?: { anchorText?: string }[]
}

export interface SearchPayload {
  total: number | null
  page: number | null
  results: ProjectCard[]
}

/**
 * Extract and parse the `:results-initials='...'` JSON blob from a /jobs page.
 * The attribute value is single-quoted and HTML-entity encoded (all literal
 * quotes inside are `&quot;` / `&#039;`), so the value itself never contains
 * a raw single quote. Returns null when the blob is absent (page layout change).
 */
export function extractSearchPayload(html: string): SearchPayload | null {
  const m = html.match(/:results-initials='([\s\S]*?)'/)
  if (!m) return null
  let data: {
    results?: RawResult[]
    pagination?: { total?: number; page?: number }
  }
  try {
    data = JSON.parse(decodeHtmlEntities(m[1]))
  } catch {
    return null
  }

  const results: ProjectCard[] = []
  for (const raw of data.results ?? []) {
    // Each result is parsed independently so one malformed entry cannot
    // break the rest.
    try {
      const card = parseResult(raw)
      if (card) results.push(card)
    } catch {
      continue
    }
  }
  return {
    total: data.pagination?.total ?? null,
    page: data.pagination?.page ?? null,
    results,
  }
}

function parseResult(raw: RawResult): ProjectCard | null {
  const slug = raw.slug || null
  if (!slug) return null

  // Title arrives as an <a><span title="Full title">Truncated…</span></a>
  // fragment; the span's title attribute carries the untruncated title.
  let title: string | null = null
  if (raw.title) {
    const attr = raw.title.match(/<span[^>]*\stitle="([^"]*)"/i)
    title = attr ? decodeHtmlEntities(attr[1]).trim() : clean(raw.title) || null
  }
  if (!title) title = slug.replace(/-/g, " ")

  // Country arrives as flag <img title="Perú"> + <a>Perú</a> markup.
  let location: string | null = null
  if (raw.country) {
    const t = raw.country.match(/title="([^"]+)"/i)
    location = t ? decodeHtmlEntities(t[1]).trim() : clean(raw.country) || null
  }

  const postedAgo = raw.postedDate?.trim() || null

  return {
    id: slug,
    title,
    company: raw.authorName?.trim() || null,
    location: location || "Remote",
    date: relativeDateToISO(postedAgo),
    url: `${DETAIL_URL}/${slug}`,
    budget: raw.budget?.trim() || null,
    postedAgo,
    hourly: raw.isHourly === true,
    skills: (raw.skills ?? [])
      .map((s) => (s.anchorText || "").trim())
      .filter((s) => s.length > 0),
  }
}

// ---------------------------------------------------------------------------
// Spanish relative/absolute date parsing
// ---------------------------------------------------------------------------

const UNIT_DAYS: Record<string, number> = {
  segundo: 0,
  minuto: 0,
  hora: 0,
  dia: 1,
  día: 1,
  semana: 7,
  mes: 30,
  año: 365,
  ano: 365,
}

function isoDaysAgo(days: number): string {
  // Local calendar date (not UTC) so "hace N horas" never lands on tomorrow.
  const d = new Date(Date.now() - days * 86400_000)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/**
 * Parse Workana's Spanish relative dates ("Hace 9 horas", "Ayer",
 * "Hace 2 días", "Hace un mes") into an ISO yyyy-mm-dd date. Returns null
 * when the phrase is not recognized.
 */
export function relativeDateToISO(text: string | null): string | null {
  if (!text) return null
  const t = text.toLowerCase().trim()
  if (/\bhoy\b/.test(t)) return isoDaysAgo(0)
  if (/\bayer\b/.test(t)) return isoDaysAgo(1)
  const m = t.match(/hace\s+(?:m[aá]s\s+de\s+)?(un[oa]?|\d+)\s+(segundo|minuto|hora|d[ií]a|semana|mes|añ?o)/)
  if (!m) return null
  const n = /^un/.test(m[1]) ? 1 : parseInt(m[1], 10)
  const unit = m[2].replace("í", "i")
  const perUnit = UNIT_DAYS[unit] ?? UNIT_DAYS[m[2]]
  if (perUnit === undefined || isNaN(n)) return null
  return isoDaysAgo(n * perUnit)
}

const ES_MONTHS: Record<string, number> = {
  enero: 1,
  febrero: 2,
  marzo: 3,
  abril: 4,
  mayo: 5,
  junio: 6,
  julio: 7,
  agosto: 8,
  septiembre: 9,
  setiembre: 9,
  octubre: 10,
  noviembre: 11,
  diciembre: 12,
}

/** Parse "Publicado el 11 Julio, 2026 …" into ISO yyyy-mm-dd. */
export function spanishDateToISO(text: string | null): string | null {
  if (!text) return null
  const m = text.toLowerCase().match(/(\d{1,2})\s+de\s+(\w+)[,\s]+(\d{4})|(\d{1,2})\s+(\w+)[,\s]+(\d{4})/)
  if (!m) return null
  const day = parseInt(m[1] ?? m[4], 10)
  const monthName = (m[2] ?? m[5]) || ""
  const year = parseInt(m[3] ?? m[6], 10)
  const month = ES_MONTHS[monthName]
  if (!month || isNaN(day) || isNaN(year)) return null
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

/** Days elapsed since an ISO yyyy-mm-dd date (0 = today), in local time. */
export function daysSince(iso: string): number {
  const then = new Date(iso + "T00:00:00").getTime()
  if (isNaN(then)) return Number.POSITIVE_INFINITY
  return Math.floor((Date.now() - then) / 86400_000)
}

// ---------------------------------------------------------------------------
// Detail-page parsing (SSR HTML)
// ---------------------------------------------------------------------------

/** Parse the /job/<slug> detail page. */
export function parseProjectDetail(html: string, slug: string): ProjectDetail {
  const title = html.match(/<h1 class="h3 title">\s*([\s\S]*?)<\/h1>/i)
  const status = html.match(/<span class="pry label[^"]*">([\s\S]*?)<\/span>/i)
  const published = html.match(/Publicado el\s+([\s\S]*?)<\/p>/i)

  // Description lives in an inline expander div (shallow markup, no nesting).
  const desc = html.match(/<div class="expander"[^>]*>([\s\S]*?)<\/div>/i)

  // "Categoría <b>…</b>", "Subcategoría <b>…</b>", "¿Cuál es el alcance…? <b>…</b>"
  const cat = html.match(/Categor[ií]a\s*<b>([\s\S]*?)<\/b>/i)
  const subcat = html.match(/Subcategor[ií]a\s*<b>([\s\S]*?)<\/b>/i)
  const scope = html.match(/alcance del proyecto\?\s*<b>([\s\S]*?)<\/b>/i)
  const deadline = html.match(/Plazo de Entrega:\s*([\s\S]*?)<\/p>/i)

  // Budget block shows a currency range for some projects and a status word
  // ("Abierto") for logged-out visitors otherwise — only keep money-like text.
  let budget: string | null = null
  const budgetMatch = html.match(/<h4 class="budget[^"]*">\s*([\s\S]*?)<\/h4>/i)
  if (budgetMatch) {
    const text = clean(budgetMatch[1])
    if (/\d/.test(text)) budget = text
  }

  // Client name + country flag (the detail page only exposes an ISO flag code).
  const author = html.match(/class="h4 user-name"[^>]*>\s*<span>([\s\S]*?)<\/span>/i)
  const flag = html.match(/class="flag flag-([a-z]{2})"/i)

  const skills: string[] = []
  const skillRe = /class="skill label label-info"[^>]*>([\s\S]*?)<\/a>/gi
  let sm: RegExpExecArray | null
  while ((sm = skillRe.exec(html)) !== null) {
    const s = clean(sm[1])
    if (s) skills.push(s)
  }

  const publishedText = published ? clean(published[1]) : null

  return {
    id: slug,
    title: title ? clean(title[1]) : "(untitled)",
    company: author ? clean(author[1]) || null : null,
    location: flag ? flag[1].toUpperCase() : null,
    date: spanishDateToISO(publishedText),
    url: `${DETAIL_URL}/${slug}`,
    budget,
    status: status ? clean(status[1]) || null : null,
    category: cat ? clean(cat[1]) || null : null,
    subcategory: subcat ? clean(subcat[1]) || null : null,
    scope: scope ? clean(scope[1]) || null : null,
    deadline: deadline ? clean(deadline[1]) || null : null,
    skills,
    description: desc ? htmlToText(desc[1]) || null : null,
  }
}

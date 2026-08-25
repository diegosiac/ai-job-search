// Data source: OCC Mundial (www.occ.com.mx) — Mexico's largest job board.
// Search results are server-rendered HTML job cards; the detail page embeds a
// schema.org JobPosting JSON-LD block (PascalCase keys, trailing semicolon).
// OCC's /rest?server=jobs JSON API returns 401 without an app token, so we
// parse the public HTML instead. Regex parsing is deliberate: the markup is
// shallow and stable, and each card is parsed independently so one malformed
// card cannot break the rest.

import { connect } from "node:http2"

export const BASE_URL = "https://www.occ.com.mx"

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

interface Http2Response {
  status: number
  location: string | undefined
  body: string
}

/**
 * One GET over HTTP/2 via node:http2 (built into bun — still zero runtime
 * deps). OCC's WAF reliably rejects HTTP/1.1 requests to detail pages with
 * 403, and bun's `fetch` only speaks HTTP/1.1, so we talk HTTP/2 directly.
 */
function http2Get(url: URL, timeoutMs = 30000): Promise<Http2Response> {
  return new Promise((resolve, reject) => {
    const client = connect(url.origin)
    const timer = setTimeout(() => {
      client.destroy()
      reject(new Error(`Request timed out after ${timeoutMs}ms: ${url}`))
    }, timeoutMs)
    client.on("error", (e) => {
      clearTimeout(timer)
      reject(e)
    })
    const req = client.request({
      ":method": "GET",
      ":path": url.pathname + url.search,
      "user-agent": UA,
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      // Required: OCC's WAF 403s requests without an Accept-Language header.
      "accept-language": "es-MX,es;q=0.9,en;q=0.8",
    })
    let status = 0
    let location: string | undefined
    const chunks: Buffer[] = []
    req.on("response", (headers) => {
      status = Number(headers[":status"] ?? 0)
      location = typeof headers.location === "string" ? headers.location : undefined
    })
    req.on("data", (c: Buffer) => chunks.push(c))
    req.on("end", () => {
      clearTimeout(timer)
      client.close()
      resolve({ status, location, body: Buffer.concat(chunks).toString("utf-8") })
    })
    req.on("error", (e) => {
      clearTimeout(timer)
      client.destroy()
      reject(e)
    })
    req.end()
  })
}

/**
 * Fetch HTML over HTTP/2 with exponential backoff on 429/5xx and redirect
 * following. Returns "" on a 404. OCC's WAF requires HTTP/2, a full browser
 * User-Agent, AND an Accept-Language header — all are always sent.
 */
export async function htmlFetch(url: string): Promise<string> {
  const maxRetries = 6
  const maxRedirects = 5
  let delay = 500
  let current = new URL(url)
  for (let attempt = 0, redirects = 0; attempt <= maxRetries; ) {
    const response = await http2Get(current)
    if (response.status === 429 || response.status >= 500) {
      if (attempt === maxRetries) {
        throw new Error(`Request failed: ${response.status}`)
      }
      const jitter = Math.floor(Math.random() * 500)
      await new Promise((r) => setTimeout(r, delay + jitter))
      delay = Math.min(delay * 2, 8000)
      attempt++
      continue
    }
    if (response.status >= 300 && response.status < 400 && response.location) {
      if (redirects >= maxRedirects) throw new Error("Too many redirects")
      current = new URL(response.location, current)
      redirects++
      continue
    }
    if (response.status === 404) return ""
    if (response.status === 403) {
      throw new Error(
        "Request blocked (403). OCC's WAF requires HTTP/2, a browser User-Agent, and an " +
          "Accept-Language header; if all were sent, the IP may be rate-limited — wait and retry.",
      )
    }
    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Request failed: ${response.status}`)
    }
    return response.body
  }
  throw new Error("Request failed after max retries")
}

export interface JobCard {
  id: string
  title: string
  company: string | null
  location: string | null
  salary: string | null
  date: string | null // ISO yyyy-mm-dd, derived from OCC's relative Spanish date
  url: string
}

export interface JobDetail extends JobCard {
  description: string | null
  employmentType: string | null
  validThrough: string | null
  salaryMin: number | null
  salaryMax: number | null
  salaryCurrency: string | null
  salaryPeriod: string | null
}

/**
 * Convert a Unicode code point to a string. Uses `fromCodePoint` so
 * supplementary-plane code points decode correctly, and drops out-of-range
 * values instead of throwing.
 */
function numericEntity(cp: number): string {
  return cp >= 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : ""
}

// Named entities that appear in OCC's Spanish-language markup/descriptions.
const NAMED_ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  aacute: "á", eacute: "é", iacute: "í", oacute: "ó", uacute: "ú",
  Aacute: "Á", Eacute: "É", Iacute: "Í", Oacute: "Ó", Uacute: "Ú",
  ntilde: "ñ", Ntilde: "Ñ", uuml: "ü", Uuml: "Ü",
  iexcl: "¡", iquest: "¿", ordf: "ª", ordm: "º", deg: "°",
  ndash: "–", mdash: "—", hellip: "…", middot: "·", bull: "•",
  rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“",
}

export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, dec) => numericEntity(parseInt(dec, 10)))
    .replace(/&#[xX]([0-9a-fA-F]+);/g, (_, hex) => numericEntity(parseInt(hex, 16)))
    .replace(/&([a-zA-Z]+);/g, (m, name: string) => NAMED_ENTITIES[name] ?? m)
    .replace(/&#39;/g, "'")
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

function clean(html: string): string {
  return decodeHtmlEntities(stripTags(html))
}

/**
 * Slugify a query/location the way OCC's SEO URLs expect:
 * "Desarrollador Fullstack" -> "desarrollador-fullstack",
 * "Ciudad de México" -> "ciudad-de-mexico".
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
 * Convert OCC's relative Spanish posting date ("Hoy", "Ayer", "Hace 3 días",
 * "Hace 1 semana", "Hace 1 mes") to an ISO yyyy-mm-dd date. Weeks/months are
 * approximations (7/30 days). Returns null when the phrase is unrecognized.
 */
export function relativeDateToISO(text: string, now: Date = new Date()): string | null {
  const t = decodeHtmlEntities(text).toLowerCase().trim()
  let days: number | null = null
  if (/\bhoy\b/.test(t)) days = 0
  else if (/\bayer\b/.test(t)) days = 1
  else {
    const m = t.match(/hace\s+(?:m[aá]s\s+de\s+)?(\d+|una?)\s+(d[ií]as?|semanas?|mes(?:es)?)/)
    if (m) {
      const n = /^\d+$/.test(m[1]) ? parseInt(m[1], 10) : 1
      if (m[2].startsWith("d")) days = n
      else if (m[2].startsWith("s")) days = n * 7
      else days = n * 30
    }
  }
  if (days === null) return null
  const d = new Date(now.getTime() - days * 86400000)
  return d.toISOString().slice(0, 10)
}

/** Total result count across all pages, from data-total-offers="N". */
export function parseTotalOffers(html: string): number | null {
  const m = html.match(/data-total-offers="(\d+)"/)
  return m ? parseInt(m[1], 10) : null
}

/**
 * Parse the search page: server-rendered job cards. We split on the
 * card-job-offer class and parse each chunk independently so one malformed
 * card cannot break the rest. OCC repeats a featured card, so results are
 * deduped by id (first occurrence wins).
 */
export function parseJobCards(html: string, now: Date = new Date()): JobCard[] {
  const results: JobCard[] = []
  const seen = new Set<string>()
  const chunks = html.split(/class="card-job-offer/).slice(1)

  for (const chunk of chunks) {
    const idMatch = chunk.match(/data-id=['"](\d+)['"]/)
    if (!idMatch) continue
    const id = idMatch[1]
    if (seen.has(id)) continue

    const h2 = chunk.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i)
    const title = h2 ? clean(h2[1]) : null
    if (!title) continue
    seen.add(id)

    // Company: anchor (or plain text) inside the line-clamp-title span.
    // Confidential postings (data-blind="true") have no company name.
    let company: string | null = null
    const comp = chunk.match(/class="line-clamp-title"[^>]*>([\s\S]*?)<\/span>/i)
    if (comp) company = clean(comp[1]) || null
    if (/data-blind="true"/i.test(chunk)) company = company || null

    // Location: span + <p> inside the no-alter-loc-text div.
    const loc = chunk.match(/class="no-alter-loc-text[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
    const location = loc ? clean(loc[1]) || null : null

    // Salary line, e.g. "$ 50,000 - $ 52,000 Mensual" (absent when undisclosed).
    const sal = chunk.match(
      /<span class="mr-2 text-grey-900 font-base font-light[^"]*"[^>]*>([\s\S]*?)<\/span>/i,
    )
    let salary = sal ? clean(sal[1]) || null : null
    // "Sueldo no mostrado por la empresa" = undisclosed -> null.
    if (salary && /sueldo no mostrado/i.test(salary)) salary = null

    // Relative posting date, e.g. "Hoy", "Ayer", "Hace 3 días".
    const dt = chunk.match(/<span class="mr-2 text-sm font-light">([\s\S]*?)<\/span>/i)
    const date = dt ? relativeDateToISO(dt[1], now) : null

    results.push({
      id,
      title,
      company,
      location,
      salary,
      date,
      url: `${BASE_URL}/empleo/oferta/${id}`,
    })
  }

  return results
}

interface LdJobPosting {
  "@type"?: string
  Title?: string
  Description?: string
  DatePosted?: string
  ValidThrough?: string
  EmploymentType?: string
  HiringOrganization?: { Name?: string }
  identifier?: { Name?: string }
  JobLocation?: {
    Address?: { AddressLocality?: string; AddressRegion?: string; AddressCountry?: string }
  }
  BaseSalary?: {
    Currency?: string
    Value?: { MinValue?: number; MaxValue?: number; UnitText?: string }
  }
}

/**
 * Extract the JobPosting JSON-LD object from the detail page. OCC's block is
 * a single object followed by a stray semicolon, so we slice from the first
 * "{" to the last "}" before parsing.
 */
export function extractJobPostingLd(html: string): LdJobPosting | null {
  const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    const raw = m[1]
    const start = raw.indexOf("{")
    const end = raw.lastIndexOf("}")
    if (start === -1 || end <= start) continue
    try {
      const obj = JSON.parse(raw.slice(start, end + 1)) as LdJobPosting & {
        "@graph"?: LdJobPosting[]
      }
      if (obj["@type"] === "JobPosting") return obj
      const graph = obj["@graph"]
      if (Array.isArray(graph)) {
        const jp = graph.find((g) => g["@type"] === "JobPosting")
        if (jp) return jp
      }
    } catch {
      continue
    }
  }
  return null
}

/** Convert the JSON-LD description (rich HTML) to readable plain text. */
export function htmlToText(html: string): string | null {
  const withBreaks = html
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n- ")
    .replace(/<\/(p|ul|ol|div|h\d|tr)>/gi, "\n")
  const text = decodeHtmlEntities(withBreaks.replace(/<[^>]+>/g, ""))
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
  return text || null
}

/** Parse the single-job detail page via its JobPosting JSON-LD block. */
export function parseJobDetail(html: string, id: string): JobDetail | null {
  const ld = extractJobPostingLd(html)
  if (!ld) return null

  const addr = ld.JobLocation?.Address
  const location =
    [addr?.AddressLocality, addr?.AddressRegion].filter((p) => p && p.trim()).join(", ") || null

  const sv = ld.BaseSalary?.Value
  const min = typeof sv?.MinValue === "number" && sv.MinValue > 0 ? sv.MinValue : null
  const max = typeof sv?.MaxValue === "number" && sv.MaxValue > 0 ? sv.MaxValue : null
  const currency = min !== null || max !== null ? (ld.BaseSalary?.Currency ?? null) : null
  const period = min !== null || max !== null ? (sv?.UnitText ?? null) : null
  const salary =
    min !== null || max !== null
      ? `${min !== null ? `$${min.toLocaleString("en-US")}` : "?"} - ${
          max !== null ? `$${max.toLocaleString("en-US")}` : "?"
        } ${currency ?? ""} ${period === "MONTH" ? "Mensual" : (period ?? "")}`.trim()
      : null

  return {
    id,
    title: ld.Title?.trim() || "(untitled)",
    company: ld.HiringOrganization?.Name?.trim() || ld.identifier?.Name?.trim() || null,
    location,
    salary,
    date: ld.DatePosted ?? null,
    url: `${BASE_URL}/empleo/oferta/${id}`,
    description: ld.Description ? htmlToText(ld.Description) : null,
    employmentType: ld.EmploymentType?.trim() || null,
    validThrough: ld.ValidThrough ?? null,
    salaryMin: min,
    salaryMax: max,
    salaryCurrency: currency,
    salaryPeriod: period,
  }
}

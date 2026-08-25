# OCC Mundial URL Reference

Maintainer doc for the occ-search CLI: the public endpoints it parses and where each
field comes from. Verified 2026-07-11 against www.occ.com.mx.

> Personal use only — keep request volume low.

## Required request shape (WAF)

OCC's WAF (detail pages especially) returns **403** unless the request has ALL of:

- **HTTP/2** — HTTP/1.1 requests to `/empleo/oferta/<id>` are rejected (intermittently
  at first, then consistently). Bun's `fetch` only speaks HTTP/1.1, so the CLI uses
  `node:http2` directly (built into bun; still zero runtime deps).
- a full browser `User-Agent` (a bare `Mozilla/5.0` is rejected), and
- an `Accept-Language` header (e.g. `es-MX,es;q=0.9,en;q=0.8`).

The CLI always sends all three plus a browser `Accept` header. Search pages are more
lenient (HTTP/1.1 usually works) but the CLI uses HTTP/2 everywhere for consistency.

## Search (server-rendered HTML)

```
GET https://www.occ.com.mx/empleos/de-<query-slug>/en-<location-slug>/?tm=<days>&page=<n>
```

Path segments (both optional, at least one required):

| Segment | Meaning | Example |
|---------|---------|---------|
| `de-<query-slug>` | Keyword search | `de-desarrollador-fullstack` |
| `en-<location-slug>` | State or city | `en-ciudad-de-mexico`, `en-guadalajara`, `en-nuevo-leon` |

Slugs are lowercase, accent-stripped, hyphen-separated (`Ciudad de México` →
`ciudad-de-mexico`). State + city can also nest (`en-nuevo-leon/en-la-ciudad-de-monterrey`),
but a bare city slug works directly.

Query params:

| Param | Meaning | Values |
|-------|---------|--------|
| `tm` | Posted within N days | `1`, `2`, `3`, `7`, `14`, `30`, `60` (site filters expose these; any positive int is accepted) |
| `page` | 1-indexed page, 20 results/page | `2`, `3`, … |
| `smin` / `smax` | Salary range (MXN/month) — not exposed by the CLI | `20000` / `30000` |

Other path filters exist but are not used by the CLI: `tipo-home-office-remoto/`,
`tipo-home-office-mixto/`, `tipo-en-oficina/` (workplace type), `tiempo-completo/`,
`permanente/`, `temporal/` (contract type), `nivel-*` (education level).

### Parsed markup (search page)

- Result count: `<p data-total-offers="143" total-offers-count>` → `meta.total`.
- Cards: split on `class="card-job-offer`; each card carries
  `data-id='<numeric id>'` and `id="jobcard-<id>"`.
- Per card:
  - **title** — the `<h2 …>` text
  - **date** — first `<span class="mr-2 text-sm font-light">` (relative Spanish:
    `Hoy`, `Ayer`, `Hace N días`, `Hace 1 semana`, `Hace 1 mes`; converted to ISO,
    weeks/months approximated as 7/30 days)
  - **salary** — `<span class="mr-2 text-grey-900 font-base font-light …">`
    (e.g. `$ 50,000 - $ 52,000 Mensual`; absent when undisclosed)
  - **company** — text/anchor inside `<span class="line-clamp-title">`; missing for
    confidential postings (`data-blind="true"`)
  - **location** — text inside `<div class="no-alter-loc-text …">` (span + `<p>`)
- The first card is often a repeated "featured" posting → dedupe by id.
- The page also embeds `window.searchData` / `window.collectorData` / a JSON-LD
  `ItemList` (analytics/SEO); the cards themselves are the most complete source.

## Detail (JSON-LD)

```
GET https://www.occ.com.mx/empleo/oferta/<id>            (bare id works)
GET https://www.occ.com.mx/empleo/oferta/<id>-<slug>     (canonical form)
```

Unknown ids return HTTP **404**. The page embeds one
`<script type="application/ld+json">` block containing a schema.org **JobPosting**
object with **PascalCase keys** and a **trailing semicolon** after the closing brace
(slice from first `{` to last `}` before `JSON.parse`).

Field paths used:

| CLI field | JSON-LD path |
|-----------|--------------|
| `title` | `Title` |
| `description` | `Description` (HTML string; entities like `&oacute;` need decoding) |
| `company` | `HiringOrganization.Name` (fallback `identifier.Name`) |
| `location` | `JobLocation.Address.AddressLocality` + `.AddressRegion` |
| `date` | `DatePosted` (ISO) |
| `validThrough` | `ValidThrough` (ISO) |
| `employmentType` | `EmploymentType` (Spanish, e.g. `Tiempo completo`) |
| `salaryMin/Max` | `BaseSalary.Value.MinValue` / `.MaxValue` (**0 = undisclosed** → null) |
| `salaryCurrency` | `BaseSalary.Currency` (`MXN`) |
| `salaryPeriod` | `BaseSalary.Value.UnitText` (`MONTH`) |
| `id` | `identifier.Value` (matches the URL id) |

## The unused JSON API

robots.txt explicitly allows `/rest?server=jobs`, `/rest?server=jobs&service=relatedSearches`,
and `/rest?server=jobProfiles`, but every unauthenticated request returns:

```
HTTP 401 {"errors":[{"code":"SVR-03","description":"Petición no autorizada."}]}
```

None of the public web bundles call it (it appears to serve OCC's mobile apps with an
app token), so the CLI parses the public HTML instead. Re-check this endpoint if the
HTML markup breaks — it would be the cleaner source if it ever opens up.

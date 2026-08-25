# Computrabajo México URL Reference

Public, unauthenticated pages on `https://mx.computrabajo.com` used by this skill.
Server-rendered HTML; no API key or cookies required (a browser `User-Agent` header
is sent — the default curl/fetch UA may be blocked).

> Personal use only — keep volume low and stay within robots.txt (see below).

## Search

```
GET https://mx.computrabajo.com/trabajo-de-<query-slug>
GET https://mx.computrabajo.com/trabajo-de-<query-slug>-en-<location-slug>
GET https://mx.computrabajo.com/trabajo-de-<query-slug>?p=<n>
```

Query and location live in the **path**, not query params. Slugs are lowercase,
accent-stripped, hyphen-separated (`diseñador gráfico` → `disenador-grafico`;
`Ciudad de México` → `ciudad-de-mexico`).

| Piece | Meaning | Example |
|-------|---------|---------|
| `trabajo-de-<query>` | Free-text role/keyword search | `trabajo-de-desarrollador-fullstack` |
| `-en-<location>` | Optional city or state suffix | `-en-ciudad-de-mexico`, `-en-guadalajara`, `-en-estado-de-mexico` |
| `?p=<n>` | Pagination, 1-indexed, 20 cards/page (page 1 = no param) | `?p=2` |

Returns an HTML listing with one `<article class="box_offer …">` per job and a
heading `<h1><span class="fwB"> N </span> …</h1>` carrying the total match count.
An unknown/empty location or query still returns 200 with zero cards.

### Job-card HTML anchors

| Field | Anchor |
|-------|--------|
| `id` | `data-id='<32-hex>'` on the `<article>` |
| `title` + `url` | `<a class="js-o-link fc_base" href="/ofertas-de-trabajo/oferta-de-trabajo-de-<slug>-<id>#lc=…">Title</a>` |
| `company` | `<p class="dFlex vm_fx fs16 fc_base mt5">` — inner `<a … offer-grid-article-company-url>` when the company has a profile (the `<p>` also holds a rating "4.2" + star, so take the anchor text); plain text when confidential |
| `location` | `<p class="fs16 fc_base mt5">` (exact class match — the company `<p>` has extra leading classes) |
| `salary` | `<span class="icon i_salary"></span> $ 23,000.00 (Mensual)` (optional) |
| `date` | `<p class="fs13 fc_aux mt15">Hace 6 horas / Ayer / Hace 2 días / Hace más de 30 días</p>` (relative only) |

Beware: the page also embeds a handlebars `<script id="templateDetailOffer">`
template containing `{{…}}` placeholders — it contains no `<article class="box_offer`,
so splitting on the article tag skips it naturally.

## Detail

```
GET https://mx.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-<slug>-<32-hex-id>
```

The page is keyed on the trailing 32-char hex ID; the slug words are ignored, so the
CLI uses `oferta-de-trabajo-de-x-<id>`. **Caution:** the slug must still match
`oferta-de-trabajo-de-…` — a bare `oferta-de-trabajo-<id>` 301-redirects to a search
listing. Unknown IDs also redirect to a listing (no 404), so "not found" is detected
by the missing detail `<h1>`.

### Detail-page HTML anchors

| Field | Anchor |
|-------|--------|
| `title` | `<h1 class="fwB fs24 mb5 box_detail w100_m">` |
| `company` + `location` | next `<p class="fs16">Company - City, State</p>` (split on last `" - "`) |
| `salary` / `contractType` / `schedule` | `<span class="tag base mb10">` tags inside the offer section |
| `description` | first `<p class="mbB">` inside `<div … div-link="oferta">` (rich text with `<br/>`) |
| `requirements` | `<ul class="disc mbB"><li>…</li></ul>` |
| `date` | `<p class="fc_aux fs13">Hace 6 días (actualizada)</p>` (exact class — the "Palabras clave" `<p>` has extra classes) |

## robots.txt restrictions (verified 2026-07)

```
Disallow: /hojas-de-vida/*          Disallow: /curriculums/*
Disallow: /ofertas-de-trabajo/*dis=      Disallow: /ofertas-de-trabajo/*cont=
Disallow: /ofertas-de-trabajo/*pubdate=  Disallow: /ofertas-de-trabajo/*sal=
Disallow: /ofertas-de-trabajo/*by=       Disallow: /ofertas-de-trabajo/*emp=
Disallow: /ofertas-de-trabajo/*emcont=   Disallow: /ofertas-de-trabajo/*emsal=
Disallow: /ofertas-de-trabajo/*empubdate= …(and other em-prefixed variants)
Disallow: /ofertas-de-trabajo/Detail/Print.aspx
Disallow: /Ajax/*   Disallow: /_services/*   Disallow: /go/*
```

Consequences for this CLI:

- The `/trabajo-de-*` search paths and `?p=` pagination are **allowed** and are the
  only search URLs used.
- The server-side filter params `pubdate=` (posting age), `sal=` (salary), `cont=`
  (contract), `dis=` (distance), `by=`, `emp=` are **never sent**. `--jobage` is
  implemented as a **client-side** filter on the cards' relative dates instead.
- No `/Ajax/` or `/_services/` endpoints are called.

## Notes

- Requires a browser-like `User-Agent`; the CLI sends a Chrome UA.
- Dates are relative Spanish phrases only — no machine-readable timestamps in the
  listing. The CLI converts them to estimated ISO dates.
- The CLI retries 429/5xx with exponential backoff + jitter (max 6 retries) and
  treats a 404 as empty rather than crashing.

# Workana URL Reference

Public, unauthenticated pages used by this skill. Spanish-first LATAM freelance
marketplace; the same endpoints serve `es`, `en`, and `pt` projects.

> **robots.txt restriction:** `https://www.workana.com/robots.txt` disallows `/api/`
> (and `/*?*ag=1`). This skill therefore never calls the JSON API — it reads only the
> allowed public HTML pages below. Keep volume low; personal use only.

## Search

```
GET https://www.workana.com/jobs
```

Query params (all optional, combinable):

| Param | Meaning | Example |
|-------|---------|---------|
| `query` | Free-text keyword search | `react`, `desarrollo web` |
| `language` | Project language | `es` · `en` · `pt` |
| `country` | Client country (ISO-3166 alpha-2, uppercase) | `MX` · `AR` · `CO` · `CL` · `PE` · `BR` · `ES` |
| `category` | Category slug | `it-programming` · `design-multimedia` · `writing-translation` · `sales-marketing` · `admin-support` |
| `skills` | Skill slug (as linked from result cards) | `react-js` · `node-js` · `amazon-web-services` |
| `page` | Page number, 1-indexed | `2` |

There is **no server-side posted-date parameter** — the CLI's `--jobage` filters
client-side on the parsed relative date.

### Response structure

The page is server-rendered Vue. Job data is NOT in per-result HTML markup — it is
embedded as an **HTML-entity-encoded JSON blob** in the single-quoted
`:results-initials='…'` attribute of the `<search>` component:

```
:results-initials='{&quot;resultDescription&quot;:{&quot;count&quot;:4092,…},&quot;results&quot;:[…],&quot;pagination&quot;:{…}}'
```

Decode entities (`&quot;` → `"`, `&#039;` → `'`, `&amp;` → `&` last) and `JSON.parse`.
Relevant fields per result:

| JSON field | Content |
|------------|---------|
| `slug` | Project ID; detail URL is `/job/<slug>` |
| `title` | HTML fragment `<a><span title="Full title">Truncated…</span></a>` — full title is in the span's `title` attribute |
| `authorName` | Client display name, e.g. `"HECTOR M."` |
| `description` | Full project description as HTML (entity-encoded a second time) |
| `budget` | e.g. `"USD 250 - 500"`, `"Más de USD 3.000"`, `"Menos de USD 15 / hora"` |
| `isHourly` | `true` for hourly budgets |
| `postedDate` | Spanish relative date: `"Hace 9 horas"`, `"Ayer"`, `"Hace 2 días"` |
| `country` | HTML fragment with flag `<img title="Perú">` and `<a href="/jobs?country=PE">Perú</a>` |
| `skills[]` | `{ anchorText, anchorLink }` per required skill |
| `pagination` | `{ total, limit: 20, page, pages }` |

**Quirk:** the SSR blob carries only the **first ~7 results** of each 20-result page
(the remainder hydrate via the disallowed `/api/`). Pagination still advances 20 at a
time, so `page=2` starts at result 21.

## Detail

```
GET https://www.workana.com/job/<slug>
```

Plain SSR HTML (no JSON blob). Parsed markers:

| Field | Marker |
|-------|--------|
| Title | `<h1 class="h3 title">` |
| Status | `<span class="pry label rounded open">` (e.g. `Evaluando propuestas`) |
| Published | `Publicado el 11 Julio, 2026 en <Categoría>` (absolute Spanish date) |
| Budget | `<h4 class="budget …">` — shows a **status word** (`Abierto`) instead of the amount for logged-out visitors; only money-like text is kept |
| Description | `<div class="expander" …>` (full text, `<br/>`-separated) |
| Category / Subcategory / Scope | `Categoría <b>…</b>`, `Subcategoría <b>…</b>`, `¿Cuál es el alcance del proyecto? <b>…</b>` |
| Deadline | `Plazo de Entrega: …` |
| Skills | `<a class="skill label label-info">` |
| Client name | `<a class="h4 user-name"><span>…</span></a>` |
| Client country | Only a flag CSS class `flag flag-pe` → ISO code uppercased |

Unknown slugs return HTTP 404 → the CLI reports `{ "error": "Project not found", "code": "NOT_FOUND" }`.

## Notes

- No authentication or cookies required; a browser `User-Agent` is sent.
- Respect rate limits — the CLI backs off with jitter on 429/5xx (max 6 retries).
- Never append `ag=1` to URLs (disallowed by robots.txt).

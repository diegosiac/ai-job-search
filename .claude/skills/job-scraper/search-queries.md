# Search Queries for Job Scraper

<!-- Customized for Diego Cruz: freelance/contract fullstack developer, CDMX / remote LATAM, Spanish-language market -->

## Installed portal CLIs (primary for `/scrape`)

`/scrape` discovers every portal skill under `.agents/skills/*/SKILL.md` and runs its CLI first. Shipped country-agnostic CLIs include `linkedin-search` and `freehire-search`; Danish demos and any skill you add with `/add-portal` are included the same way. You do **not** need a matching `site:` line below for those CLIs to run.

The `site:` query templates in this file are the **WebSearch fallback** — for portals without a CLI, company career pages, or when a CLI fails.

## Search Sites

Primary (installed portal skills):
- **occ-search** (occ.com.mx, OCC Mundial) - major Mexican job board; supports `--location` and `--jobage`
- **computrabajo-search** (mx.computrabajo.com) - major Mexican job board; `--location` via URL slug, `--jobage` filtered client-side
- **workana-search** (workana.com) - LATAM freelance marketplace (best fit for contract work); results are projects with budgets
- **linkedin-search** (linkedin.com/jobs) - LinkedIn job listings (filter: Mexico / Ciudad de México / remote)

Manual only (no CLI possible):
- **indeed.com.mx** - blocks automated access (Cloudflare + robots.txt); browse manually and feed postings to `/apply` by URL or pasted text.

Not applicable:
- The built-in Danish portal CLIs (**jobindex, jobnet, jobbank, jobdanmark**) target the Danish market and MUST NOT be used for this profile.

Secondary (company career pages via Google):
- Direct Google searches with `site:` filters for known target companies

## Query Categories

Queries are grouped by priority. Combine each query with location terms (remoto, Ciudad de México, CDMX, México) where the site supports it. Prefer freelance/contract wording; the candidate is NOT looking for a full-time job change.

### Priority 1: Freelance/contract fullstack (React / Node.js / Next.js)

These match the strongest and most desired direction: contract fullstack work.

```
site:mx.indeed.com "desarrollador fullstack" freelance remoto
site:mx.indeed.com "desarrollador fullstack" "por proyecto" México
site:mx.indeed.com "React" "Node.js" freelance remoto
site:linkedin.com/jobs "desarrollador fullstack" freelance México
site:linkedin.com/jobs "fullstack developer" "contract" remoto México
site:linkedin.com/jobs "Next.js" freelance México
```

### Priority 2: AI/chatbots/WhatsApp integrations + AWS/cloud consulting

These match the two positioning niches: AI agents/chatbots for WhatsApp (proven at iVentas) and AWS cost-optimization consulting (proven: 45.5% reduction).

```
site:mx.indeed.com "chatbot" WhatsApp desarrollador México
site:mx.indeed.com "integraciones" "inteligencia artificial" desarrollador remoto
site:mx.indeed.com "consultor AWS" OR "consultor cloud" México
site:linkedin.com/jobs "desarrollador de chatbots" México
site:linkedin.com/jobs "agentes de IA" desarrollador México
site:linkedin.com/jobs "AWS" "optimización de costos" consultor México
```

### Priority 3: Frontend-only / backend-only contract roles

Narrower gigs the candidate also accepts.

```
site:mx.indeed.com "desarrollador frontend" React freelance remoto
site:mx.indeed.com "desarrollador backend" Node.js freelance remoto
site:mx.indeed.com "desarrollador backend" Go remoto México
site:linkedin.com/jobs "desarrollador React" freelance México
site:linkedin.com/jobs "desarrollador Node.js" contrato México
```

### Priority 4: Broader developer roles (wider net)

General technical roles worth screening; filter hard on contract type and deal-breakers.

```
site:mx.indeed.com desarrollador web remoto México
site:mx.indeed.com "freelance developer" México
site:mx.indeed.com desarrollador TypeScript remoto
site:linkedin.com/jobs "desarrollador de software" remoto México
site:linkedin.com/jobs NestJS OR MongoDB desarrollador México
```

## Skill Search Terms

Rotate these into custom queries: React, Next.js, Node.js, NestJS, Go, AWS, MongoDB, TypeScript.

## Title Search Terms (Spanish)

Desarrollador Fullstack, Desarrollador Frontend, Desarrollador Backend, Desarrollador React/Node.js, Freelance Developer, Desarrollador de chatbots/integraciones IA, Consultor AWS/Cloud.

## Location Filter

Location tiers when evaluating results:
- **Ideal:** fully remote (anywhere, Spanish-speaking client)
- **Acceptable:** hybrid within the CDMX metro area (zona metropolitana de la Ciudad de México)
- **Too far (reject):** anything requiring relocation or daily presence outside the CDMX metro area

## Deal-breaker Filters (drop postings that match any)

- English required for the role (interviews or daily work in English)
- Gambling/betting sector
- WordPress, Java, C#, C++ or .NET as the primary stack
- 90-day payment terms
- Night shifts or on-call
- Full-time employment incompatible with keeping the current iVentas role

## Date Filter

Only include jobs posted within the last 14 days, or with an application deadline that has not yet passed. If a posting date cannot be determined, include it but flag as "date unknown".

## Adapting Queries

If the user specifies a focus area, select queries from the matching category and also generate 2-3 custom queries for that focus. For example:
- "/scrape aws" -> Priority 2 cloud-consulting queries + custom AWS-focused queries
- "/scrape chatbots" -> Priority 2 chatbot queries + custom WhatsApp/IA queries

---
framework_version: 1.1.1
---

# Candidate Profile

## Identity
- **Name:** Diego Cruz (name used on all documents)
- **Legal name:** Diego de Jesús Crúz Vazquez - only for official forms, NEVER on CV or cover letters
- **Location:** Zona metropolitana de la Ciudad de México (CDMX), Mexico
- **Phone:** +52 5660839455
- **Email:** diego35502@gmail.com (primary; never use the hotmail address)
- **LinkedIn:** https://linkedin.com/in/diegosiac
- **GitHub:** https://github.com/diegosiac
- **Website:** https://diegosiac.com
- **Status:** Employed full-time at iVentas (effectively half-time workload). Seeking ADDITIONAL freelance/contract/external-collaborator work, NOT a full-time job change.
- **Constraints:** Remote ideal; hybrid acceptable within CDMX metro; no relocation. Availability for freelance: ~7 hours/day plus weekends.

### Languages
<!-- Every language you can work in professionally, with your honest level. Used by the
Language Gate in 04-job-evaluation.md and by job-scraper/search-queries.md's query-language
generation. Omit any language you don't actually work in - an undeclared language is treated as
a hard no, not a gap to smooth over. -->

| Language | Level | Notes |
|----------|-------|-------|
| Spanish | Native | All application documents are written in neutral professional Spanish |

English is deliberately **not** declared: the candidate's English is very low (cannot yet hold a conversation or read comfortably), so any posting that requires English as a job condition FAILs the Language Gate - this is the mechanism behind the "English-required roles" deal-breaker. Never claim English proficiency on the CV; if a form asks for the level directly, answer "básico" honestly.

## Education
**Intentionally omitted (user decision).** Background is high school plus an uncertified 6-month bootcamp; the AWS certifications carry the credential weight instead. **Never add an education section to any generated CV or profile document.** If a form strictly requires education, ask the user before filling it in.

## Critical Data Rule: No Fabricated Metrics
Old CV drafts contained templated fake metrics (30% UX improvement, 20% query improvement, 25% cost reduction). **NEVER reuse those.** The only real, defensible metrics are:
1. ~45.5% AWS infrastructure cost reduction (iVentas)
2. Total service outages from 2/day (~30 min each) to 0 for months (iVentas)
3. 2 LinkedIn posts with +15k views and ~100 likes each (AWS cert announcements)
4. Go services handling thousands of messages per second (iVentas)

## Certifications
Both verifiable at aws.amazon.com/verification.

| Certification | Issued | Expires | Validation number |
|---------------|--------|---------|-------------------|
| AWS Certified Cloud Practitioner | Sep 4, 2024 | Jan 13, 2028 | 40391940f1624728b9520bd74e9330e8 |
| AWS Certified Developer - Associate | Jan 13, 2025 | Jan 13, 2028 | a8a9a3f811dd46edb547f40551308000 |

## Professional Experience

### Desarrollador Fullstack - iVentas (May 2025 - present)
CDMX, remote/hybrid. Company: iventas.com - WhatsApp/Messenger CRM for LATAM businesses; AI chatbots/agents with sales-intent detection; TOP 100 Startups LATAM 2022-2024; selected by Amazon for an AI synergy program; 200% YoY growth.

End-to-end scope:
- AWS infrastructure: ECS containers, EC2, load balancing, security, cost control
- Backend: new features, query-latency optimization, legacy-code restructuring
- Frontend: UI work, custom per-client analytics dashboards, new products built from scratch (infra + backend + frontend)
- Currently infrastructure lead for the first AI-agent marketplace for WhatsApp (latency, UX, cost efficiency)
- Migrating the legacy frontend toward microservices/microfrontends using AI agents to accelerate implementation and code review
- Built internal tools connecting AI agents (Claude Code) to company systems - pushing the company toward AI-native development; notably faster feature delivery with careful human review

Real achievements:
1. **Reduced AWS infrastructure cost by ~45.5%**: audited AWS Cost Explorer, identified top-spending services, traced an S3 egress spike to an application-level cache bug, fixed it and reconfigured resources for better utilization - lower spend with higher performance.
2. **Eliminated total service outages**: from 2 outages/day (~30 min each, affecting large clients) to 0 for months - dockerized the bottleneck service and deployed it on ECS with load-based autoscaling; pay-per-use configuration meant no added AWS cost.

Tech: Express, Hono, NestJS, Next.js, React, Firebase Realtime, MongoDB, AWS Lambdas, Go (high-throughput messaging - thousands of msgs/sec), event-driven architecture, monorepo, caching, Vercel, Railway, AWS, Claude Code / AI agents.

### Desarrollador Frontend - Omica AI (Oct 2023 - May 2025)
CDMX.
- Built a SaaS application for doctors to consult their lab analyses and medical studies
- With the team, integrated AI into the application, including a novel integration not previously done
- Tech: React, Next.js (frontend focus)

### Desarrollador Fullstack (Freelance) - Iniciativa Geekmobile (May 2023 - Sep 2023)
Fixed ~6-month engagement, delivered as an independent freelancer.
- Built a marketplace for mobile devices and mobile-device spare parts, end to end
- Integrated PayPal payment gateway

## Independent Projects
- **Iniciativa Geekmobile marketplace** (see above) - full freelance delivery, end to end
- **Personal branding:** 2 LinkedIn posts (AWS certification announcements) with +15k views and ~100 likes each

## Technical Skills

### Frontend
- React, React Native, Next.js, TypeScript, JavaScript, Redux, TailwindCSS, HTML, CSS

### Backend
- Node.js, NestJS, Express, Hono, Go, Python, Django, Prisma, REST, gRPC, AWS Lambdas

### Cloud / DevOps
- AWS (ECS, EC2, S3, Lambdas, load balancing, Cost Explorer, security), Docker, CI/CD, GitHub Actions, Vercel, Railway, Firebase

### Databases
- MongoDB, PostgreSQL, DynamoDB, Redis, MySQL, Firebase Realtime

### Patterns & Practices
- Event-driven architecture, monorepo, caching strategies, clean code, unit/integration testing, AI-agent-assisted development (Claude Code)

### Testing
- Jest (unit tests, used at Omica AI), Vitest (unit tests, used at iVentas), Playwright (E2E tests, used at iVentas)

### Tools
- Git, GitHub, Jira

## Freelance Positioning
- **Target engagement types:** freelance / contract / external collaborator - fullstack primarily; also frontend-only or backend-only gigs
- **Positioning niches:**
  1. AWS/cloud cost-optimization consulting (proven: ~45.5% cost reduction at iVentas)
  2. AI agents / chatbots for WhatsApp (proven at iVentas: WhatsApp CRM, AI-agent marketplace)
- **Modality:** remote, or hybrid within CDMX; NOT a full-time job change (keeps iVentas)
- **Compensation:** flexible - per project, per hour, or retainer; no hard floor
- **Deal-breakers:** gambling/betting sector, WordPress, Java, C#, C++, 90-day payment terms, night shifts/on-call, English-required roles (automatic disqualifier for now)
- **Document language:** all application documents in neutral professional Spanish

## Publications
- None.

## Awards
- None.

## References
- None yet. Do not list references on the CV; use "Disponibles a solicitud." if a references line is needed.

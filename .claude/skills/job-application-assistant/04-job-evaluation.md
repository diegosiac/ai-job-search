---
framework_version: 1.1.0
---

# Job Evaluation Framework

## Automatic Disqualifiers (check FIRST, before scoring)

Reject immediately, without scoring, if the posting has any of:
- **English required** for the role (interviews, documentation, or daily communication in English) - the candidate's English is currently very low; this is an automatic disqualifier for now
- Gambling/betting sector
- Primary stack is WordPress, Java, C#, C++, or .NET
- 90-day payment terms
- Night shifts or on-call rotations
- Full-time employment that would require leaving iVentas
- Relocation or daily presence outside the CDMX metro area

## Freelance-Fit Criteria (this candidate seeks contract work, not a job change)

The candidate is employed at iVentas and looks for ADDITIONAL freelance/contract/external-collaborator engagements (~7 hours/day plus weekends available). Evaluate every posting on:
- **Contract type:** freelance, contract, project-based, or external collaborator = good. Full-time employee roles = fail unless explicitly compatible with keeping iVentas.
- **Payment terms:** per project, per hour, or retainer are all acceptable (no hard floor). 90-day payment terms = disqualifier. Prefer 30 days or less; flag 45-60 days.
- **Scope clarity:** clear deliverables and boundaries = good. Vague "we need someone for everything, indefinitely" = flag for discussion.
- **Schedule compatibility:** async/flexible = ideal. Fixed full-business-hours presence = flag (conflicts with iVentas).

## Eligibility Gate — run before scoring

If the candidate is not a citizen or permanent resident of the country they are applying in, run this first. It is a hard filter, not a scoring dimension, and it is separate from work-permit *timing*: timing asks "can they work the required hours yet?", eligibility asks "are they permitted to hold this job at all?". A candidate can pass timing and still be categorically excluded.

Read the posting's eligibility / work rights / "who can apply" section **verbatim** and classify:

| Posting wording | Verdict |
|-----------------|---------|
| Names a **citizenship or permanent-residency requirement** ("must be a citizen of X", "permanent resident", "PR required", "full working rights" where the employer means citizen/PR) | **FAIL — hard stop.** Do not score, do not draft. Quote the exact wording back to the user. |
| Requires a **security clearance** at any level | **FAIL** in most countries, since clearance is normally gated on citizenship. Verify the specific scheme rather than assuming. |
| **Explicitly names** the candidate's permit class, or says "international applicants welcome", "visa holders considered", "we sponsor" | **PASS** — verified acceptance. Worth noting as a positive in the application. |
| **Silent** on citizenship or residency | **PROCEED, but mark unverified.** Check the employer's own careers or international-applicant page before drafting. |

**Two rules that are easy to get wrong:**

1. **Silence is not permission.** Large graduate programs frequently gate eligibility on their own website rather than in the job ad. Highest-risk categories: professional-services firms, government and defence, banking, telecommunications, and anything touching critical infrastructure.
2. **A company-wide "we accept international applicants" statement is not role-level permission.** The common pattern is a general welcome followed by a *named list* of the specific programs or service lines it covers. Confirm the **specific posting or stream** appears on that list before drafting.

**Report an eligibility failure to the user with the quoted source** rather than silently dropping the role. They may know something about their own status that the profile does not record.

If the candidate's permit also constrains *hours* or *start date* (a student visa with a term-time cap, a permit that begins on graduation), record that as a second gate under this section during `/setup`, with the specific dates. Do not merge it with the eligibility question above — they fail for different reasons and need different answers.

A role that fails this gate is not scored and not drafted. Everything below applies only to roles that pass it.

## Scoring Dimensions

Evaluate each job posting against these five dimensions:

### 1. Technical Skills Match (0-100)
How well do the required/preferred skills align with the candidate's capabilities?

| Score | Meaning |
|-------|---------|
| 80-100 | Core requirements are primary skills |
| 60-79 | Most requirements match, 1-2 gaps that are learnable |
| 40-59 | Partial match, significant upskilling needed |
| 0-39 | Fundamental mismatch |

**Strong match areas:** React, Next.js, TypeScript, Node.js (NestJS, Express, Hono), Go, AWS (ECS, EC2, S3, Lambdas, Cost Explorer), Docker, MongoDB, AI integrations, WhatsApp bots/chatbots, event-driven architecture, AWS cost optimization, AI-agent-assisted development (Claude Code)
**Moderate match areas:** Python, Django, React Native, PostgreSQL, DynamoDB, Redis, MySQL, gRPC, Prisma, Firebase
**Weak match areas / avoid:** Java, C#, C++, WordPress, .NET, native iOS/Android beyond React Native, anything requiring English

### 2. Experience Match (0-100)
Does work history align with what they're looking for?

| Score | Meaning |
|-------|---------|
| 80-100 | Direct experience in the same domain and role type |
| 60-79 | Related experience, transferable skills clear |
| 40-59 | Adjacent experience, would need to make the case |
| 0-39 | Unrelated experience |

**Strong:** Fullstack web development for SaaS/startups (CRM, health, marketplace); AWS infrastructure ownership (ECS, autoscaling, cost control); AI chatbots/agents for WhatsApp; high-throughput messaging in Go; frontend product work in React/Next.js; freelance end-to-end delivery (Geekmobile marketplace with PayPal)
**Moderate:** Backend-only roles (strong Node.js/Go, but no dedicated backend-title history); DevOps/platform roles (real AWS/Docker work, but no dedicated DevOps title); data-heavy roles (MongoDB/PostgreSQL modeling, no analytics/ML background)
**Entry-level:** Mobile development (React Native knowledge without shipped-app history); team leadership beyond infrastructure lead for one product

### 3. Behavioral/Culture Fit (0-100)
Does the role and company culture match the behavioral profile?

| Score | Meaning |
|-------|---------|
| 80-100 | Culture strongly matches behavioral preferences |
| 60-79 | Mixed signals but mostly compatible |
| 40-59 | Some friction areas |
| 0-39 | Significant culture mismatch |

**Red flags to research:** Department disorganization, work dominated by maintenance over development, poor chemistry with leadership, culture mismatches. Check reviews, media coverage, LinkedIn connections, and network contacts for insider perspective.

### 4. Location & Logistics (Pass/Fail + Notes)
- Fully remote: PASS (ideal)
- Hybrid within CDMX metro: PASS (acceptable)
- Requires relocation or daily presence outside CDMX metro: FAIL (deal-breaker)
- Frequent international travel: FLAG (discuss with user; English constraint also applies)

### 5. Career Alignment & Motivation (0-100)
Does this role advance career goals and contain tasks that energize?

| Score | Meaning |
|-------|---------|
| 80-100 | Strongly aligned with career direction, clear growth path |
| 60-79 | Good role but only partially aligned with long-term goals |
| 40-59 | Decent job but doesn't build toward career goals |
| 0-39 | Dead end or backwards step |

**Career goals:**
- Build a freelance/contract portfolio alongside the iVentas role (fullstack primarily; frontend-only or backend-only gigs also fine)
- Establish a consulting niche in AWS/cloud cost optimization (proven: ~45.5% reduction at iVentas)
- Establish a delivery niche in AI agents/chatbots for WhatsApp (proven at iVentas)

**Motivation filter:** Evaluate not just whether you *can* do the tasks, but whether the tasks will *energize* you. Consider:
- Tasks that energize: AI agents in development workflows (Claude Code), system design, scaling, gradual migrations, database modeling, cost audits/optimization, long technical investigations
- Tasks that drain: pure maintenance with no improvement scope, siloed work with no infrastructure or design input, legacy stacks on the avoid list (WordPress, Java, C#, C++)
- Non-task factors: leadership style, department culture, company values, degree of autonomy

**Life situation alignment:** Consider personal constraints:
- **Security**: employed at iVentas; freelance income is additional, so compensation is flexible (per project, per hour, or retainer; no hard floor) - but never 90-day payment terms
- **Flexibility**: ~7 hours/day plus weekends available; must remain compatible with the iVentas commitment; no night shifts or on-call
- **Professional development**: engagements that deepen AWS/cloud, AI-agent, and system-design expertise are worth more than generic dev work

### 6. Salary Benchmark (Optional)

If the salary lookup tool is configured (`salary_data.json` exists), look up the company:
```
python salary_lookup.py "<Company Name>" --json
```

If a city is known from the posting, add `--city "<City>"` to narrow results.

Present findings as:
```
### Salary Benchmark
| Metric | Value |
|--------|-------|
| [Category] index | XX.X (+/-X.X% vs baseline) |
| Overall index | XX.X (+/-X.X% vs baseline) |
```

Interpret results relative to the baseline defined in the data file's metadata. For index-based data, higher typically means above-market compensation.

If the salary tool is not configured, skip this section.

## Output Format

Present the evaluation as:

```
## Job Fit Evaluation: [Role] at [Company]

| Dimension | Score | Notes |
|-----------|-------|-------|
| Technical Skills | XX/100 | [brief note] |
| Experience Match | XX/100 | [brief note] |
| Behavioral Fit | XX/100 | [brief note] |
| Location | PASS/FAIL | [brief note] |
| Career Alignment | XX/100 | [brief note] |

**Overall Score: XX/100** (weighted average of scored dimensions)

### Verdict: [Strong Fit / Good Fit / Moderate Fit / Weak Fit / Poor Fit]

### Key Strengths for This Role
- [bullet points]

### Gaps to Address
- [bullet points]

### Recommendation
[1-2 sentences: apply/skip/apply with caveats]

### Company Research Checklist
- [ ] Checked company website (mission, values, recent news)
- [ ] Checked review sites (Glassdoor, Jobindex, etc.)
- [ ] Checked LinkedIn for team size, recent hires, connections
- [ ] Checked media for restructuring, growth, or workplace issues
- [ ] Identified network contacts who may know the team/manager
```

## Weighting
- Technical Skills: 30%
- Experience Match: 25%
- Behavioral Fit: 15%
- Career Alignment: 30%

(Location is pass/fail, not weighted)

## Thresholds
- **Strong Fit** (75+): Definitely apply, tailor everything
- **Good Fit** (60-74): Apply, address gaps in cover letter
- **Moderate Fit** (45-59): Consider carefully, discuss with user
- **Weak Fit** (30-44): Probably skip unless strategic reasons
- **Poor Fit** (<30): Skip

## Pre-Application: Call the Employer (Best Practice)

Before writing the application, consider whether the candidate should call the contact person listed in the posting. **Only call if there are substantive questions** - never call just to "be remembered."

### When to Suggest Calling
- The posting has unclear or ambiguous requirements
- It's unclear which competencies are essential vs. nice-to-have
- The role description is vague about day-to-day tasks
- There's a named contact person who invites questions

### Good Questions to Ask
- "What are the primary challenges in this role?"
- "How is time typically divided across the listed responsibilities?"
- "Which competencies are most critical for success in this position?"
- "What does success look like in the first 6-12 months?"

### Rules for the Call
- Prepare a 30-second "elevator pitch" about your background in case they ask
- The call's purpose is **gathering information**, not delivering a pitch
- Take notes - use what you learn to tailor the application
- Reference the conversation naturally in the cover letter ("After speaking with [name], I was especially drawn to...")

import { detailUrl, htmlFetch, normalizeId, parseJobDetail, writeError } from "../helpers.js"

export interface DetailOpts {
  id: string
  format: "json" | "plain"
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  const id = normalizeId(opts.id)
  if (!id) {
    writeError(
      `Could not parse a job ID from "${opts.id}" (expected a 32-char hex ID or a mx.computrabajo.com offer URL)`,
      "BAD_ID",
    )
    return 1
  }
  try {
    const html = await htmlFetch(detailUrl(id))
    // Unknown IDs 301-redirect to a search listing (no 404), so parseJobDetail
    // returns null when the fetched page is not actually a detail page.
    const job = html ? parseJobDetail(html, id) : null
    if (!job) {
      writeError("Job not found", "NOT_FOUND")
      return 1
    }

    if (opts.format === "plain") {
      const lines = [
        job.title,
        `${job.company || "—"} · ${job.location || "—"}`,
        "",
        job.salary ? `Salary: ${job.salary}` : "",
        job.contractType ? `Contract: ${job.contractType}` : "",
        job.schedule ? `Schedule: ${job.schedule}` : "",
        job.dateText ? `Posted: ${job.dateText}` : "",
        "",
        job.description || "(no description)",
        job.requirements.length ? "\nRequirements:\n" + job.requirements.map((r) => `- ${r}`).join("\n") : "",
        "",
        `URL: ${job.url}`,
      ].filter((l) => l !== "")
      process.stdout.write(lines.join("\n") + "\n")
    } else {
      process.stdout.write(JSON.stringify(job, null, 2) + "\n")
    }
    return 0
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "DETAIL_FAILED")
    return 1
  }
}

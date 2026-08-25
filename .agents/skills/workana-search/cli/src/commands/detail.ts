import { DETAIL_URL, htmlFetch, parseProjectDetail, writeError } from "../helpers.js"

export interface DetailOpts {
  id: string
  format: "json" | "plain"
}

/** Accept a raw project slug or a full workana.com/job/<slug> URL. */
export function normalizeSlug(input: string): string | null {
  const url = input.match(/workana\.com\/job\/([a-z0-9-]+)/i)
  if (url) return url[1].toLowerCase()
  const bare = input.match(/^[a-z0-9][a-z0-9-]*$/i)
  if (bare) return input.toLowerCase()
  return null
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  const slug = normalizeSlug(opts.id)
  if (!slug) {
    writeError(`Could not parse a project slug from "${opts.id}"`, "BAD_ID")
    return 1
  }
  try {
    const html = await htmlFetch(`${DETAIL_URL}/${slug}`)
    if (!html) {
      writeError("Project not found", "NOT_FOUND")
      return 1
    }
    const project = parseProjectDetail(html, slug)

    if (opts.format === "plain") {
      const lines = [
        project.title,
        `${project.company || "—"} · ${project.location || "—"}${project.status ? ` · ${project.status}` : ""}`,
        "",
        project.budget ? `Budget: ${project.budget}` : "",
        project.category ? `Category: ${project.category}` : "",
        project.subcategory ? `Subcategory: ${project.subcategory}` : "",
        project.scope ? `Scope: ${project.scope}` : "",
        project.deadline ? `Deadline: ${project.deadline}` : "",
        project.date ? `Published: ${project.date}` : "",
        project.skills.length > 0 ? `Skills: ${project.skills.join(", ")}` : "",
        "",
        project.description || "(no description)",
        "",
        `URL: ${project.url}`,
      ].filter((l) => l !== "")
      process.stdout.write(lines.join("\n") + "\n")
    } else {
      process.stdout.write(JSON.stringify(project, null, 2) + "\n")
    }
    return 0
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "DETAIL_FAILED")
    return 1
  }
}

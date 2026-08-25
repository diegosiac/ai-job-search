// Live smoke tests against workana.com. They hit the real site (a handful of
// requests), so they need network access. Run with: bun test --timeout 30000
import { describe, test, expect } from "bun:test";
import { runCLI, parseJSON } from "./helpers";

interface SearchResult {
  id: string | null;
  title: string | null;
  company: string | null;
  location: string | null;
  date: string | null;
  url: string | null;
  budget: string | null;
}

interface SearchResponse {
  meta: { count: number; page: number };
  results: SearchResult[];
}

function parsedStderr(stderr: string): { error?: string; code?: string } {
  try {
    return JSON.parse(stderr);
  } catch {
    return {};
  }
}

describe("workana-cli live smoke tests", () => {
  test('search -q "react" exits 0 with at least 1 well-formed result', async () => {
    const result = await runCLI(["search", "-q", "react", "--limit", "5"]);
    expect(result.exitCode).toBe(0);
    const data = parseJSON<SearchResponse>(result);

    expect(data.meta).toBeDefined();
    expect(typeof data.meta.count).toBe("number");
    expect(typeof data.meta.page).toBe("number");
    expect(Array.isArray(data.results)).toBe(true);
    expect(data.results.length).toBeGreaterThanOrEqual(1);

    for (const r of data.results) {
      // Contract minimum: keys always present (null allowed except id/title/url here).
      expect(r).toHaveProperty("company");
      expect(r).toHaveProperty("location");
      expect(r).toHaveProperty("date");
      expect(r).toHaveProperty("budget");
      expect(r.id).toBeTruthy();
      expect(r.title).toBeTruthy();
      expect(r.url).toMatch(/^https:\/\/www\.workana\.com\/job\//);
    }
  }, 30000);

  test("bogus numeric flag exits 1 with JSON error on stderr", async () => {
    const result = await runCLI(["search", "-q", "react", "--jobage", "banana"]);
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    const err = parsedStderr(result.stderr);
    expect(err.code).toBe("BAD_ARG");
    expect(err.error).toMatch(/jobage/);
  });

  test("unknown command exits 1 with JSON error on stderr", async () => {
    const result = await runCLI(["frobnicate"]);
    expect(result.exitCode).toBe(1);
    const err = parsedStderr(result.stderr);
    expect(err.code).toBe("BAD_CMD");
  });

  test("detail requires a slug", async () => {
    const result = await runCLI(["detail"]);
    expect(result.exitCode).toBe(1);
    const err = parsedStderr(result.stderr);
    expect(err.code).toBe("NO_ID");
  });

  test("detail rejects an unparseable slug", async () => {
    const result = await runCLI(["detail", "https://example.com/not-workana"]);
    expect(result.exitCode).toBe(1);
    const err = parsedStderr(result.stderr);
    expect(err.code).toBe("BAD_ID");
  });

  test("search result slug feeds detail with a readable description", async () => {
    const search = await runCLI(["search", "-q", "react", "--limit", "1"]);
    expect(search.exitCode).toBe(0);
    const data = parseJSON<SearchResponse>(search);
    expect(data.results.length).toBeGreaterThanOrEqual(1);

    const slug = data.results[0].id as string;
    const detail = await runCLI(["detail", slug]);
    expect(detail.exitCode).toBe(0);
    const project = JSON.parse(detail.stdout) as {
      id: string;
      title: string;
      url: string;
      description: string | null;
    };
    expect(project.id).toBe(slug);
    expect(project.title).toBeTruthy();
    expect(project.url).toBe(`https://www.workana.com/job/${slug}`);
    expect(project.description).toBeTruthy();
    expect((project.description as string).length).toBeGreaterThan(50);
  }, 60000);
});

// Live smoke tests — hit www.occ.com.mx for real. Kept to a handful of
// requests; run with `bun test --timeout 30000` (the package.json default).
import { describe, expect, test } from "bun:test";
import { parseJSON, runCLI } from "./helpers";

interface SearchResult {
  id: string | null;
  title: string | null;
  company: string | null;
  location: string | null;
  date: string | null;
  url: string | null;
}

interface SearchOutput {
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

describe("live: search", () => {
  test('search -q "desarrollador fullstack" returns real results', async () => {
    const result = await runCLI(["search", "-q", "desarrollador fullstack", "--limit", "5"]);
    expect(result.exitCode).toBe(0);
    const out = parseJSON<SearchOutput>(result);
    expect(out.meta.count).toBeGreaterThanOrEqual(1);
    expect(out.meta.page).toBe(1);
    expect(out.results.length).toBeGreaterThanOrEqual(1);
    for (const r of out.results) {
      expect(r.id).toBeTruthy();
      expect(r.id).toMatch(/^\d+$/);
      expect(r.title).toBeTruthy();
      expect(r.title).not.toMatch(/[<>]/);
      expect(r.url).toMatch(/^https:\/\/www\.occ\.com\.mx\/empleo\/oferta\/\d+$/);
    }
  }, 30000);
});

describe("live: detail", () => {
  test("detail of a fresh search result has a readable description", async () => {
    const search = await runCLI(["search", "-q", "desarrollador fullstack", "--limit", "1"]);
    expect(search.exitCode).toBe(0);
    const out = parseJSON<SearchOutput>(search);
    expect(out.results.length).toBeGreaterThanOrEqual(1);
    const id = out.results[0].id as string;

    const detail = await runCLI(["detail", id]);
    expect(detail.exitCode).toBe(0);
    const job = parseJSON<{ id: string; title: string; description: string | null; url: string }>(detail);
    expect(job.id).toBe(id);
    expect(job.title).toBeTruthy();
    expect(job.description).toBeTruthy();
    // Entities decoded and tags stripped.
    expect(job.description).not.toMatch(/<\/?[a-z]+>/i);
    expect(job.description).not.toMatch(/&[a-z]+;|&#\d+;/i);
  }, 45000);
});

describe("error contract", () => {
  test("missing query and location exits 1 with JSON error on stderr", async () => {
    const result = await runCLI(["search"]);
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    const err = parsedStderr(result.stderr);
    expect(err.code).toBe("NO_QUERY");
    expect(err.error).toBeTruthy();
  });

  test("non-numeric --jobage exits 1 with BAD_ARG on stderr", async () => {
    const result = await runCLI(["search", "-q", "x", "--jobage", "foo"]);
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    const err = parsedStderr(result.stderr);
    expect(err.code).toBe("BAD_ARG");
    expect(err.error).toMatch(/jobage/);
  });

  test("unknown command exits 1 with BAD_CMD on stderr", async () => {
    const result = await runCLI(["bogus"]);
    expect(result.exitCode).toBe(1);
    const err = parsedStderr(result.stderr);
    expect(err.code).toBe("BAD_CMD");
  });

  test("detail without id exits 1 with NO_ID on stderr", async () => {
    const result = await runCLI(["detail"]);
    expect(result.exitCode).toBe(1);
    const err = parsedStderr(result.stderr);
    expect(err.code).toBe("NO_ID");
  });

  test("detail with unparseable id exits 1 with BAD_ID on stderr", async () => {
    const result = await runCLI(["detail", "not-an-id"]);
    expect(result.exitCode).toBe(1);
    const err = parsedStderr(result.stderr);
    expect(err.code).toBe("BAD_ID");
  });
});

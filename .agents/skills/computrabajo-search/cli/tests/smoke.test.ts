// Live smoke tests — hit mx.computrabajo.com once for search (and reuse an ID
// for detail). Kept minimal to respect the site: two HTTP requests total.
import { describe, expect, test } from "bun:test";
import { runCLI, parseJSON } from "./helpers";

interface SearchPayload {
  meta: { count: number; page: number; total: number | null };
  results: Array<{
    id: string | null;
    title: string | null;
    company: string | null;
    location: string | null;
    date: string | null;
    url: string | null;
  }>;
}

describe("live smoke", () => {
  test(
    'search -q "desarrollador fullstack" returns results with id/title/url',
    async () => {
      const result = await runCLI(["search", "-q", "desarrollador fullstack", "--limit", "5"]);
      expect(result.exitCode).toBe(0);
      const payload = parseJSON<SearchPayload>(result);
      expect(payload.meta.page).toBe(1);
      expect(payload.results.length).toBeGreaterThanOrEqual(1);
      for (const job of payload.results) {
        expect(job.id).toBeTruthy();
        expect(job.title).toBeTruthy();
        expect(job.url).toMatch(/^https:\/\/mx\.computrabajo\.com\//);
      }
      // Contract: every field key present even when null.
      const keys = Object.keys(payload.results[0]);
      for (const k of ["id", "title", "company", "location", "date", "url"]) {
        expect(keys).toContain(k);
      }

      // Reuse an ID from the search for the detail smoke (one extra request).
      const detail = await runCLI(["detail", payload.results[0].id!, "--format", "plain"]);
      expect(detail.exitCode).toBe(0);
      expect(detail.stdout.length).toBeGreaterThan(50);
    },
    30000
  );
});

describe("error handling (offline)", () => {
  test("missing --query exits 1 with JSON error on stderr", async () => {
    const result = await runCLI(["search"]);
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    const err = JSON.parse(result.stderr);
    expect(err.code).toBe("NO_QUERY");
    expect(err.error).toBeTruthy();
  });

  test("non-numeric --jobage exits 1 with BAD_ARG", async () => {
    const result = await runCLI(["search", "-q", "x", "--jobage", "foo"]);
    expect(result.exitCode).toBe(1);
    const err = JSON.parse(result.stderr);
    expect(err.code).toBe("BAD_ARG");
    expect(err.error).toMatch(/jobage/);
  });

  test("non-numeric --page exits 1 with BAD_ARG", async () => {
    const result = await runCLI(["search", "-q", "x", "--page", "abc"]);
    expect(result.exitCode).toBe(1);
    expect(JSON.parse(result.stderr).code).toBe("BAD_ARG");
  });

  test("detail without an id exits 1 with NO_ID", async () => {
    const result = await runCLI(["detail"]);
    expect(result.exitCode).toBe(1);
    expect(JSON.parse(result.stderr).code).toBe("NO_ID");
  });

  test("detail with an unparseable id exits 1 with BAD_ID", async () => {
    const result = await runCLI(["detail", "not-an-id"]);
    expect(result.exitCode).toBe(1);
    expect(JSON.parse(result.stderr).code).toBe("BAD_ID");
  });

  test("unknown command exits 1 with BAD_CMD", async () => {
    const result = await runCLI(["frobnicate"]);
    expect(result.exitCode).toBe(1);
    expect(JSON.parse(result.stderr).code).toBe("BAD_CMD");
  });
});

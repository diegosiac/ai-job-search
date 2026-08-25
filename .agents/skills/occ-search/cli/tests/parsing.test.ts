import { describe, expect, test } from "bun:test";
import {
  decodeHtmlEntities,
  extractJobPostingLd,
  htmlToText,
  parseJobCards,
  parseJobDetail,
  parseTotalOffers,
  relativeDateToISO,
  slugify,
} from "../src/helpers";
import { buildUrl } from "../src/commands/search";
import { normalizeId } from "../src/commands/detail";

const NOW = new Date("2026-07-11T12:00:00Z");

function card(
  id: string,
  opts: { title?: string; company?: string; location?: string; salary?: string; date?: string } = {},
): string {
  const { title = "Desarrollador", company, location = "Ciudad de M&#xE9;xico", salary, date = "Hoy" } = opts;
  return `<div class="card-job-offer
" tabindex="0" data-id='${id}' data-blind="false" id="jobcard-${id}" data-offers-grid-offer-item-container>
    <span class="mr-2 text-sm font-light">${date}</span>
    <h2 class="text-grey-900 text-lg break-words inline-block mt-0 mr-2 mb-0 ellipsis">${title}</h2>
    ${salary ? `<span class="mr-2 text-grey-900 font-base font-light mb-2 sm:mb-4">${salary}</span>` : ""}
    ${
      company
        ? `<span class="line-clamp-title"><a href="https://www.occ.com.mx/empleos/bolsa-de-trabajo-x/" class="it-blank">${company}</a></span>`
        : ""
    }
    <div class="no-alter-loc-text mt-1"><span class="text-grey-900 m-0 text-sm font-light"></span><p class="text-grey-900 m-0 text-sm font-light hover:text-decoration-none">${location}</p></div>
  </div>`;
}

describe("parseJobCards", () => {
  test("parses a full card", () => {
    const html = card("21247400", {
      title: "Desarrollador fullstack",
      company: "SYE SOFTWARE S.A. DE C.V.",
      salary: "$ 50,000 - $ 52,000 Mensual",
      date: "Ayer",
    });
    const cards = parseJobCards(html, NOW);
    expect(cards).toHaveLength(1);
    const c = cards[0];
    expect(c.id).toBe("21247400");
    expect(c.title).toBe("Desarrollador fullstack");
    expect(c.company).toBe("SYE SOFTWARE S.A. DE C.V.");
    expect(c.location).toBe("Ciudad de México");
    expect(c.salary).toBe("$ 50,000 - $ 52,000 Mensual");
    expect(c.date).toBe("2026-07-10");
    expect(c.url).toBe("https://www.occ.com.mx/empleo/oferta/21247400");
  });

  test("missing company/salary become null, never omitted", () => {
    const cards = parseJobCards(card("111111"), NOW);
    expect(cards).toHaveLength(1);
    expect(cards[0].company).toBeNull();
    expect(cards[0].salary).toBeNull();
    expect(Object.keys(cards[0])).toEqual(
      expect.arrayContaining(["id", "title", "company", "location", "salary", "date", "url"]),
    );
  });

  test("one malformed card does not break the rest", () => {
    const malformed = `<div class="card-job-offer" data-id='222222'><h2></h2></div>`;
    const html = card("111111", { title: "A" }) + malformed + card("333333", { title: "B" });
    const cards = parseJobCards(html, NOW);
    expect(cards.map((c) => c.id)).toEqual(["111111", "333333"]);
  });

  test("duplicate featured card is deduped by id", () => {
    const html = card("111111", { title: "Featured" }) + card("111111", { title: "Featured" });
    expect(parseJobCards(html, NOW)).toHaveLength(1);
  });

  test("empty html yields empty list", () => {
    expect(parseJobCards("", NOW)).toEqual([]);
  });
});

describe("relativeDateToISO", () => {
  test.each([
    ["Hoy", "2026-07-11"],
    ["Ayer", "2026-07-10"],
    ["Hace 2 d&#xED;as", "2026-07-09"],
    ["Hace 5 días", "2026-07-06"],
    ["Hace 1 semana", "2026-07-04"],
    ["Hace 1 mes", "2026-06-11"],
    ["Hace más de 1 mes", "2026-06-11"],
  ])("%s -> %s", (input, expected) => {
    expect(relativeDateToISO(input, NOW)).toBe(expected);
  });

  test("unrecognized text returns null", () => {
    expect(relativeDateToISO("garbage", NOW)).toBeNull();
  });
});

describe("slugify", () => {
  test.each([
    ["Desarrollador Fullstack", "desarrollador-fullstack"],
    ["Ciudad de México", "ciudad-de-mexico"],
    ["Nuevo León", "nuevo-leon"],
    ["consultor AWS / DevOps", "consultor-aws-devops"],
  ])("%s -> %s", (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });
});

describe("buildUrl", () => {
  test("query + location + jobage + page", () => {
    const url = buildUrl({
      query: "desarrollador react",
      location: "Guadalajara",
      jobage: 14,
      page: 2,
      format: "json",
    });
    expect(url).toBe("https://www.occ.com.mx/empleos/de-desarrollador-react/en-guadalajara/?tm=14&page=2");
  });

  test("query only, defaults", () => {
    const url = buildUrl({ query: "consultor aws", jobage: 9999, page: 1, format: "json" });
    expect(url).toBe("https://www.occ.com.mx/empleos/de-consultor-aws/");
  });
});

describe("decodeHtmlEntities / htmlToText", () => {
  test("decodes numeric and Spanish named entities", () => {
    expect(decodeHtmlEntities("M&#xE9;xico &ntilde; &oacute; &amp;")).toBe("México ñ ó &");
  });

  test("htmlToText preserves paragraphs and list items", () => {
    const text = htmlToText(
      "<p>Requisitos:</p><ul><li>3 a&ntilde;os de experiencia</li><li>React</li></ul>",
    );
    expect(text).toBe("Requisitos:\n\n- 3 años de experiencia\n- React");
  });
});

describe("parseJobDetail", () => {
  const LD = `<html><head><script type="application/ld+json">
{
  "@context": "https://schema.org/",
  "@type": "JobPosting",
  "Url": "http://www.occ.com.mx/empleo/oferta/21247400-desarrollador-fullstack",
  "Title": "Desarrollador fullstack",
  "Description": "\\u003Cp\\u003EBuscamos desarrollador con \\u003Cstrong\\u003EReact\\u003C/strong\\u003E y experiencia en dise\\u0026ntilde;o.\\u003C/p\\u003E",
  "identifier": { "@type": "PropertyValue", "Name": "SYE SOFTWARE S.A. DE C.V.", "Value": "21247400" },
  "DatePosted": "2026-07-10",
  "ValidThrough": "2026-09-08",
  "EmploymentType": "Tiempo completo",
  "HiringOrganization": { "@type": "Organization", "Name": "SYE SOFTWARE S.A. DE C.V." },
  "JobLocation": { "@type": "Place", "Address": { "@type": "PostalAddress", "AddressLocality": "", "AddressRegion": "Ciudad de México", "AddressCountry": "MX" } },
  "BaseSalary": { "@type": "MonetaryAmount", "Currency": "MXN", "Value": { "@type": "QuantitativeValue", "MinValue": 50000, "MaxValue": 52000, "UnitText": "MONTH" } }
};
</script></head><body></body></html>`;

  test("parses the JSON-LD block despite the trailing semicolon", () => {
    const job = parseJobDetail(LD, "21247400");
    expect(job).not.toBeNull();
    expect(job!.title).toBe("Desarrollador fullstack");
    expect(job!.company).toBe("SYE SOFTWARE S.A. DE C.V.");
    expect(job!.location).toBe("Ciudad de México");
    expect(job!.date).toBe("2026-07-10");
    expect(job!.employmentType).toBe("Tiempo completo");
    expect(job!.salaryMin).toBe(50000);
    expect(job!.salaryMax).toBe(52000);
    expect(job!.salaryCurrency).toBe("MXN");
    expect(job!.description).toBe("Buscamos desarrollador con React y experiencia en diseño.");
    expect(job!.url).toBe("https://www.occ.com.mx/empleo/oferta/21247400");
  });

  test("zero salary bounds become null", () => {
    const zeroed = LD.replace('"MinValue": 50000', '"MinValue": 0').replace(
      '"MaxValue": 52000',
      '"MaxValue": 0',
    );
    const job = parseJobDetail(zeroed, "21247400");
    expect(job!.salaryMin).toBeNull();
    expect(job!.salaryMax).toBeNull();
    expect(job!.salary).toBeNull();
  });

  test("returns null when no JobPosting JSON-LD exists", () => {
    expect(parseJobDetail("<html><body>nope</body></html>", "1")).toBeNull();
    expect(extractJobPostingLd("<script type=\"application/ld+json\">{bad json};</script>")).toBeNull();
  });
});

describe("parseTotalOffers", () => {
  test("reads data-total-offers", () => {
    expect(parseTotalOffers('<p data-total-offers="143" total-offers-count> 143 resultados</p>')).toBe(143);
    expect(parseTotalOffers("<p>none</p>")).toBeNull();
  });
});

describe("normalizeId", () => {
  test.each([
    ["21247400", "21247400"],
    ["https://www.occ.com.mx/empleo/oferta/21247400-desarrollador-fullstack?rank=1", "21247400"],
    ["https://www.occ.com.mx/empleo/oferta/21247400", "21247400"],
  ])("%s -> %s", (input, expected) => {
    expect(normalizeId(input)).toBe(expected);
  });

  test("garbage returns null", () => {
    expect(normalizeId("not-an-id")).toBeNull();
  });
});

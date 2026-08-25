import { describe, expect, test } from "bun:test";
import {
  ageDaysToISO,
  buildSearchUrl,
  normalizeId,
  parseJobCards,
  parseJobDetail,
  parseTotalCount,
  relativeDateToAgeDays,
  slugify,
} from "../src/helpers";

const NOW = new Date("2026-07-11T12:00:00Z");

function card(opts: {
  id: string;
  title: string;
  slug?: string;
  company?: string;
  companyLinked?: boolean;
  location?: string;
  salary?: string;
  date?: string;
}): string {
  const slug = opts.slug ?? "oferta-de-trabajo-de-x";
  const companyHtml = opts.company
    ? opts.companyLinked
      ? `<p class="dFlex vm_fx fs16 fc_base mt5">
          <span class="fx_none mr10"><span class="fwB">4.2</span><span class="star"></span></span>
          <a class="fc_base t_ellipsis" href="https://mx.computrabajo.com/x" offer-grid-article-company-url>${opts.company}</a>
        </p>`
      : `<p class="dFlex vm_fx fs16 fc_base mt5">${opts.company}</p>`
    : "";
  return `<article class="box_offer  " data-id='${opts.id}' id="${opts.id}">
    <h2 class="fs18 fwB prB">
      <a class="js-o-link fc_base" href="/ofertas-de-trabajo/${slug}-${opts.id}#lc=ListOffers-0">${opts.title}</a>
    </h2>
    ${companyHtml}
    ${opts.location ? `<p class="fs16 fc_base mt5"><span class="mr10">${opts.location}</span></p>` : ""}
    ${opts.salary ? `<div class="fs13 mt15"><span class="dIB mr10"><span class="icon i_salary"></span>${opts.salary}</span></div>` : ""}
    ${opts.date ? `<p class="fs13 fc_aux mt15">${opts.date}</p>` : ""}
  </article>`;
}

const ID_A = "3711D8CB3155475961373E686DCF3405";
const ID_B = "26CDCB0BCEE25F7661373E686DCF3405";

describe("slugify", () => {
  test("lowercases and hyphenates", () => {
    expect(slugify("Desarrollador Fullstack")).toBe("desarrollador-fullstack");
  });
  test("strips accents and ñ", () => {
    expect(slugify("diseñador gráfico")).toBe("disenador-grafico");
    expect(slugify("Ciudad de México")).toBe("ciudad-de-mexico");
  });
});

describe("buildSearchUrl", () => {
  test("query only, page 1 has no ?p=", () => {
    expect(buildSearchUrl("desarrollador fullstack", undefined, 1)).toBe(
      "https://mx.computrabajo.com/trabajo-de-desarrollador-fullstack"
    );
  });
  test("query + location + page", () => {
    expect(buildSearchUrl("desarrollador react", "Ciudad de México", 3)).toBe(
      "https://mx.computrabajo.com/trabajo-de-desarrollador-react-en-ciudad-de-mexico?p=3"
    );
  });
});

describe("relativeDateToAgeDays", () => {
  test("hours and minutes are age 0", () => {
    expect(relativeDateToAgeDays("Hace  6  horas")).toBe(0);
    expect(relativeDateToAgeDays("Hace 32 minutos")).toBe(0);
  });
  test("days (with accent, from entities)", () => {
    expect(relativeDateToAgeDays("Hace 2 días")).toBe(2);
  });
  test("ayer is 1", () => {
    expect(relativeDateToAgeDays("Ayer")).toBe(1);
  });
  test("more than 30 days is 31", () => {
    expect(relativeDateToAgeDays("Hace más de 30 días")).toBe(31);
  });
  test("detail-page suffix '(actualizada)' still parses", () => {
    expect(relativeDateToAgeDays("Hace 6 días (actualizada)")).toBe(6);
  });
  test("unknown text is null", () => {
    expect(relativeDateToAgeDays("mañana")).toBeNull();
    expect(relativeDateToAgeDays(null)).toBeNull();
  });
});

describe("ageDaysToISO", () => {
  test("computes an estimated date", () => {
    expect(ageDaysToISO(2, NOW)).toBe("2026-07-09");
    expect(ageDaysToISO(0, NOW)).toBe("2026-07-11");
  });
  test(">30 days has no reliable date", () => {
    expect(ageDaysToISO(31, NOW)).toBeNull();
    expect(ageDaysToISO(null, NOW)).toBeNull();
  });
});

describe("parseTotalCount", () => {
  test("reads the listing heading", () => {
    const html = `<h1 class="fs21 tc_m"> <span class="fwB"> 42 </span> Trabajos de desarrollador </h1>`;
    expect(parseTotalCount(html)).toBe(42);
  });
  test("null when absent", () => {
    expect(parseTotalCount("<p>nothing</p>")).toBeNull();
  });
});

describe("parseJobCards", () => {
  test("parses a full card (linked company, rating ignored)", () => {
    const html = card({
      id: ID_A,
      title: "Desarrollador",
      company: "Transportes Castores",
      companyLinked: true,
      location: "Le&#xF3;n, Guanajuato",
      salary: "$ 23,000.00 (Mensual)",
      date: "Hace  6  horas",
    });
    const [c] = parseJobCards(html, NOW);
    expect(c.id).toBe(ID_A);
    expect(c.title).toBe("Desarrollador");
    expect(c.company).toBe("Transportes Castores");
    expect(c.location).toBe("León, Guanajuato");
    expect(c.salary).toBe("$ 23,000.00 (Mensual)");
    expect(c.dateText).toBe("Hace 6 horas");
    expect(c.date).toBe("2026-07-11");
    expect(c.url).toBe(
      `https://mx.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-x-${ID_A}`
    );
  });

  test("plain-text company (no profile link)", () => {
    const html = card({
      id: ID_B,
      title: "Programador .NET",
      company: "Importante Firma del Sector",
      companyLinked: false,
      date: "Hace 3 d&#xED;as",
    });
    const [c] = parseJobCards(html, NOW);
    expect(c.company).toBe("Importante Firma del Sector");
    expect(c.location).toBeNull();
    expect(c.salary).toBeNull();
    expect(c.date).toBe("2026-07-08");
  });

  test("missing fields are null, never omitted", () => {
    const [c] = parseJobCards(card({ id: ID_A, title: "X" }), NOW);
    expect(c.company).toBeNull();
    expect(c.location).toBeNull();
    expect(c.salary).toBeNull();
    expect(c.date).toBeNull();
    expect(c.dateText).toBeNull();
  });

  test("one malformed card does not break the rest", () => {
    const html =
      `<article class="box_offer  " data-id='not-a-hex-id'><h2>broken</h2>` +
      card({ id: ID_B, title: "Good Job", date: "Ayer" });
    const cards = parseJobCards(html, NOW);
    expect(cards).toHaveLength(1);
    expect(cards[0].id).toBe(ID_B);
  });

  test("empty page yields empty array", () => {
    expect(parseJobCards("<html><body>No hay resultados</body></html>", NOW)).toEqual([]);
  });
});

describe("normalizeId", () => {
  test("bare hex ID", () => {
    expect(normalizeId(ID_A)).toBe(ID_A);
  });
  test("lowercase hex is uppercased", () => {
    expect(normalizeId(ID_A.toLowerCase())).toBe(ID_A);
  });
  test("full offer URL", () => {
    expect(
      normalizeId(
        `https://mx.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-desarrollador-en-leon-${ID_A}#lc=x`
      )
    ).toBe(ID_A);
  });
  test("garbage is null", () => {
    expect(normalizeId("12345")).toBeNull();
    expect(normalizeId("not-an-id")).toBeNull();
  });
});

describe("parseJobDetail", () => {
  const detailHtml = `
    <h1 class="fwB fs24 mb5 box_detail w100_m">Desarrollador - Fullstack</h1>
    <p class="fs16">Transportes Castores de Baja California S.A. de C.V. - Le&#xF3;n, Guanajuato</p>
    <div class="box_detail fl w100_m">
      <div class="mb40 pb40 bb1" div-link="oferta">
        <h3 class="fwB fs18 mb20">Descripción de la oferta</h3>
        <div class="mbB">
          <span class="tag base mb10">$ 23,000.00 (Mensual)</span>
          <span class="tag base mb10">Contrato por tiempo indeterminado</span>
          <span class="tag base mb10">Tiempo Completo</span>
        </div>
        <p class="mbB">Buscamos tu talento<br /><br />Conocimientos<br />- Node<br />- React</p>
        <p class="fwB fs18 mtB mb10">Requerimientos</p>
        <ul class="disc mbB">
          <li class='mb10'>Educaci&#xF3;n m&#xED;nima: Licenciatura</li>
          <li class='mb10'>1 a&#xF1;o de experiencia</li>
        </ul>
        <p class="fc_aux fs13 mbB mtB">Palabras clave: developer, programador</p>
        <p class="fc_aux fs13">Hace 6 d&#xED;as (actualizada)</p>
      </div>
    </div>`;

  test("parses all detail fields", () => {
    const d = parseJobDetail(detailHtml, ID_A, NOW);
    expect(d).not.toBeNull();
    expect(d!.title).toBe("Desarrollador - Fullstack");
    expect(d!.company).toBe("Transportes Castores de Baja California S.A. de C.V.");
    expect(d!.location).toBe("León, Guanajuato");
    expect(d!.salary).toBe("$ 23,000.00 (Mensual)");
    expect(d!.contractType).toBe("Contrato por tiempo indeterminado");
    expect(d!.schedule).toBe("Tiempo Completo");
    expect(d!.description).toContain("Buscamos tu talento");
    expect(d!.description).toContain("- React");
    expect(d!.requirements).toEqual([
      "Educación mínima: Licenciatura",
      "1 año de experiencia",
    ]);
    expect(d!.dateText).toBe("Hace 6 días (actualizada)");
    expect(d!.date).toBe("2026-07-05");
    expect(d!.url).toContain(ID_A);
  });

  test("returns null for a non-detail page (redirected listing)", () => {
    const listing = `<h1 class="fs21"> <span class="fwB"> 42 </span> resultados</h1>`;
    expect(parseJobDetail(listing, ID_A, NOW)).toBeNull();
  });
});

"use client";

import { dataDate, LORON_API } from "./format";
import {
  selaAsinatura,
  selaObs,
  selaOras,
  type LiuroProfesor,
  type Relatoriu,
} from "./relatoriu";

/**
 * The attendance book as a PDF — one page per teacher, laid out like the
 * printed "LISTA PREZENSA BA PROFESÓR/A ETI DILI" sheet it replaces.
 *
 * jsPDF is loaded on demand: it is far larger than the rest of the dashboard
 * and only an admin pressing Download ever needs it.
 */

const ESKOLA = {
  naran: "ESCOLA TÉCNICA DE INFORMÁTICA DILI",
  sigla: "(ETI-DÍLI)",
  moradaː: "Rua: Fomento II, Aldeia são José, Comoro, Dom Aleixoun, Díli-Timor-Leste.",
  kontaktu:
    "https://estvetidili.website.com/eti-tl   ·   estvetidili.tl@gmail.com   ·   +670 78118019 / 76377110",
} as const;

/** The seal, as a data URI so jsPDF can embed it without a network hop. */
async function selu(): Promise<string | null> {
  try {
    const r = await fetch("/icon.png");
    if (!r.ok) return null;
    const blob = await r.blob();
    return await new Promise<string>((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result));
      fr.onerror = () => reject(new Error("foto"));
      fr.readAsDataURL(blob);
    });
  } catch {
    // The sheet is still valid without the logo.
    return null;
  }
}

export async function exportaPdf(rel: Relatoriu, naranFile: string): Promise<void> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const largura = doc.internal.pageSize.getWidth();
  const logo = await selu();

  rel.liuro.forEach((pajina, i) => {
    if (i > 0) doc.addPage();
    kabesalyu(doc, largura, logo, pajina, rel.periodu);

    autoTable(doc, {
      startY: 46,
      margin: { left: 10, right: 10, bottom: 14 },
      theme: "grid",
      styles: {
        font: "helvetica",
        fontSize: 7.5,
        cellPadding: 1.4,
        lineColor: [60, 60, 60],
        lineWidth: 0.15,
        textColor: [20, 20, 20],
        valign: "middle",
      },
      headStyles: {
        fillColor: [245, 245, 245],
        textColor: [20, 20, 20],
        fontStyle: "bold",
        halign: "center",
        lineWidth: 0.2,
      },
      columnStyles: {
        0: { cellWidth: 11, halign: "center" },
        1: { cellWidth: 24 },
        2: { cellWidth: 15, halign: "center" },
        3: { cellWidth: 18, halign: "center" },
        4: { cellWidth: 15, halign: "center" },
        5: { cellWidth: 18, halign: "center" },
        6: { cellWidth: 15, halign: "center" },
        7: { cellWidth: 18, halign: "center" },
        8: { cellWidth: 15, halign: "center" },
        9: { cellWidth: 18, halign: "center" },
      },
      head: [
        [
          { content: "Data", rowSpan: 2 },
          { content: "Loron", rowSpan: 2 },
          { content: "Oras Dader Tama / Fila Dader", colSpan: 4 },
          { content: "Oras Tama / Fila Lorokraik", colSpan: 4 },
          { content: "Obs", rowSpan: 2 },
        ],
        [
          "08:00",
          "Asinatura",
          "12:00",
          "Asinatura",
          "13:30",
          "Asinatura",
          "17:30",
          "Asinatura",
        ],
      ],
      body: pajina.loron.map((r) => {
        const d = dataDate(r.data);
        const [dt, df, lt, lf] = selaOras(r);
        const [adt, adf, alt, alf] = selaAsinatura(r);
        return [
          String(d.getDate()),
          LORON_API[d.getDay()],
          dt,
          adt,
          df,
          adf,
          lt,
          alt,
          lf,
          alf,
          selaObs(r),
        ];
      }),
      didParseCell: (dadus) => {
        // Sundays never reach the sheet; Saturdays keep an empty afternoon.
        if (dadus.section === "body" && dadus.cell.text[0] === "—") {
          dadus.cell.styles.textColor = [140, 140, 140];
        }
      },
    });
  });

  rodape(doc);
  doc.save(naranFile);
}

function kabesalyu(
  doc: import("jspdf").jsPDF,
  largura: number,
  logo: string | null,
  pajina: LiuroProfesor,
  periodu: string,
) {
  if (logo) doc.addImage(logo, "PNG", 11, 8, 18, 18);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(ESKOLA.naran, largura / 2, 13, { align: "center" });
  doc.setFontSize(10);
  doc.text(ESKOLA.sigla, largura / 2, 18, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(ESKOLA.moradaː, largura / 2, 22.5, { align: "center" });
  doc.text(ESKOLA.kontaktu, largura / 2, 26, { align: "center" });

  doc.setLineWidth(0.5);
  doc.line(10, 28.5, largura - 10, 28.5);
  doc.setLineWidth(0.2);
  doc.line(10, 29.4, largura - 10, 29.4);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text(
    `LISTA PREZENSA BA PROFESÓR/A ETI DILI — ${periodu.toUpperCase()}`,
    largura / 2,
    34,
    { align: "center" },
  );

  doc.setFontSize(9);
  doc.text("Naran :", 11, 40);
  doc.text("Kargu :", 11, 44.5);
  doc.setFont("helvetica", "normal");
  doc.text(pajina.profesor.naran_kompletu, 26, 40);
  doc.text(pajina.profesor.kargu || "—", 26, 44.5);
}

function rodape(doc: import("jspdf").jsPDF) {
  const total = doc.getNumberOfPages();
  const largura = doc.internal.pageSize.getWidth();
  const altura = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`${i} | Page`, largura / 2, altura - 8, { align: "center" });
  }
}

/** `lista-prezensa-hotu-jullu-2026.pdf` */
export function naranFilePdf(periodu: string, who: string): string {
  const p = periodu.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `lista-prezensa-${who}-${p}.pdf`;
}

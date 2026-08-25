"use client";

import { ESKOLA, naranFile, selu, TITULU } from "./export-comun";
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
 * lib/export-excel.ts mirrors this page for page.
 *
 * jsPDF is loaded on demand: it is far larger than the rest of the dashboard
 * and only an admin pressing Download ever needs it.
 */

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
      // Clears the three-line header block, whose last line sits at y=49.
      startY: 52,
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
  doc.text(ESKOLA.morada, largura / 2, 22.5, { align: "center" });
  doc.text(ESKOLA.kontaktu, largura / 2, 26, { align: "center" });

  doc.setLineWidth(0.5);
  doc.line(10, 28.5, largura - 10, 28.5);
  doc.setLineWidth(0.2);
  doc.line(10, 29.4, largura - 10, 29.4);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text(`${TITULU} — ${periodu.toUpperCase()}`, largura / 2, 34, {
    align: "center",
  });

  doc.setFontSize(9);

  /*
   * Label, colon and value drawn as three columns rather than as one string,
   * so the colons line up under each other. "Disciplina" is half as long
   * again as "Naran", and a label glued to its own colon would have staggered
   * the three values across the page.
   */
  const LINHA: [string, string][] = [
    ["Naran", pajina.profesor.naran_kompletu],
    ["Kargu", pajina.profesor.kargu || "—"],
    ["Disciplina", pajina.profesor.disiplina_hanorin || "—"],
  ];

  LINHA.forEach(([rotulu, valor], i) => {
    const y = 40 + i * 4.5;
    doc.setFont("helvetica", "bold");
    doc.text(rotulu, 11, y);
    doc.text(":", 31, y);
    doc.setFont("helvetica", "normal");
    doc.text(valor, 34, y);
  });
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

/** `lista-prezensa-hotu-agostu-2026.pdf` */
export const naranFilePdf = (periodu: string, who: string) =>
  naranFile(periodu, who, "pdf");

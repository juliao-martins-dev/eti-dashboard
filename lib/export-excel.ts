"use client";

import { ESKOLA, naranFile, selu, TITULU } from "./export-comun";
import { dataDate, LORON_API } from "./format";
import { selaAsinatura, selaObs, selaOras, type Relatoriu } from "./relatoriu";

/**
 * The attendance book as a real .xlsx — one sheet per teacher, laid out page
 * for page like lib/export-pdf.ts: the school header block with the seal, the
 * rule, the title, Naran/Kargu, then the grouped grid.
 *
 * ExcelJS is loaded on demand; it is the heaviest thing the dashboard can
 * pull, and only a Download press needs it.
 */

/** The eleven columns of the printed grid. */
const KOLUMNA_TOTAL = 11;

/** Excel forbids : \ / ? * [ ] in sheet names and caps them at 31 characters. */
function naranSheet(naran: string, uzadu: Set<string>): string {
  const limpu = naran.replace(/[:\\/?*[\]]/g, " ").trim().slice(0, 28) || "Profesor";
  let foun = limpu;
  let n = 2;
  while (uzadu.has(foun.toLowerCase())) foun = `${limpu.slice(0, 26)} ${n++}`;
  uzadu.add(foun.toLowerCase());
  return foun;
}

const KAIXA = {
  top: { style: "thin" as const },
  left: { style: "thin" as const },
  bottom: { style: "thin" as const },
  right: { style: "thin" as const },
};

export async function exportaExcel(rel: Relatoriu, ficheiru: string): Promise<void> {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "ETI PREZENSA";
  wb.created = new Date();

  // Registered once and referenced from every sheet, so the file carries a
  // single copy of the seal rather than one per teacher.
  const logo = await selu();
  const logoId =
    logo !== null
      ? wb.addImage({ base64: logo, extension: "png" })
      : null;

  const uzadu = new Set<string>();

  for (const pajina of rel.liuro) {
    const ws = wb.addWorksheet(naranSheet(pajina.profesor.naran_kompletu, uzadu));

    // Printing it should give back the PDF.
    ws.pageSetup = {
      paperSize: 9, // A4
      orientation: "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: {
        left: 0.4,
        right: 0.4,
        top: 0.4,
        bottom: 0.5,
        header: 0.2,
        footer: 0.2,
      },
    };
    ws.headerFooter = { oddFooter: "&C&P | Page" };

    const fundu = (linha: number) => `A${linha}:${String.fromCharCode(64 + KOLUMNA_TOTAL)}${linha}`;
    const sentradu = (linha: number, texto: string, size: number, bold: boolean) => {
      ws.mergeCells(fundu(linha));
      const c = ws.getCell(`A${linha}`);
      c.value = texto;
      c.font = { bold, size };
      c.alignment = { horizontal: "center", vertical: "middle" };
      return c;
    };

    /* ── Header block, same order as the PDF ──────────────────────────── */
    sentradu(1, ESKOLA.naran, 12, true);
    sentradu(2, ESKOLA.sigla, 10, true);
    sentradu(3, ESKOLA.morada, 8, false);
    // The PDF closes the block with a double rule; a double bottom border is
    // the same mark in a spreadsheet.
    sentradu(4, ESKOLA.kontaktu, 8, false).border = { bottom: { style: "double" } };
    sentradu(5, `${TITULU} — ${rel.periodu.toUpperCase()}`, 10, true);

    ws.getRow(1).height = 18;
    ws.getRow(5).height = 20;

    if (logoId !== null) {
      ws.addImage(logoId, {
        tl: { col: 0.15, row: 0.15 },
        ext: { width: 52, height: 52 },
        editAs: "oneCell",
      });
    }

    /* ── Naran / Kargu / Disciplina ────────────────────────────────────────────────── */
    // Written by address rather than addRow, so the spacer and the grid below
    // still append after whatever the last of these rows turns out to be.
    const KABESALLU: [string, string, string][] = [
      ["A6", "Naran :", pajina.profesor.naran_kompletu],
      ["A7", "Kargu :", pajina.profesor.kargu || "—"],
      ["A8", "Disciplina :", pajina.profesor.disiplina_hanorin || "—"],
    ];

    for (const [sela, rotulu, valor] of KABESALLU) {
      const linha = sela.slice(1);
      // Label across A:B, not A alone: column A is 7 wide because the grid
      // below it holds "Data", and "Disciplina :" would have been clipped by
      // the value sitting in the next cell.
      ws.mergeCells(`A${linha}:B${linha}`);
      ws.getCell(sela).value = rotulu;
      ws.getCell(sela).font = { bold: true };
      // C:F, because a discipline runs well past a single column.
      ws.mergeCells(`C${linha}:F${linha}`);
      ws.getCell(`C${linha}`).value = valor;
    }

    ws.addRow([]);

    /* ── Two-row grouped header ───────────────────────────────────────── */
    const h1 = ws.addRow([
      "Data",
      "Loron",
      "Oras Dader Tama / Fila Dader",
      "",
      "",
      "",
      "Oras Tama / Fila Lorokraik",
      "",
      "",
      "",
      "Obs",
    ]);
    const h2 = ws.addRow([
      "",
      "",
      "08:00",
      "Asinatura",
      "12:00",
      "Asinatura",
      "13:30",
      "Asinatura",
      "17:30",
      "Asinatura",
      "",
    ]);
    ws.mergeCells(h1.number, 1, h2.number, 1);
    ws.mergeCells(h1.number, 2, h2.number, 2);
    ws.mergeCells(h1.number, 3, h1.number, 6);
    ws.mergeCells(h1.number, 7, h1.number, 10);
    ws.mergeCells(h1.number, 11, h2.number, 11);

    for (const linha of [h1, h2]) {
      linha.font = { bold: true, size: 9 };
      linha.alignment = { horizontal: "center", vertical: "middle" };
      linha.eachCell({ includeEmpty: true }, (c) => {
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F5F5" } };
        c.border = KAIXA;
      });
    }
    // The header repeats when the sheet spills onto a second printed page.
    ws.views = [{ state: "frozen", ySplit: h2.number }];
    ws.pageSetup.printTitlesRow = `${h1.number}:${h2.number}`;

    /* ── One row per working day ──────────────────────────────────────── */
    for (const r of pajina.loron) {
      const d = dataDate(r.data);
      const [dt, df, lt, lf] = selaOras(r);
      const [adt, adf, alt, alf] = selaAsinatura(r);
      const linha = ws.addRow([
        d.getDate(),
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
      ]);
      linha.font = { size: 9 };
      linha.eachCell({ includeEmpty: true }, (c, i) => {
        c.border = KAIXA;
        // Only Loron and Obs read as prose; everything else is a time.
        if (i !== 2 && i !== KOLUMNA_TOTAL) {
          c.alignment = { horizontal: "center", vertical: "middle" };
        }
        if (c.value === "—") c.font = { size: 9, color: { argb: "FF8C8C8C" } };
      });
    }

    ws.getColumn(1).width = 7;
    ws.getColumn(2).width = 17;
    for (let i = 3; i <= 10; i++) ws.getColumn(i).width = 11;
    ws.getColumn(KOLUMNA_TOTAL).width = 26;
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = ficheiru;
  a.click();
  URL.revokeObjectURL(url);
}

/** `lista-prezensa-hotu-agostu-2026.xlsx` */
export const naranFileExcel = (periodu: string, who: string) =>
  naranFile(periodu, who, "xlsx");

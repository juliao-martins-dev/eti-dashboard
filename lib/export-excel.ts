"use client";

import { dataDate, LORON_API } from "./format";
import { selaAsinatura, selaObs, selaOras, type Relatoriu } from "./relatoriu";

/**
 * The same report as a real .xlsx: a "Rezumu" sheet with the totals shown on
 * screen, and one sheet per teacher laid out like the printed book.
 *
 * ExcelJS is loaded on demand — it is the heaviest thing the dashboard can
 * pull, and only a Download press needs it.
 */

/** Excel forbids : \ / ? * [ ] in sheet names and caps them at 31 characters. */
function naranSheet(naran: string, uzadu: Set<string>): string {
  const limpu = naran.replace(/[:\\/?*[\]]/g, " ").trim().slice(0, 28) || "Profesor";
  let foun = limpu;
  let n = 2;
  while (uzadu.has(foun.toLowerCase())) foun = `${limpu.slice(0, 26)} ${n++}`;
  uzadu.add(foun.toLowerCase());
  return foun;
}

export async function exportaExcel(rel: Relatoriu, naranFile: string): Promise<void> {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "ETI PRESENSA";
  wb.created = new Date();

  /* ── Rezumu ─────────────────────────────────────────────────────────── */
  const rezumu = wb.addWorksheet("Rezumu");
  rezumu.mergeCells("A1:I1");
  rezumu.getCell("A1").value = `LISTA PREZENSA BA PROFESÓR/A ETI DILI — ${rel.periodu}`;
  rezumu.getCell("A1").font = { bold: true, size: 12 };
  rezumu.getCell("A1").alignment = { horizontal: "center" };

  rezumu.addRow([]);
  const kabesalyu = rezumu.addRow([
    "Profesór",
    "Numeru ID",
    "Kargu",
    "Loron servisu",
    "Prezente",
    "Atrazadu",
    "Falta",
    "Lisensa",
    "Misaun",
    "%",
  ]);
  kabesalyu.font = { bold: true };
  kabesalyu.alignment = { horizontal: "center" };
  kabesalyu.eachCell((c) => {
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F0F0" } };
    c.border = { bottom: { style: "thin" } };
  });

  for (const a of rel.rezumu) {
    rezumu.addRow([
      a.profesor.naran_kompletu,
      a.profesor.numeru_id,
      a.profesor.kargu || "",
      a.serv,
      a.prez,
      a.atraz,
      a.falta,
      a.lis,
      a.mis,
      a.pct / 100,
    ]);
  }
  rezumu.getColumn(10).numFmt = "0%";
  rezumu.columns.forEach((c, i) => {
    c.width = i === 0 ? 30 : i === 2 ? 26 : 13;
  });

  /* ── One sheet per teacher, in the paper layout ─────────────────────── */
  const uzadu = new Set<string>();
  for (const pajina of rel.liuro) {
    const ws = wb.addWorksheet(naranSheet(pajina.profesor.naran_kompletu, uzadu));

    ws.mergeCells("A1:K1");
    ws.getCell("A1").value = `LISTA PREZENSA BA PROFESÓR/A ETI DILI — ${rel.periodu}`;
    ws.getCell("A1").font = { bold: true, size: 11 };
    ws.getCell("A1").alignment = { horizontal: "center" };

    ws.getCell("A2").value = "Naran :";
    ws.getCell("B2").value = pajina.profesor.naran_kompletu;
    ws.getCell("A3").value = "Kargu :";
    ws.getCell("B3").value = pajina.profesor.kargu || "—";
    ws.getCell("A2").font = { bold: true };
    ws.getCell("A3").font = { bold: true };

    ws.addRow([]);
    // Two header rows, mirroring the grouped columns on the printed sheet.
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
      linha.font = { bold: true };
      linha.alignment = { horizontal: "center", vertical: "middle" };
      linha.eachCell((c) => {
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F0F0" } };
        c.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    }

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
      linha.eachCell((c, i) => {
        c.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        if (i !== 2 && i !== 11) c.alignment = { horizontal: "center" };
      });
    }

    ws.getColumn(1).width = 7;
    ws.getColumn(2).width = 16;
    for (let i = 3; i <= 10; i++) ws.getColumn(i).width = 12;
    ws.getColumn(11).width = 30;
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = naranFile;
  a.click();
  URL.revokeObjectURL(url);
}

/** `lista-prezensa-hotu-jullu-2026.xlsx` */
export function naranFileExcel(periodu: string, who: string): string {
  const p = periodu.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `lista-prezensa-${who}-${p}.xlsx`;
}

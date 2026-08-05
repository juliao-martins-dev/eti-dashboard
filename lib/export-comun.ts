"use client";

/** Shared between the PDF and the Excel export, so both sheets say the same thing. */

export const ESKOLA = {
  naran: "ESCOLA TÉCNICA DE INFORMÁTICA DILI",
  sigla: "(ETI-DÍLI)",
  morada: "Rua: Fomento II, Aldeia são José, Comoro, Dom Aleixoun, Díli-Timor-Leste.",
  kontaktu:
    "https://estvetidili.website.com/eti-tl   ·   estvetidili.tl@gmail.com   ·   +670 78118019 / 76377110",
} as const;

export const TITULU = "LISTA PREZENSA BA PROFESÓR/A ETI DILI";

/**
 * What goes in the Asinatura column when a punch carries its photo and GPS.
 *
 * Deliberately plain ASCII: jsPDF's built-in Helvetica is WinAnsi-encoded and
 * has no U+2713, so a "✓" came out as a stray apostrophe in the generated
 * sheets. Embedding a Unicode font to win back one glyph would cost more than
 * the glyph is worth.
 */
export const MARKA_ASINATURA = "OK";

/** Enough for the ~18 mm the seal occupies on the sheet, at well over 200 dpi. */
const SELU_PX = 192;

let seluCache: string | null | undefined;

/**
 * The seal as a data URI, so neither exporter needs a network hop mid-render.
 *
 * Redrawn small first: public/icon.png is a 1024px master weighing about a
 * megabyte, and embedding it raw made every export a megabyte of logo for a
 * stamp under 2 cm wide — a real cost over the school's network.
 */
export async function selu(): Promise<string | null> {
  if (seluCache !== undefined) return seluCache;

  try {
    const r = await fetch("/icon.png");
    if (!r.ok) return (seluCache = null);
    const blob = await r.blob();

    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement("canvas");
    canvas.width = SELU_PX;
    canvas.height = SELU_PX;
    const ctx = canvas.getContext("2d");
    if (!ctx) return (seluCache = null);
    ctx.drawImage(bitmap, 0, 0, SELU_PX, SELU_PX);
    bitmap.close();

    return (seluCache = canvas.toDataURL("image/png"));
  } catch {
    // The sheet is still valid without the logo.
    return (seluCache = null);
  }
}

/** `lista-prezensa-hotu-agostu-2026` */
export function naranFile(periodu: string, who: string, ext: string): string {
  const p = periodu
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `lista-prezensa-${who}-${p}.${ext}`;
}

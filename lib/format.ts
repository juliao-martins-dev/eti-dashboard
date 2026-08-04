import type { Data, Kolumna, Oras } from "./types";

/** `fulan_display` as eti-api spells it (`attendance.Fulan`), 1-indexed. */
export const FULAN_NARAN = [
  "",
  "Janeiru",
  "Fevereiru",
  "Marsu",
  "Abril",
  "Maiu",
  "Juñu",
  "Jullu",
  "Agostu",
  "Setembru",
  "Outubru",
  "Novembru",
  "Dezembru",
] as const;

/**
 * Weekday as the dashboard prints it, indexed by `Date.getDay()`.
 * The API's `loron` carries the longer spellings of the paper sheet
 * ("Tersa-feira"); the screens show the short form the design asks for.
 */
export const LORON_KURTU = [
  "Domingu",
  "Segunda",
  "Tersa",
  "Kuarta",
  "Kinta",
  "Sesta",
  "Sábadu",
] as const;

/** `Prezensa.loron` exactly as the API sends it, indexed by `Date.getDay()`. */
export const LORON_API = [
  "Domingu",
  "Segunda-feira",
  "Tersa-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sabado",
] as const;

/** The scheduled times printed in the column headers (`attendance.Prezensa`). */
export const ORARIU: Record<Kolumna, Oras> = {
  ORAS_DADER_TAMA: "08:00:00",
  ORAS_DADER_FILA: "12:00:00",
  ORAS_LOROKRAIK_TAMA: "13:30:00",
  ORAS_LOROKRAIK_FILA: "17:30:00",
};

/** The four grid columns, in the order the paper sheet prints them. */
export const KOLUMNA_LISTA = [
  { kolumna: "ORAS_DADER_TAMA", label: "Dader Tama" },
  { kolumna: "ORAS_DADER_FILA", label: "Dader Fila" },
  { kolumna: "ORAS_LOROKRAIK_TAMA", label: "Lorokraik Tama" },
  { kolumna: "ORAS_LOROKRAIK_FILA", label: "Lorokraik Fila" },
] as const satisfies readonly { kolumna: Kolumna; label: string }[];

/** Only the afternoon columns lose their session on a Saturday. */
export const lorokraik = (k: Kolumna) => k.startsWith("ORAS_LOROKRAIK");

export const pad = (n: number): string => String(n).padStart(2, "0");

/** A `Date` as the API writes a date. */
export const iso = (d: Date): Data =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/**
 * Parse `YYYY-MM-DD` into a local `Date`. `new Date('2026-08-04')` would read
 * it as UTC midnight and land on the previous day west of Greenwich.
 */
export const dataDate = (data: Data): Date => {
  const [tinan, fulan, loron] = data.split("-").map(Number);
  return new Date(tinan, fulan - 1, loron);
};

/** `HH:MM:SS` from the API to the `HH:MM` printed on the sheet. */
export const oras = (o: Oras): string => o.slice(0, 5);

/** "04 Agostu" — the way a day is labelled in the tables. */
export const dataNaran = (data: Data): string => {
  const d = dataDate(data);
  return `${pad(d.getDate())} ${FULAN_NARAN[d.getMonth() + 1]}`;
};

/** "Tersa · 04 Agostu 2026" — the topbar's date line. */
export const dataKompletu = (data: Data): string => {
  const d = dataDate(data);
  return `${LORON_KURTU[d.getDay()]} · ${dataNaran(data)} ${d.getFullYear()}`;
};

/** `attendance.semana_husi` — which week of its own month a date falls in. */
export const semanaHusi = (d: Date): number => {
  const inisiuFulan = (new Date(d.getFullYear(), d.getMonth(), 1).getDay() + 6) % 7;
  return Math.floor((d.getDate() + inisiuFulan - 1) / 7) + 1;
};

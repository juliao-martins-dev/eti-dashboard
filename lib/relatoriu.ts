"use client";

import { useCallback, useEffect, useState } from "react";
import { api, mensajenErru, type Rekursu } from "./api";
import { MARKA_ASINATURA } from "./export-comun";
import { dataDate, FULAN_NARAN, markaBa, oras } from "./format";
import { hotuQuery, type Filtru } from "./periodu";
import type { HotuResposta, PrezensaProfesorLoron, Profesor } from "./types";

/** One teacher's totals over the chosen period. */
export interface RezumuProfesor {
  profesor: Profesor;
  serv: number;
  prez: number;
  atraz: number;
  falta: number;
  lis: number;
  mis: number;
  pct: number;
}

/** One teacher's sheet, in the order the paper book prints it. */
export interface LiuroProfesor {
  profesor: Profesor;
  loron: PrezensaProfesorLoron[];
}

export interface Relatoriu {
  /** Every row the period returned, teacher-major then date-ascending. */
  linha: PrezensaProfesorLoron[];
  rezumu: RezumuProfesor[];
  /** One entry per teacher — a page of the printed book each. */
  liuro: LiuroProfesor[];
  /** "Jullu 2026", "Semana 2 · Jullu 2026", "Tinan 2026". */
  periodu: string;
}

export function periodoNaran(f: Filtru): string {
  if (f.per === "tinan") return `Tinan ${f.tinan}`;
  const fulan = `${FULAN_NARAN[f.fulan]} ${f.tinan}`;
  return f.per === "semana" ? `Semana ${f.semana} · ${fulan}` : fulan;
}

function agrega(linha: PrezensaProfesorLoron[]): {
  rezumu: RezumuProfesor[];
  liuro: LiuroProfesor[];
} {
  const rezumu = new Map<number, RezumuProfesor>();
  const liuro = new Map<number, LiuroProfesor>();

  for (const item of linha) {
    const { profesor, prezensa } = item;

    let l = liuro.get(profesor.id);
    if (!l) {
      l = { profesor, loron: [] };
      liuro.set(profesor.id, l);
    }
    l.loron.push(item);

    let a = rezumu.get(profesor.id);
    if (!a) {
      a = { profesor, serv: 0, prez: 0, atraz: 0, falta: 0, lis: 0, mis: 0, pct: 0 };
      rezumu.set(profesor.id, a);
    }
    // Every working day the API returned counts as a day of service, marked
    // or not — an empty day is still a day the teacher owed.
    a.serv++;
    if (!prezensa) continue;

    if (prezensa.status === "PRESENT") {
      a.prez++;
      // A day counts as late if either arrival was.
      if (
        markaBa(prezensa, "ORAS_DADER_TAMA")?.atrazadu ||
        markaBa(prezensa, "ORAS_LOROKRAIK_TAMA")?.atrazadu
      ) {
        a.atraz++;
      }
    } else if (prezensa.status === "ABSENT") a.falta++;
    else if (prezensa.status === "LEAVE") a.lis++;
    else if (prezensa.status === "MISSION") a.mis++;
  }

  for (const a of rezumu.values()) {
    a.pct = a.serv ? Math.round((a.prez / a.serv) * 100) : 0;
  }

  for (const l of liuro.values()) {
    l.loron.sort((x, y) => x.data.localeCompare(y.data));
  }

  return { rezumu: [...rezumu.values()], liuro: [...liuro.values()] };
}

async function buka(f: Filtru): Promise<Relatoriu> {
  let linha: PrezensaProfesorLoron[];

  if (f.per === "tinan") {
    // `hotu` has no year mode, so the twelve months are fetched together and
    // merged. Requested in parallel because a school year sequentially would
    // be twelve round trips of waiting.
    const fulan = Array.from({ length: 12 }, (_, i) => i + 1);
    const partes = await Promise.all(
      fulan.map((m) => api<HotuResposta>(`/prezensa/hotu/${hotuQuery(f, true, m)}`)),
    );
    linha = partes.flatMap((p) => p.profesor);
  } else {
    const r = await api<HotuResposta>(`/prezensa/hotu/${hotuQuery(f)}`);
    linha = r.profesor;
  }

  return { linha, ...agrega(linha), periodu: periodoNaran(f) };
}

/**
 * The single source for the Relatóriu screen and both exports, so the numbers
 * on the page and in the files can never disagree.
 */
export function useRelatoriu(f: Filtru): Rekursu<Relatoriu> {
  const kunut = JSON.stringify([f.who, f.per, f.fulan, f.tinan, f.semana]);
  const [versaun, setVersaun] = useState(0);
  const [estadu, setEstadu] = useState<{
    kunut: string;
    dadus: Relatoriu | null;
    erru: string | null;
  }>({ kunut: "", dadus: null, erru: null });

  useEffect(() => {
    let vivu = true;
    buka(f)
      .then((d) => {
        if (vivu) setEstadu({ kunut, dadus: d, erru: null });
      })
      .catch((e: unknown) => {
        if (vivu) setEstadu({ kunut, dadus: null, erru: mensajenErru(e) });
      });
    return () => {
      vivu = false;
    };
    // `f` is a fresh object each render; `kunut` is its identity.
  }, [kunut, versaun]); // eslint-disable-line react-hooks/exhaustive-deps

  const fresku = estadu.kunut === kunut;
  return {
    dadus: fresku ? estadu.dadus : null,
    erru: fresku ? estadu.erru : null,
    karega: !fresku || (!estadu.dadus && !estadu.erru),
    refaz: useCallback(() => setVersaun((v) => v + 1), []),
  };
}

/**
 * Whether an administrator refused this day's evidence.
 *
 * The punches are still on the record — the server never deletes them — but
 * a refused day did not happen as far as the sheet is concerned, so the
 * printed columns below treat it as empty.
 */
export const rejeitadu = (r: PrezensaProfesorLoron): boolean =>
  !!r.prezensa?.rejeisaun_motivu;

/** What the OBS column says on a day the administration refused. */
export const OBS_REJEITADU = "Rejeita husi Administradór";

/** The four grid columns as the paper sheet prints them, "—" when empty. */
export function selaOras(
  r: PrezensaProfesorLoron,
): [string, string, string, string] {
  // A rejected day prints no times. Leaving them would have the sheet assert
  // an arrival the administration has formally refused.
  if (rejeitadu(r)) return ["", "", "", ""];
  const p = r.prezensa;
  const sabadu = dataDate(r.data).getDay() === 6;
  const sela = (v: string | null, lorokraik: boolean): string => {
    // Saturday has no afternoon session on the printed sheet either.
    if (lorokraik && sabadu) return "—";
    return v ? oras(v) : "";
  };
  return [
    sela(p?.oras_dader_tama ?? null, false),
    sela(p?.oras_dader_fila ?? null, false),
    sela(p?.oras_lorokraik_tama ?? null, true),
    sela(p?.oras_lorokraik_fila ?? null, true),
  ];
}

/**
 * The Asinatura column. On paper the teacher signed here; the digital record
 * replaces that with the photo and GPS captured at the punch, so a tick means
 * that evidence exists.
 */
export function selaAsinatura(
  r: PrezensaProfesorLoron,
): [string, string, string, string] {
  // Blank for the same reason as the times: a tick here means "the evidence
  // for this punch stands", which is exactly what a rejection withdraws.
  if (rejeitadu(r)) return ["", "", "", ""];
  const p = r.prezensa;
  const m = MARKA_ASINATURA;
  return [
    markaBa(p, "ORAS_DADER_TAMA") ? m : "",
    markaBa(p, "ORAS_DADER_FILA") ? m : "",
    markaBa(p, "ORAS_LOROKRAIK_TAMA") ? m : "",
    markaBa(p, "ORAS_LOROKRAIK_FILA") ? m : "",
  ];
}

/** The OBS column: the hand-written reason, or the status when it is not PRESENT. */
export function selaObs(r: PrezensaProfesorLoron): string {
  const p = r.prezensa;
  if (!p) return "";
  // Ahead of the status check: a rejected day is ABSENT like a hand-written
  // absence, and the sheet has to say which of the two this was.
  if (rejeitadu(r)) {
    const nota = p.rejeisaun_obs?.trim();
    return nota
      ? `${OBS_REJEITADU} — ${nota}`
      : OBS_REJEITADU;
  }
  if (p.status === "PRESENT") return p.obs ?? "";
  // `status_display`, not `status`: the exported sheet is a Tetun document,
  // and the stored value is English.
  const naran = p.status_display ?? p.status;
  return p.obs ? `${naran} — ${p.obs}` : naran;
}

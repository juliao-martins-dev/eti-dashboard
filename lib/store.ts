"use client";

import { useSyncExternalStore } from "react";
import { dataDate, iso } from "./format";
import {
  kriaPrezensaEstadu,
  PROFESOR_HOTU,
  profesorKurtu,
  REJISTU_HOTU,
} from "./mock-data";
import type { Data, Estadu, PrezensaProfesor, Sexu, User } from "./types";

/**
 * The client-side stand-in for the API, shared by every route so a teacher
 * added on Profesór shows up in the Prezensa filter and a lisensa registered
 * on Prezensa is still there on Relatóriu — the way the prototype's shared
 * `T` and `REC` behaved.
 *
 * It is a module store read through useSyncExternalStore rather than a
 * context: the saved data lives in localStorage, which the server cannot see,
 * and that is exactly the server/client snapshot split this hook exists for.
 */

export const DADUS_KEY = "eti.dadus";

export interface LisensaFoun {
  profesor_id: number;
  estadu: Estadu;
  husi: Data;
  toO: Data;
  obs: string;
}

export interface ProfesorFoun {
  naran_kompletu: string;
  numeru_id: number;
  email: string;
  kargu: string;
  nu_kontaktu: string;
  sexu: Sexu;
  is_active?: boolean;
}

export interface Dadus {
  profesor: User[];
  rejistu: PrezensaProfesor[];
}

/** `${profesor_id}|${data}` -> the day as written by hand, or null if removed. */
type Override = Record<string, PrezensaProfesor | null>;

interface Rai {
  profesor: User[];
  override: Override;
}

export const kunut = (profesorId: number, data: Data) => `${profesorId}|${data}`;

const SEED: Dadus = { profesor: PROFESOR_HOTU, rejistu: REJISTU_HOTU };

let profesor: User[] = PROFESOR_HOTU;
let override: Override = {};
let snapshot: Dadus = SEED;
let adotadu = false;
let listeners: Array<() => void> = [];

/**
 * Only the differences are persisted, never the 238 generated rows: a day the
 * administration touched, plus the teacher list. Everything else is rebuilt
 * from the seed, so regenerating the mock does not leave stale copies behind.
 */
function konstrui(): Dadus {
  const tokadu = new Set(Object.keys(override));
  const base = REJISTU_HOTU.filter(
    (r) => !r.prezensa || !tokadu.has(kunut(r.profesor.id, r.prezensa.data)),
  );
  const foun = Object.values(override).filter(
    (r): r is PrezensaProfesor => r !== null,
  );
  return { profesor, rejistu: [...base, ...foun] };
}

function rai() {
  try {
    const dadus: Rai = { profesor, override };
    localStorage.setItem(DADUS_KEY, JSON.stringify(dadus));
  } catch {
    // Private mode or a full quota; the session still works, it just forgets.
  }
}

function karega(): Dadus {
  try {
    const raw = localStorage.getItem(DADUS_KEY);
    if (raw) {
      const dadus = JSON.parse(raw) as Rai;
      if (Array.isArray(dadus.profesor)) profesor = dadus.profesor;
      if (dadus.override && typeof dadus.override === "object") {
        override = dadus.override;
      }
    }
  } catch {
    // Corrupt or unavailable — fall through to the seed rather than break.
  }
  return konstrui();
}

function subscribe(l: () => void) {
  listeners = [...listeners, l];
  return () => {
    listeners = listeners.filter((x) => x !== l);
  };
}

function getSnapshot(): Dadus {
  if (!adotadu) {
    adotadu = true;
    snapshot = karega();
  }
  return snapshot;
}

/** The server has no localStorage, so it renders the seed and the hook
 *  re-renders once hydration is done. */
const getServerSnapshot = (): Dadus => SEED;

function publika() {
  snapshot = konstrui();
  rai();
  for (const l of listeners) l();
}

export function useDadus(): Dadus {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function aumentaProfesor(dadus: ProfesorFoun) {
  getSnapshot();
  // Max + 1, not length + 1: a deleted teacher would otherwise hand out an id
  // that is already taken.
  const id = profesor.reduce((m, p) => Math.max(m, p.id), 0) + 1;
  profesor = [
    ...profesor,
    {
      ...dadus,
      id,
      foto: null,
      role: "PROFESSOR",
      role_display: "Professór",
      is_active: dadus.is_active ?? true,
    },
  ];
  publika();
}

export function atualizaProfesor(id: number, dadus: Partial<ProfesorFoun>) {
  getSnapshot();
  profesor = profesor.map((p) => (p.id === id ? { ...p, ...dadus } : p));
  publika();
}

export function rejistuLisensa(lisensa: LisensaFoun) {
  getSnapshot();
  const dona = profesor.find((p) => p.id === lisensa.profesor_id);
  if (!dona) return;

  const foun: Override = { ...override };
  for (
    let d = dataDate(lisensa.husi);
    iso(d) <= lisensa.toO;
    d.setDate(d.getDate() + 1)
  ) {
    // Sunday is not a day on the sheet.
    if (d.getDay() === 0) continue;
    const data = iso(d);
    foun[kunut(dona.id, data)] = {
      profesor: profesorKurtu(dona),
      prezensa: kriaPrezensaEstadu(dona, data, lisensa.estadu, lisensa.obs),
      marka_ona: false,
    };
  }
  override = foun;
  publika();
}

/**
 * Drop a day the administration wrote by hand; it goes back to having no
 * record at all. The punches it replaced are not restored — they were never
 * kept, which is also what the prototype did when a lisensa overwrote a day.
 */
export function hasaiPrezensa(profesorId: number, data: Data) {
  getSnapshot();
  override = { ...override, [kunut(profesorId, data)]: null };
  publika();
}

export function hamoosDadus() {
  adotadu = true;
  profesor = PROFESOR_HOTU;
  override = {};
  try {
    localStorage.removeItem(DADUS_KEY);
  } catch {
    // Nothing to clear if storage was never available.
  }
  publika();
}

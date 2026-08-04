import { dataDate, semanaHusi } from "./format";
import { TINAN } from "./mock-data";
import type { Data, Prezensa, PrezensaProfesor } from "./types";

export type Periodu = "loron" | "semana" | "fulan";

/** What the toolbar above Prezensa and Relatóriu is currently asking for. */
export interface Filtru {
  who: "hotu" | number;
  per: Periodu;
  loron: Data;
  fulan: number;
  semana: number;
}

/** The months the mock covers; a real build would read these off the sheets. */
export const FULAN_LISTA = [7, 8] as const;

export const SEMANA_LISTA = [1, 2, 3, 4, 5] as const;

/** A report line that is known to have a day attached. */
export interface RejistuLoron extends PrezensaProfesor {
  prezensa: Prezensa;
}

export function filtraPeriodu(
  rejistu: PrezensaProfesor[],
  f: Filtru,
): RejistuLoron[] {
  return rejistu.filter((r): r is RejistuLoron => {
    if (!r.prezensa) return false;
    if (f.who !== "hotu" && r.profesor.id !== f.who) return false;
    if (f.per === "loron") return r.prezensa.data === f.loron;

    const d = dataDate(r.prezensa.data);
    if (d.getMonth() + 1 !== f.fulan || d.getFullYear() !== TINAN) return false;
    if (f.per === "semana") return semanaHusi(d) === f.semana;
    return true;
  });
}

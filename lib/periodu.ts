import { query } from "./api";
import type { Data } from "./types";

export type Periodu = "loron" | "semana" | "fulan" | "tinan";

/** What the toolbar above Prezensa and Relatóriu is currently asking for. */
export interface Filtru {
  who: "hotu" | number;
  per: Periodu;
  loron: Data;
  fulan: number;
  tinan: number;
  semana: number;
}

/** `semana_husi` can reach 6 when a long month starts late in the week. */
export const SEMANA_LISTA = [1, 2, 3, 4, 5, 6] as const;

export const FULAN_LISTA = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

/** The sheets only go back as far as the system has been running. */
export function tinanLista(agora: number): number[] {
  return Array.from({ length: 5 }, (_, i) => agora - i);
}

/**
 * The query string for `GET /api/prezensa/hotu/`. `data` and the
 * fulan/tinan/semana trio are mutually exclusive server-side — `data` wins —
 * so only one of them is ever sent.
 *
 * `tinan` mode has no server equivalent; callers fetch the twelve months and
 * merge, so this builds the query for one of them via `fulan`.
 */
export function hotuQuery(f: Filtru, marka = true, fulan?: number): string {
  const profesor = f.who === "hotu" ? undefined : f.who;
  const ligeru = marka ? undefined : "false";

  if (f.per === "loron") {
    return query({ data: f.loron, profesor, marka: ligeru });
  }
  return query({
    fulan: fulan ?? f.fulan,
    tinan: f.tinan,
    semana: f.per === "semana" ? f.semana : undefined,
    profesor,
    marka: ligeru,
  });
}

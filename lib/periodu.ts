import { query } from "./api";
import type { Data } from "./types";

export type Periodu = "loron" | "semana" | "fulan";

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

/** The twelve months up to and including the current one, newest first. */
export function fulanLista(ohin: Date): { fulan: number; tinan: number }[] {
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(ohin.getFullYear(), ohin.getMonth() - i, 1);
    return { fulan: d.getMonth() + 1, tinan: d.getFullYear() };
  });
}

/**
 * The query string for `GET /api/prezensa/hotu/`. `data` and the
 * fulan/tinan/semana trio are mutually exclusive server-side — `data` wins —
 * so only one of them is ever sent.
 */
export function hotuQuery(f: Filtru, marka = true): string {
  const profesor = f.who === "hotu" ? undefined : f.who;
  const ligeru = marka ? undefined : "false";

  if (f.per === "loron") {
    return query({ data: f.loron, profesor, marka: ligeru });
  }
  return query({
    fulan: f.fulan,
    tinan: f.tinan,
    semana: f.per === "semana" ? f.semana : undefined,
    profesor,
    marka: ligeru,
  });
}

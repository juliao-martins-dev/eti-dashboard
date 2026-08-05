"use client";

import { api, useApi, type Rekursu } from "./api";
import { hotuQuery, type Filtru } from "./periodu";
import type {
  Data,
  EstaduRejistu,
  EstaduRejistuResposta,
  HotuResposta,
  KonfigSistema,
  OhinHotu,
} from "./types";

/** `GET /api/prezensa/ohin-hotu/` — everything Painel draws, in one call. */
export function useOhinHotu(): Rekursu<OhinHotu> {
  return useApi<OhinHotu>("/prezensa/ohin-hotu/");
}

/**
 * `GET /api/prezensa/hotu/` — the Prezensa grid and the Relatóriu source.
 * The server does the period filtering; the query string is the cache key, so
 * moving a picker refetches rather than re-slicing a stale month.
 */
export function useHotu(filtru: Filtru, marka = true): Rekursu<HotuResposta> {
  return useApi<HotuResposta>(`/prezensa/hotu/${hotuQuery(filtru, marka)}`);
}

/** `GET /api/konfig/` — the schedule and geofence behind the Konfig panel. */
export function useKonfig(): Rekursu<KonfigSistema> {
  return useApi<KonfigSistema>("/konfig/");
}

/**
 * Hand-write LISENSA / MISAUN / FERIADU / FALTA over a range.
 *
 * The server skips Sundays, opens the monthly sheet if needed and refuses the
 * whole range with `iha_marka` when any day already holds punches — none of
 * which is re-implemented here.
 */
export function rejistuEstadu(
  dadus: EstaduRejistu,
): Promise<EstaduRejistuResposta> {
  return api<EstaduRejistuResposta>("/prezensa/estadu/", {
    method: "POST",
    body: JSON.stringify(dadus),
  });
}

/** Return a hand-written day to "no record". 204, or `iha_marka` if it has punches. */
export function hasaiEstadu(profesor: number, data: Data): Promise<void> {
  return api<void>("/prezensa/estadu/", {
    method: "DELETE",
    body: JSON.stringify({ profesor, data }),
  });
}

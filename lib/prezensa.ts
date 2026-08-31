"use client";

import { api, useApi, type Rekursu } from "./api";
import { hotuQuery, type Filtru } from "./periodu";
import type {
  Data,
  MotivuRejeisaun,
  Prezensa,
  StatusRejistu,
  StatusRejistuResposta,
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
 * Hand-write LEAVE / MISSION / HOLIDAY / ABSENT over a range.
 *
 * The server skips Sundays, opens the monthly sheet if needed and refuses the
 * whole range with `iha_marka` when any day already holds punches — none of
 * which is re-implemented here.
 */
export function rejistuStatus(
  dadus: StatusRejistu,
): Promise<StatusRejistuResposta> {
  return api<StatusRejistuResposta>("/prezensa/status/", {
    method: "POST",
    body: JSON.stringify(dadus),
  });
}

/**
 * Refuse the evidence behind a day: it becomes ABSENT, shown as "Falta".
 *
 * Always an administrator's decision, never the server's. An out-of-fence
 * punch is already refused at check-in time whenever the geofence is
 * enforced, so a rule here would only fire where the school had turned that
 * off; and a poor indoor GPS fix reports 50–100 m of its own accuracy, which
 * would mark honest teachers absent with nobody in the loop.
 *
 * The punches are not deleted. They are the evidence the decision rests on,
 * and the day keeps them so the judgement can be reviewed — or undone.
 *
 * Answers with the whole updated day, so the caller can refresh without a
 * second request.
 */
export function rejeitaPrezensa(
  id: number,
  motivu: MotivuRejeisaun,
  obs: string,
): Promise<Prezensa> {
  return api<Prezensa>(`/prezensa/${id}/rejeita/`, {
    method: "POST",
    body: JSON.stringify({ motivu, obs }),
  });
}

/**
 * Take a rejection back: the day returns to PRESENT and the audit trail is
 * cleared.
 *
 * The server refuses this on a day it did not reject, so a leave-day ABSENT
 * written through `/status/` cannot be turned into PRESENT through here.
 */
export function hasaiRejeisaun(id: number): Promise<Prezensa> {
  return api<Prezensa>(`/prezensa/${id}/rejeita/`, { method: "DELETE" });
}

/** Return a hand-written day to "no record". 204, or `iha_marka` if it has punches. */
export function hasaiStatus(profesor: number, data: Data): Promise<void> {
  return api<void>("/prezensa/status/", {
    method: "DELETE",
    body: JSON.stringify({ profesor, data }),
  });
}

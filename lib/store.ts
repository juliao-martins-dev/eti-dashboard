"use client";

import { useEffect, useSyncExternalStore } from "react";
import { api, mensajenErru } from "./api";
import type { ProfesorFoun, ProfesorKriadu, ProfesorPatch, User } from "./types";

/**
 * The teacher roster, `GET /api/profesor/`.
 *
 * It is a module store rather than a per-component fetch because three
 * screens need the same list at once — the Profesór table, the teacher
 * `<select>` in the toolbars, and Painel's join for `nu_kontaktu`, which
 * `ohin-hotu` does not carry. One request, one copy, and a mutation anywhere
 * refreshes all of them.
 */

export interface EstaduRoster {
  profesor: User[];
  karega: boolean;
  erru: string | null;
}

const VAZIU: EstaduRoster = { profesor: [], karega: true, erru: null };

let snapshot: EstaduRoster = VAZIU;
let pedidu: Promise<void> | null = null;
let listeners: Array<() => void> = [];

function subscribe(l: () => void) {
  listeners = [...listeners, l];
  return () => {
    listeners = listeners.filter((x) => x !== l);
  };
}

const getSnapshot = (): EstaduRoster => snapshot;
const getServerSnapshot = (): EstaduRoster => VAZIU;

function publika(foun: EstaduRoster) {
  snapshot = foun;
  for (const l of listeners) l();
}

/** Single-flight: several screens mounting at once share one request. */
export function karegaProfesor(forsa = false): Promise<void> {
  if (pedidu && !forsa) return pedidu;

  pedidu = api<User[]>("/profesor/")
    .then((lista) => publika({ profesor: lista, karega: false, erru: null }))
    .catch((e: unknown) =>
      publika({ profesor: [], karega: false, erru: mensajenErru(e) }),
    )
    .finally(() => {
      pedidu = null;
    });

  return pedidu;
}

export function useProfesor(): EstaduRoster {
  const estadu = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    // Fetch once on the first mount anywhere; later mounts reuse the store.
    if (snapshot === VAZIU) void karegaProfesor();
  }, []);

  return estadu;
}

/**
 * Returns the created row including `password_inisial` — shown once and then
 * unrecoverable, since the server only keeps the hash.
 */
export async function aumentaProfesor(dadus: ProfesorFoun): Promise<ProfesorKriadu> {
  const kriadu = await api<ProfesorKriadu>("/profesor/", {
    method: "POST",
    body: JSON.stringify(dadus),
  });
  await karegaProfesor(true);
  return kriadu;
}

/** Deactivation is `{is_active: false}` — there is no DELETE, sheets refer to the account. */
export async function atualizaProfesor(
  id: number,
  dadus: ProfesorPatch,
): Promise<User> {
  const foun = await api<User>(`/profesor/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(dadus),
  });
  await karegaProfesor(true);
  return foun;
}

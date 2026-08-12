"use client";

import { useSyncExternalStore } from "react";
import {
  ACCESS_KEY,
  api,
  ApiErru,
  getRefresh,
  SESAUN_HOTU,
  setTokens,
} from "./api";
import type { Role, TrokaPasswordResposta, User } from "./types";

/**
 * The signed-in administrator.
 *
 * Real authentication now: `POST /api/auth/login/` returns a JWT pair plus the
 * profile, and every admin route needs an account with `is_staff` or
 * `role="ADMIN"` (`accounts/permissions.EhAdmin`) or it answers 403.
 */

/** The cached profile, so a reload draws the sidebar before /auth/me/ answers. */
export const PERFIL_KEY = "eti.perfil";

/**
 * Runs before paint: a visitor with no access token never sees a frame of the
 * dashboard. The in-app guard covers client-side navigation and expiry.
 */
export const SESAUN_BOOT = `(function(){try{
if(location.pathname==='/login')return;
if(!localStorage.getItem(${JSON.stringify(ACCESS_KEY)}))location.replace('/login');
}catch(x){}})();`;

let snapshot: User | null = null;
let adotadu = false;
let listeners: Array<() => void> = [];

function subscribe(l: () => void) {
  listeners = [...listeners, l];
  return () => {
    listeners = listeners.filter((x) => x !== l);
  };
}

function getSnapshot(): User | null {
  if (!adotadu) {
    adotadu = true;
    try {
      const raw = localStorage.getItem(PERFIL_KEY);
      snapshot = raw ? (JSON.parse(raw) as User) : null;
    } catch {
      snapshot = null;
    }
  }
  return snapshot;
}

/**
 * `undefined`, not `null` — "not read yet" is a different thing from "signed
 * out", and conflating them is what made a refresh bounce through /login: the
 * hydration render has no localStorage, and a guard reading `null` there would
 * throw out a perfectly good session before React swaps in the real snapshot.
 */
const getServerSnapshot = (): User | null | undefined => undefined;

function publika(perfil: User | null) {
  adotadu = true;
  snapshot = perfil;
  try {
    if (perfil) localStorage.setItem(PERFIL_KEY, JSON.stringify(perfil));
    else localStorage.removeItem(PERFIL_KEY);
  } catch {
    // Private mode; the session still works for this tab.
  }
  for (const l of listeners) l();
}

// A refresh that could not be recovered anywhere in the app ends the session
// here, so every screen reacts through the same path as an explicit logout.
if (typeof window !== "undefined") {
  addEventListener(SESAUN_HOTU, () => publika(null));
}

interface LoginResposta {
  access: string;
  refresh: string;
  user: User;
}

/**
 * Why the account was turned away, in its own words. `role` comes back on the
 * login response itself (`LoginSerializer` attaches `UserSerializer`), so this
 * is decided without a second round trip.
 */
const SEM_ASESU: Partial<Record<Role, string>> = {
  PROFESSOR:
    "Ita boot hanesan profesór babain, la iha autorizasaun atu tama ba iha painel administrasaun.",
  ESTUDANTE:
    "Konta estudante la iha autorizasaun atu tama ba iha painel administrasaun.",
};

const SEM_ASESU_OMISAUN =
  "Konta ne'e la iha autorizasaun atu tama ba iha painel administrasaun.";

/**
 * Throws `ApiErru`: 401 on bad credentials, 403 with code `la_admin` when the
 * credentials are right but the account may not be here.
 */
export async function login(email: string, password: string): Promise<User> {
  const d = await api<LoginResposta>("/auth/login/", {
    method: "POST",
    auth: false,
    body: JSON.stringify({ email, password }),
  });

  if (d.user.role !== "ADMIN") {
    // Refused before a single token is stored or the profile published. A
    // session that exists even for one render is one the /login redirect
    // effect acts on — which would send the very account being turned away
    // straight into the dashboard.
    throw new ApiErru(
      403,
      SEM_ASESU[d.user.role] ?? SEM_ASESU_OMISAUN,
      "la_admin",
      { role: d.user.role },
    );
  }

  setTokens(d.access, d.refresh);
  publika(d.user);
  return d.user;
}

export async function logout(): Promise<void> {
  const refresh = getRefresh();
  try {
    if (refresh) {
      await api("/auth/logout/", {
        method: "POST",
        body: JSON.stringify({ refresh }),
      });
    }
  } catch {
    // The token may already be expired or blacklisted; signing out locally is
    // what matters and must not be blocked by the server's answer.
  }
  setTokens(null, null);
  publika(null);
}

/**
 * Change the signed-in account's own password.
 *
 * The only route by which an administrator can change a password at all: the
 * roster's `reset-password` refuses `rasik` (yourself) and `eh_admin`
 * (another admin). It demands the old password on purpose — a borrowed
 * unlocked browser must not be enough to take the account.
 *
 * Storing the returned pair is not optional. The server blacklists *every*
 * refresh token for the account, the caller's included, and hands back a
 * fresh pair in the body precisely so the admin is not thrown to /login in
 * the middle of the action. Skip this and the session dies at the next
 * refresh, up to fifteen minutes later, far from the cause.
 */
export async function trokaPassword(
  passwordTuan: string,
  passwordFoun: string,
  passwordKonfirma: string,
): Promise<TrokaPasswordResposta> {
  const d = await api<TrokaPasswordResposta>("/auth/troka-password/", {
    method: "POST",
    body: JSON.stringify({
      password_tuan: passwordTuan,
      password_foun: passwordFoun,
      password_konfirma: passwordKonfirma,
    }),
  });
  setTokens(d.access, d.refresh);
  return d;
}

/** Re-reads the profile from the server, e.g. after a role change. */
export async function karegaPerfil(): Promise<void> {
  const perfil = await api<User>("/auth/me/");
  publika(perfil);
}

/**
 * Replace the signed-in administrator's own photo.
 *
 * `PATCH /api/auth/me/` is multipart and takes `foto` and nothing else — the
 * serializer is deliberately not partial, so the file *is* the request — and
 * answers with the whole profile, which is what refreshes the sidebar.
 * Uploading also deletes the previous file server-side.
 */
export async function atualizaFoto(foto: File): Promise<User> {
  const corpo = new FormData();
  corpo.append("foto", foto);
  const perfil = await api<User>("/auth/me/", { method: "PATCH", body: corpo });
  publika(perfil);
  return perfil;
}

/**
 * The signed-in profile, `null` when signed out, `undefined` until the browser
 * has been read. Guards must only act on an explicit `null`.
 */
export function useSesaun(): User | null | undefined {
  return useSyncExternalStore<User | null | undefined>(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * The one place that talks to eti-api.
 *
 * Everything the dashboard reads or writes goes through `api()`, which owns
 * the JWT pair, the single-flight refresh and the shape of an error. See
 * docs/integrate-api.md for the contract.
 */

export const ACCESS_KEY = "eti.access";
export const REFRESH_KEY = "eti.refresh";

/** Fired when the session cannot be recovered; the shell sends you to /login. */
export const SESAUN_HOTU = "eti:sesaun-hotu";

/**
 * NEXT_PUBLIC_API_URL wins. Without it the API is assumed to sit on port 8000
 * of whatever host is serving the dashboard, so one build works on localhost,
 * on 192.168.0.63 and on 10.214.94.41 without an env file per network.
 */
export function apiBase(): string {
  const env = process.env.NEXT_PUBLIC_API_URL;
  if (env) return env.replace(/\/+$/, "");
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:8000/api`;
  }
  return "http://localhost:8000/api";
}

export class ApiErru extends Error {
  readonly status: number;
  readonly code?: string;
  readonly corpo: Record<string, unknown>;

  constructor(
    status: number,
    detail: string,
    code?: string,
    corpo: Record<string, unknown> = {},
  ) {
    super(detail);
    this.name = "ApiErru";
    this.status = status;
    this.code = code;
    this.corpo = corpo;
  }
}

export function mensajenErru(e: unknown): string {
  if (e instanceof Error) return e.message;
  return "Erru la koñesidu.";
}

function le(k: string): string | null {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
}

function grava(k: string, v: string | null) {
  try {
    if (v === null) localStorage.removeItem(k);
    else localStorage.setItem(k, v);
  } catch {
    // Private mode; the session lasts as long as the tab.
  }
}

export const getAccess = () => le(ACCESS_KEY);
export const getRefresh = () => le(REFRESH_KEY);

export function setTokens(access: string | null, refresh: string | null) {
  grava(ACCESS_KEY, access);
  grava(REFRESH_KEY, refresh);
}

let renovando: Promise<string | null> | null = null;

/**
 * Refresh is single-flight: several 401s at once must not each burn a refresh
 * token, because rotation blacklists the one it was given and only the first
 * reply would still be valid.
 */
function renova(): Promise<string | null> {
  if (renovando) return renovando;

  const refresh = getRefresh();
  if (!refresh) return Promise.resolve(null);

  renovando = (async () => {
    try {
      const r = await fetch(`${apiBase()}/auth/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });
      if (!r.ok) return null;
      const d = (await r.json()) as { access: string; refresh?: string };
      // Rotation returns a fresh refresh token and blacklists the old one, so
      // storing only the access token would break the *next* refresh.
      setTokens(d.access, d.refresh ?? refresh);
      return d.access;
    } catch {
      return null;
    } finally {
      renovando = null;
    }
  })();

  return renovando;
}

/** First readable message out of a DRF field-error body. */
function mensajenDrf(corpo: unknown): string | null {
  if (!corpo || typeof corpo !== "object") return null;
  for (const valor of Object.values(corpo as Record<string, unknown>)) {
    if (typeof valor === "string") return valor;
    if (Array.isArray(valor) && typeof valor[0] === "string") return valor[0];
  }
  return null;
}

export interface ApiOpsaun extends RequestInit {
  /** Login and refresh are the only calls that must not carry a token. */
  auth?: boolean;
}

export async function api<T>(path: string, opsaun: ApiOpsaun = {}): Promise<T> {
  const { auth = true, ...rest } = opsaun;

  const manda = (token: string | null) => {
    const headers = new Headers(rest.headers);
    // FormData must set its own Content-Type: the boundary is generated with
    // the body, and naming the type here would strip it and break the upload.
    const multipart = typeof FormData !== "undefined" && rest.body instanceof FormData;
    if (rest.body && !multipart && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return fetch(`${apiBase()}${path}`, { ...rest, headers });
  };

  let res: Response;
  try {
    res = await manda(auth ? getAccess() : null);
  } catch {
    throw new ApiErru(
      0,
      "La bele konekta ba servidor. Verifika ligasaun ba eti-api.",
      "network",
    );
  }

  if (res.status === 401 && auth) {
    const foun = await renova();
    if (foun) {
      res = await manda(foun);
    } else {
      setTokens(null, null);
      dispatchEvent(new Event(SESAUN_HOTU));
      throw new ApiErru(401, "Sesaun hotu ona. Favor tama fila fali.", "token_not_valid");
    }
  }

  if (res.status === 204) return undefined as T;

  const corpo = await res.json().catch(() => null);

  if (!res.ok) {
    const d = (corpo ?? {}) as Record<string, unknown>;
    const detail =
      (typeof d.detail === "string" ? d.detail : null) ??
      mensajenDrf(d) ??
      `Erru ${res.status}`;
    throw new ApiErru(
      res.status,
      detail,
      typeof d.code === "string" ? d.code : undefined,
      d,
    );
  }

  return corpo as T;
}

/** `?a=1&b=2`, skipping anything unset. */
export function query(
  params: Record<string, string | number | boolean | null | undefined>,
): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== null && v !== undefined && v !== "") q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

export interface Rekursu<T> {
  dadus: T | null;
  karega: boolean;
  erru: string | null;
  refaz: () => void;
}

/**
 * A GET that follows `path`. Pass null to hold off (e.g. until a filter is
 * ready). The path doubles as the cache key, so changing a query parameter
 * refetches and anything stale is dropped rather than shown under new filters.
 */
export function useApi<T>(path: string | null): Rekursu<T> {
  const [versaun, setVersaun] = useState(0);
  const [estadu, setEstadu] = useState<{
    path: string | null;
    dadus: T | null;
    erru: string | null;
  }>({ path: null, dadus: null, erru: null });

  useEffect(() => {
    if (path === null) return;
    let vivu = true;
    api<T>(path)
      .then((d) => {
        if (vivu) setEstadu({ path, dadus: d, erru: null });
      })
      .catch((e: unknown) => {
        if (vivu) setEstadu({ path, dadus: null, erru: mensajenErru(e) });
      });
    return () => {
      vivu = false;
    };
  }, [path, versaun]);

  const fresku = estadu.path === path;
  return {
    dadus: fresku ? estadu.dadus : null,
    erru: fresku ? estadu.erru : null,
    karega: path !== null && (!fresku || (!estadu.dadus && !estadu.erru)),
    refaz: useCallback(() => setVersaun((v) => v + 1), []),
  };
}

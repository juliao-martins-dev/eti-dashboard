"use client";

import { useSyncExternalStore } from "react";

/**
 * A demo gate, NOT authentication.
 *
 * The credentials below are hardcoded so the login screen can be walked
 * through before the API is wired; anyone reading the JS bundle can see them,
 * and nothing on the dashboard is actually protected — every screen still
 * renders mock data. The real thing is `POST /api/auth/login/`, which already
 * exists in eti-api and returns a JWT pair plus the profile
 * (see docs/plan-request-api-to-backend.md §2). Replacing `login()` below with
 * that call, and storing the tokens instead of a flag, is the whole swap.
 */
const TEST_NARAN = "admin";
const TEST_PASSWORD = "123";

export const SESAUN_KEY = "eti.sesaun";

export interface Sesaun {
  naran: string;
}

/**
 * Runs before paint: a logged-out visitor never sees a frame of the dashboard
 * before the redirect. The in-app guard below covers client-side navigation,
 * where no document load happens.
 */
export const SESAUN_BOOT = `(function(){try{
if(location.pathname==='/login')return;
if(!localStorage.getItem(${JSON.stringify(SESAUN_KEY)}))location.replace('/login');
}catch(x){}})();`;

let snapshot: Sesaun | null = null;
let adotadu = false;
let listeners: Array<() => void> = [];

function subscribe(l: () => void) {
  listeners = [...listeners, l];
  return () => {
    listeners = listeners.filter((x) => x !== l);
  };
}

function getSnapshot(): Sesaun | null {
  if (!adotadu) {
    adotadu = true;
    try {
      const raw = localStorage.getItem(SESAUN_KEY);
      snapshot = raw ? (JSON.parse(raw) as Sesaun) : null;
    } catch {
      snapshot = null;
    }
  }
  return snapshot;
}

/** The server cannot read localStorage, so it renders as logged out. */
const getServerSnapshot = (): Sesaun | null => null;

function publika(foun: Sesaun | null) {
  adotadu = true;
  snapshot = foun;
  for (const l of listeners) l();
}

/** True when the credentials matched. The caller decides where to go next. */
export function login(naran: string, password: string): boolean {
  if (naran.toLowerCase() !== TEST_NARAN || password !== TEST_PASSWORD) {
    return false;
  }
  const sesaun: Sesaun = { naran: TEST_NARAN };
  try {
    localStorage.setItem(SESAUN_KEY, JSON.stringify(sesaun));
  } catch {
    // Private mode: the session lasts until the tab closes, which is enough.
  }
  publika(sesaun);
  return true;
}

export function logout() {
  try {
    localStorage.removeItem(SESAUN_KEY);
  } catch {
    // Nothing stored to clear.
  }
  publika(null);
}

export function useSesaun(): Sesaun | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

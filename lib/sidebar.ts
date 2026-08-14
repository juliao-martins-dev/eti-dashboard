"use client";

import { useSyncExternalStore } from "react";

export const SIDEBAR_KEY = "eti.sidebar";

/**
 * Runs before anything paints, so an administrator who chose the narrow rail
 * never watches the full sidebar appear and snap shut on every navigation.
 * It writes the attribute the store below reads back.
 */
export const SIDEBAR_BOOT = `(function(){try{
if(localStorage.getItem(${JSON.stringify(SIDEBAR_KEY)})==='kolapsu')
document.documentElement.dataset.sidebar='kolapsu';
}catch(x){}})();`;

let snapshot = false;
let adotadu = false;
let listeners: Array<() => void> = [];

function subscribe(l: () => void) {
  listeners = [...listeners, l];
  return () => {
    listeners = listeners.filter((x) => x !== l);
  };
}

/**
 * <html> is the source of truth, not React — SIDEBAR_BOOT has already put the
 * saved choice there before this runs, so the first client snapshot is read
 * off the element rather than guessed. Cached after that; only `setKolapsu`
 * moves it.
 */
function getSnapshot(): boolean {
  if (!adotadu) {
    adotadu = true;
    snapshot = document.documentElement.dataset.sidebar === "kolapsu";
  }
  return snapshot;
}

/** The server cannot know the choice, so it renders the sidebar open. */
const getServerSnapshot = (): boolean => false;

export function setKolapsu(kolapsu: boolean) {
  const e = document.documentElement;
  if (kolapsu) e.dataset.sidebar = "kolapsu";
  else delete e.dataset.sidebar;

  try {
    localStorage.setItem(SIDEBAR_KEY, kolapsu ? "kolapsu" : "loke");
  } catch {
    // Private mode or full quota; the choice still holds for this session.
  }

  snapshot = kolapsu;
  for (const l of listeners) l();
}

/**
 * Whether the administrator has collapsed the sidebar to its icon rail.
 *
 * Desktop only by construction: below `md` the sidebar is a drawer that is
 * either open or gone, and a rail there would be a third state nobody asked
 * for. Every class this drives is `md:` prefixed.
 */
export function useKolapsu(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

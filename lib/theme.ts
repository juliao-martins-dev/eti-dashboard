"use client";

import { useSyncExternalStore } from "react";

/** The six accents offered on Konfigurasaun, in the prototype's order. */
export const ACCENT = [
  { naran: "Teal", kor: "#0D9488" },
  { naran: "Azúl", kor: "#2563EB" },
  { naran: "Roxu", kor: "#7C3AED" },
  { naran: "Roza", kor: "#E11D48" },
  { naran: "Laranja", kor: "#EA580C" },
  { naran: "Matak", kor: "#16A34A" },
] as const;

export type Modu = "light" | "dark";

export const ACCENT_KEY = "eti.accent";
export const MODU_KEY = "eti.modu";
export const ACCENT_OMISAUN = ACCENT[0].kor;

/**
 * Runs before anything paints, so a reload never flashes default teal or a
 * light background on the way to the saved theme. It writes the two things
 * the store below reads back.
 */
export const THEME_BOOT = `(function(){try{
var e=document.documentElement;
var a=localStorage.getItem(${JSON.stringify(ACCENT_KEY)});
if(a)e.style.setProperty('--color-accent',a);
var m=localStorage.getItem(${JSON.stringify(MODU_KEY)});
if(m==='dark'||m==='light')e.dataset.mode=m;
}catch(x){}})();`;

export interface Tema {
  accent: string;
  modu: Modu;
}

const OMISAUN: Tema = { accent: ACCENT_OMISAUN, modu: "light" };

let snapshot: Tema = OMISAUN;
let adotadu = false;
let listeners: Array<() => void> = [];

function subscribe(l: () => void) {
  listeners = [...listeners, l];
  return () => {
    listeners = listeners.filter((x) => x !== l);
  };
}

/**
 * <html> is the source of truth, not React: THEME_BOOT has already written the
 * saved theme onto it by the time anything renders, so the first client
 * snapshot is read off the element rather than guessed. Cached after that —
 * only the setters below move it.
 */
function getSnapshot(): Tema {
  if (!adotadu) {
    adotadu = true;
    const e = document.documentElement;
    snapshot = {
      accent: e.style.getPropertyValue("--color-accent").trim() || ACCENT_OMISAUN,
      modu: e.dataset.mode === "dark" ? "dark" : "light",
    };
  }
  return snapshot;
}

/** The server cannot know the saved theme, so it renders the default and
 *  useSyncExternalStore re-renders once hydration is done. */
const getServerSnapshot = (): Tema => OMISAUN;

function publika(foun: Tema) {
  snapshot = foun;
  for (const l of listeners) l();
}

export function setAccent(kor: string) {
  document.documentElement.style.setProperty("--color-accent", kor);
  try {
    localStorage.setItem(ACCENT_KEY, kor);
  } catch {
    // Private mode or full quota; the colour still applies for this session.
  }
  publika({ ...getSnapshot(), accent: kor });
}

export function setModu(m: Modu) {
  document.documentElement.dataset.mode = m;
  try {
    localStorage.setItem(MODU_KEY, m);
  } catch {
    // As above.
  }
  publika({ ...getSnapshot(), modu: m });
}

export function useTema(): Tema {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

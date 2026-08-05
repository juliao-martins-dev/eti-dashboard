"use client";

import { useSyncExternalStore } from "react";
import { iso } from "./format";
import type { Data } from "./types";

/**
 * Today, read on the client only.
 *
 * Every page is prerendered at build time, so a date baked into the HTML
 * would be the *build's* date and would go stale the next morning. This
 * renders nothing on the server and the real day once hydrated, which also
 * keeps the two markups identical.
 */
let cache: Data | null = null;

const noKliente = (): Data => (cache ??= iso(new Date()));
const noServidor = (): Data | null => null;
const semMudansa = () => () => {};

export function useOhin(): Data | null {
  return useSyncExternalStore(semMudansa, noKliente, noServidor);
}

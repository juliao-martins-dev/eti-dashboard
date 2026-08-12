"use client";

import { useMemo, useState } from "react";

/** Rows per page across the dashboard. */
export const POR_PAJINA = 5;

export interface Pajinasaun<T> {
  /** The rows of the current page. */
  fatia: T[];
  pajina: number;
  totalPajina: number;
  total: number;
  /** 1-based bounds of what is on screen, for "1–5 husi 57". */
  husi: number;
  too: number;
  vai: (p: number) => void;
}

/**
 * Client-side pagination over a list already in memory.
 *
 * Every table here holds its whole result set — the roster is one array, and
 * `hotu` returns the period in a single response — so this slices rather than
 * fetching, and page changes cost nothing.
 *
 * `chave` is whatever must send the reader back to page one: a search string,
 * a serialised filter, a sort order. Landing on page 7 of a two-page result
 * shows an empty table, which reads as "no results" rather than "wrong page".
 */
export function usePajina<T>(
  lista: T[],
  { porPajina = POR_PAJINA, chave = "" }: { porPajina?: number; chave?: string } = {},
): Pajinasaun<T> {
  const [pajina, setPajina] = useState(1);
  const [chaveTuan, setChaveTuan] = useState(chave);

  // Adjusted during render, which is what React documents for "reset when an
  // input changes". An effect would paint the stale page first, and the lint
  // rule this codebase runs forbids setState inside one anyway.
  if (chave !== chaveTuan) {
    setChaveTuan(chave);
    setPajina(1);
  }

  const total = lista.length;
  const totalPajina = Math.max(1, Math.ceil(total / porPajina));
  // Clamped by derivation, never stored: deleting the last row of the last
  // page must not leave the table blank until an effect catches up.
  const atual = Math.min(pajina, totalPajina);

  const fatia = useMemo(
    () => lista.slice((atual - 1) * porPajina, atual * porPajina),
    [lista, atual, porPajina],
  );

  return {
    fatia,
    pajina: atual,
    totalPajina,
    total,
    husi: total === 0 ? 0 : (atual - 1) * porPajina + 1,
    too: Math.min(atual * porPajina, total),
    vai: (p) => setPajina(Math.min(Math.max(1, p), totalPajina)),
  };
}

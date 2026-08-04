"use client";

import type { ReactNode } from "react";
import { Seg } from "@/components/ui/Seg";
import { FULAN_NARAN } from "@/lib/format";
import { TINAN } from "@/lib/mock-data";
import { FULAN_LISTA, SEMANA_LISTA, type Filtru, type Periodu } from "@/lib/periodu";
import { useDadus } from "@/lib/store";

const PERIODU_NARAN: Record<Periodu, string> = {
  loron: "Loron",
  semana: "Semana",
  fulan: "Fulan",
};

/**
 * The toolbar shared by Prezensa and Relatóriu: who, over what period, and
 * whichever date control that period needs. `periodus` trims the segments —
 * Relatóriu offers only Semana and Fulan. `children` fills the right-hand end
 * of the bar with the page's own action button.
 */
export function Filters({
  value,
  onChange,
  periodus = ["loron", "semana", "fulan"],
  children,
}: {
  value: Filtru;
  onChange: (f: Filtru) => void;
  periodus?: readonly Periodu[];
  children?: ReactNode;
}) {
  const { profesor } = useDadus();
  const set = (parte: Partial<Filtru>) => onChange({ ...value, ...parte });

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 [&_input]:w-auto [&_select]:w-auto">
      <select
        aria-label="Profesór"
        value={value.who}
        onChange={(e) =>
          set({ who: e.target.value === "hotu" ? "hotu" : Number(e.target.value) })
        }
      >
        <option value="hotu">Profesór hotu-hotu</option>
        {profesor.map((p) => (
          <option key={p.id} value={p.id}>
            {p.naran_kompletu}
          </option>
        ))}
      </select>

      <Seg
        ariaLabel="Períodu"
        value={value.per}
        onChange={(per) => set({ per })}
        options={periodus.map((p) => ({ value: p, label: PERIODU_NARAN[p] }))}
      />

      {value.per === "loron" ? (
        <input
          type="date"
          aria-label="Loron"
          value={value.loron}
          onChange={(e) => set({ loron: e.target.value })}
        />
      ) : null}

      {value.per === "fulan" || value.per === "semana" ? (
        <select
          aria-label="Fulan"
          value={value.fulan}
          onChange={(e) => set({ fulan: Number(e.target.value) })}
        >
          {FULAN_LISTA.map((f) => (
            <option key={f} value={f}>
              {FULAN_NARAN[f]} {TINAN}
            </option>
          ))}
        </select>
      ) : null}

      {value.per === "semana" ? (
        <select
          aria-label="Semana"
          value={value.semana}
          onChange={(e) => set({ semana: Number(e.target.value) })}
        >
          {SEMANA_LISTA.map((s) => (
            <option key={s} value={s}>
              Semana {s}
            </option>
          ))}
        </select>
      ) : null}

      <div className="flex-1" />
      {children}
    </div>
  );
}

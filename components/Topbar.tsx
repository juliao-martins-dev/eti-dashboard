"use client";

import { usePathname } from "next/navigation";
import { dataKompletu } from "@/lib/format";
import { useOhin } from "@/lib/ohin";

const TITULU: Record<string, [string, string]> = {
  "/": ["Painel", "Rezumu prezensa ohin loron — ETI Dili"],
  "/profesor": ["Profesór sira", "Konta sira ne'ebé uza aplikasaun ETI PRESENSA"],
  "/prezensa": ["Prezensa", "Lista prezensa ho evidénsia marka"],
  "/relatoriu": ["Relatóriu", "Rezumu prezensa tuir períodu"],
  "/konfig": ["Konfigurasaun", "Aparénsia no informasaun sistema"],
};

export function Topbar() {
  const pathname = usePathname();
  const [titulu, sub] = TITULU[pathname] ?? TITULU["/"];
  const ohin = useOhin();

  return (
    <header className="flex items-end justify-between gap-3 px-[26px] pt-5 pb-[14px]">
      <div>
        <h1 className="text-[19px] font-bold">{titulu}</h1>
        <p className="mt-[2px] text-[12.5px] text-muted">{sub}</p>
      </div>
      <div className="text-right text-[12.5px] text-muted">
        Ohin loron
        {/* Empty until hydration — the build date would be wrong by morning. */}
        <b className="block min-h-[17px] font-mono text-[12px] text-text">
          {ohin ? dataKompletu(ohin) : ""}
        </b>
      </div>
    </header>
  );
}

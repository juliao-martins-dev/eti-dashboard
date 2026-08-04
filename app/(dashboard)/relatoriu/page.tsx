"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { IconDownload } from "@/components/icons";
import { Filters } from "@/components/Filters";
import { Button } from "@/components/ui/Button";
import { ClickRow, DataTable, NameCell, Td, Th } from "@/components/ui/DataTable";
import { Panel } from "@/components/ui/Panel";
import { StatCard, StatCards } from "@/components/ui/StatCard";
import { useToast } from "@/components/ui/Toast";
import { downloadCsv } from "@/lib/csv";
import { FULAN_NARAN } from "@/lib/format";
import { markaBa, TINAN } from "@/lib/mock-data";
import { filtraPeriodu, type Filtru } from "@/lib/periodu";
import { useDadus } from "@/lib/store";
import type { User } from "@/lib/types";

interface Rezumu {
  profesor: User;
  serv: number;
  prez: number;
  atraz: number;
  falta: number;
  lis: number;
  mis: number;
  pct: number;
}

const KABESALYU = [
  "Profesor",
  "Numeru ID",
  "Loron servisu",
  "Prezente",
  "Atrazadu",
  "Falta",
  "Lisensa",
  "Misaun",
  "Pct",
] as const;

export default function RelatoriuPage() {
  const toast = useToast();
  const router = useRouter();
  const { profesor, rejistu } = useDadus();

  const [filtru, setFiltru] = useState<Filtru>({
    who: "hotu",
    per: "fulan",
    loron: "2026-08-03",
    fulan: 7,
    semana: 2,
  });

  const agg = useMemo<Rezumu[]>(() => {
    const linha = filtraPeriodu(rejistu, filtru);
    const sira =
      filtru.who === "hotu" ? profesor : profesor.filter((p) => p.id === filtru.who);

    return sira.map((p) => {
      const seluk = linha.filter((r) => r.profesor.id === p.id);
      const a: Rezumu = {
        profesor: p,
        serv: seluk.length,
        prez: 0,
        atraz: 0,
        falta: 0,
        lis: 0,
        mis: 0,
        pct: 0,
      };

      for (const { prezensa } of seluk) {
        if (prezensa.estadu === "PREZENTE") {
          a.prez++;
          // A day counts as late if either arrival was — which is a wider rule
          // than Painel's "Atrazadu ohin", where only the morning exists yet.
          if (
            markaBa(prezensa, "ORAS_DADER_TAMA")?.atrazadu ||
            markaBa(prezensa, "ORAS_LOROKRAIK_TAMA")?.atrazadu
          ) {
            a.atraz++;
          }
        } else if (prezensa.estadu === "FALTA") a.falta++;
        else if (prezensa.estadu === "LISENSA") a.lis++;
        else if (prezensa.estadu === "MISAUN") a.mis++;
      }

      a.pct = a.serv ? Math.round((a.prez / a.serv) * 100) : 0;
      return a;
    });
  }, [profesor, rejistu, filtru]);

  const tot = (k: "serv" | "prez" | "atraz" | "falta" | "lis" | "mis") =>
    agg.reduce((s, a) => s + a[k], 0);
  const pct = tot("serv") ? Math.round((tot("prez") / tot("serv")) * 100) : 0;

  function exportaCsv() {
    downloadCsv(
      `relatoriu-prezensa-${FULAN_NARAN[filtru.fulan].toLowerCase()}-${TINAN}.csv`,
      KABESALYU,
      agg.map((a) => [
        a.profesor.naran_kompletu,
        a.profesor.numeru_id,
        a.serv,
        a.prez,
        a.atraz,
        a.falta,
        a.lis,
        a.mis,
        `${a.pct}%`,
      ]),
    );
    toast("Relatóriu CSV download ona ✓");
  }

  /** A row drills into Prezensa for that teacher over the same period. */
  function loke(profesorId: number) {
    const q = new URLSearchParams({
      who: String(profesorId),
      per: filtru.per,
      fulan: String(filtru.fulan),
      semana: String(filtru.semana),
    });
    router.push(`/prezensa?${q}`);
  }

  return (
    <>
      <Filters value={filtru} onChange={setFiltru} periodus={["semana", "fulan"]}>
        <Button onClick={exportaCsv}>
          <IconDownload />
          Download CSV
        </Button>
      </Filters>

      <StatCards>
        <StatCard k="Prezensa" v={pct} sub="%" />
        <StatCard k="Atrazadu" v={tot("atraz")} />
        <StatCard k="Falta" v={tot("falta")} />
        <StatCard k="Lisensa + Misaun" v={tot("lis") + tot("mis")} />
      </StatCards>

      <Panel>
        <DataTable>
          <thead>
            <tr>
              <Th>Profesór</Th>
              <Th>Loron servisu</Th>
              <Th>Prezente</Th>
              <Th>Atrazadu</Th>
              <Th>Falta</Th>
              <Th>Lisensa</Th>
              <Th>Misaun</Th>
              <Th>%</Th>
            </tr>
          </thead>
          <tbody>
            {agg.map((a) => (
              <ClickRow key={a.profesor.id} onOpen={() => loke(a.profesor.id)}>
                <Td>
                  <NameCell naran={a.profesor.naran_kompletu} sub={a.profesor.kargu} />
                </Td>
                <Td className="font-mono">{a.serv}</Td>
                <Td className="font-mono">{a.prez}</Td>
                <Td className="font-mono text-warn">{a.atraz}</Td>
                <Td className="font-mono text-bad">{a.falta}</Td>
                <Td className="font-mono">{a.lis}</Td>
                <Td className="font-mono">{a.mis}</Td>
                <Td className="font-mono">
                  <b>{a.pct}%</b>
                </Td>
              </ClickRow>
            ))}
          </tbody>
        </DataTable>
      </Panel>
    </>
  );
}

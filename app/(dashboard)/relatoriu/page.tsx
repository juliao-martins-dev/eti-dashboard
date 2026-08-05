"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Filters } from "@/components/Filters";
import { IconDownload } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { ClickRow, DataTable, EmptyRow, NameCell, Td, Th } from "@/components/ui/DataTable";
import { Empty, Panel } from "@/components/ui/Panel";
import { StatCard, StatCards } from "@/components/ui/StatCard";
import { useToast } from "@/components/ui/Toast";
import { downloadCsv } from "@/lib/csv";
import { dataDate, FULAN_NARAN, markaBa } from "@/lib/format";
import { useOhin } from "@/lib/ohin";
import type { Filtru } from "@/lib/periodu";
import { useHotu } from "@/lib/prezensa";
import type { Data, Profesor } from "@/lib/types";

interface Rezumu {
  profesor: Profesor;
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
  const ohin = useOhin();
  if (!ohin) {
    return (
      <Panel>
        <Empty>Karega dadus…</Empty>
      </Panel>
    );
  }
  return <Relatoriu ohin={ohin} />;
}

function Relatoriu({ ohin }: { ohin: Data }) {
  const toast = useToast();
  const router = useRouter();
  const agora = dataDate(ohin);

  const [filtru, setFiltru] = useState<Filtru>({
    who: "hotu",
    per: "fulan",
    loron: ohin,
    fulan: agora.getMonth() + 1,
    tinan: agora.getFullYear(),
    semana: 1,
  });

  const { dadus, karega, erru } = useHotu(filtru);

  /**
   * Aggregated here rather than server-side: the rows on screen and the rows
   * in the CSV are then guaranteed to be the same numbers.
   */
  const agg = useMemo<Rezumu[]>(() => {
    const linha = dadus?.profesor ?? [];
    const porProfesor = new Map<number, Rezumu>();

    for (const { profesor, prezensa } of linha) {
      let a = porProfesor.get(profesor.id);
      if (!a) {
        a = { profesor, serv: 0, prez: 0, atraz: 0, falta: 0, lis: 0, mis: 0, pct: 0 };
        porProfesor.set(profesor.id, a);
      }
      // Every working day the API returned counts as a day of service, marked
      // or not — an empty day is still a day the teacher owed.
      a.serv++;
      if (!prezensa) continue;

      if (prezensa.estadu === "PREZENTE") {
        a.prez++;
        // A day is late if either arrival was — wider than Painel's
        // "Atrazadu ohin", where only the morning exists yet.
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

    return [...porProfesor.values()].map((a) => ({
      ...a,
      pct: a.serv ? Math.round((a.prez / a.serv) * 100) : 0,
    }));
  }, [dadus]);

  const tot = (k: "serv" | "prez" | "atraz" | "falta" | "lis" | "mis") =>
    agg.reduce((s, a) => s + a[k], 0);
  const pct = tot("serv") ? Math.round((tot("prez") / tot("serv")) * 100) : 0;

  function exportaCsv() {
    if (!agg.length) {
      toast("La iha dadus atu download");
      return;
    }
    downloadCsv(
      `relatoriu-prezensa-${FULAN_NARAN[filtru.fulan].toLowerCase()}-${filtru.tinan}.csv`,
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
      tinan: String(filtru.tinan),
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
            {erru ? (
              <EmptyRow colSpan={8}>{erru}</EmptyRow>
            ) : karega ? (
              <EmptyRow colSpan={8}>Karega dadus…</EmptyRow>
            ) : agg.length ? (
              agg.map((a) => (
                <ClickRow key={a.profesor.id} onOpen={() => loke(a.profesor.id)}>
                  <Td>
                    <NameCell
                      naran={a.profesor.naran_kompletu}
                      sub={a.profesor.kargu}
                    />
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
              ))
            ) : (
              <EmptyRow colSpan={8}>La iha dadus ba períodu ne&apos;e</EmptyRow>
            )}
          </tbody>
        </DataTable>
      </Panel>
    </>
  );
}

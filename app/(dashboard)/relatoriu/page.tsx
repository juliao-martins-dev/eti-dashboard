"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Filters } from "@/components/Filters";
import { IconDownload } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import {
  ClickRow,
  DataTable,
  EmptyRow,
  NameCell,
  Td,
  Th,
} from "@/components/ui/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { Empty, Panel } from "@/components/ui/Panel";
import { StatCard, StatCards } from "@/components/ui/StatCard";
import { useToast } from "@/components/ui/Toast";
import { mensajenErru } from "@/lib/api";
import { dataDate } from "@/lib/format";
import { useOhin } from "@/lib/ohin";
import { usePajina } from "@/lib/pajina";
import type { Filtru } from "@/lib/periodu";
import { useRelatoriu, type Relatoriu } from "@/lib/relatoriu";
import type { Data } from "@/lib/types";

export default function RelatoriuPage() {
  const ohin = useOhin();
  if (!ohin) {
    return (
      <Panel>
        <Empty>Karega dadus…</Empty>
      </Panel>
    );
  }
  return <RelatoriuView ohin={ohin} />;
}

function RelatoriuView({ ohin }: { ohin: Data }) {
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
  const [export_, setExport] = useState<"pdf" | "excel" | null>(null);

  const { dadus, karega, erru } = useRelatoriu(filtru);
  const agg = dadus?.rezumu ?? [];
  const pajina = usePajina(agg, { chave: JSON.stringify(filtru) });

  const tot = (k: "serv" | "prez" | "atraz" | "falta" | "lis" | "mis") =>
    agg.reduce((s, a) => s + a[k], 0);
  const pct = tot("serv") ? Math.round((tot("prez") / tot("serv")) * 100) : 0;

  /** "hotu" or the teacher's own name, for the file name. */
  const alvu = () => {
    if (filtru.who === "hotu") return "hotu";
    const p = agg[0]?.profesor.naran_kompletu ?? String(filtru.who);
    return p.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  };

  async function exporta(tipu: "pdf" | "excel", rel: Relatoriu | null) {
    if (!rel || !rel.liuro.length) {
      toast("La iha dadus atu download");
      return;
    }
    setExport(tipu);
    try {
      if (tipu === "pdf") {
        const { exportaPdf, naranFilePdf } = await import("@/lib/export-pdf");
        await exportaPdf(rel, naranFilePdf(rel.periodu, alvu()));
        toast("Relatóriu PDF download ona ✓");
      } else {
        const { exportaExcel, naranFileExcel } = await import("@/lib/export-excel");
        await exportaExcel(rel, naranFileExcel(rel.periodu, alvu()));
        toast("Relatóriu Excel download ona ✓");
      }
    } catch (e) {
      toast(mensajenErru(e));
    } finally {
      setExport(null);
    }
  }

  /** A row drills into Prezensa for that teacher over the same period. */
  function loke(profesorId: number) {
    const q = new URLSearchParams({
      who: String(profesorId),
      // Prezensa has no year view; a yearly report drills into the month.
      per: filtru.per === "tinan" ? "fulan" : filtru.per,
      fulan: String(filtru.fulan),
      tinan: String(filtru.tinan),
      semana: String(filtru.semana),
    });
    router.push(`/prezensa?${q}`);
  }

  const okupadu = export_ !== null;

  return (
    <>
      <Filters
        value={filtru}
        onChange={setFiltru}
        periodus={["semana", "fulan", "tinan"]}
      >
        <Button
          variant="ghost"
          disabled={okupadu || karega}
          onClick={() => exporta("pdf", dadus)}
        >
          <IconDownload />
          {export_ === "pdf" ? "Kria PDF…" : "Export ba PDF"}
        </Button>
        <Button
          disabled={okupadu || karega}
          onClick={() => exporta("excel", dadus)}
        >
          <IconDownload />
          {export_ === "excel" ? "Kria Excel…" : "Export ba Excel"}
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
              <EmptyRow colSpan={8}>
                {filtru.per === "tinan"
                  ? "Karega tinan tomak — hein uitoan…"
                  : "Karega dadus…"}
              </EmptyRow>
            ) : pajina.fatia.length ? (
              pajina.fatia.map((a) => (
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
        {/* The cards above and both exports stay on the whole period — only
            the table is paged, so a percentage never counts five teachers. */}
        {erru || karega ? null : <Pagination pajina={pajina} naran="profesór" />}
      </Panel>
    </>
  );
}

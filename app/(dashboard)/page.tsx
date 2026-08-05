"use client";

import { useState } from "react";
import { DetalleModal } from "@/components/DetalleModal";
import { ClickRow, DataTable, NameCell, Td } from "@/components/ui/DataTable";
import { Empty, Grid2, Panel, PanelTitle } from "@/components/ui/Panel";
import { PunchChip } from "@/components/ui/PunchChip";
import { StatCard, StatCards } from "@/components/ui/StatCard";
import { markaBa } from "@/lib/format";
import { useOhinHotu } from "@/lib/prezensa";
import { useProfesor } from "@/lib/store";
import type { PrezensaProfesor } from "@/lib/types";

export default function PainelPage() {
  const { dadus: ohin, karega, erru } = useOhinHotu();
  const { profesor } = useProfesor();
  const [detalle, setDetalle] = useState<PrezensaProfesor | null>(null);

  if (erru) {
    return (
      <Panel>
        <Empty>{erru}</Empty>
      </Panel>
    );
  }
  if (karega || !ohin) {
    return (
      <Panel>
        <Empty>Karega dadus…</Empty>
      </Panel>
    );
  }

  const markaOna = ohin.profesor.filter((l) => l.marka_ona);
  const seidauk = ohin.profesor.filter((l) => !l.marka_ona);
  const atrazadu = markaOna.filter(
    (l) => markaBa(l.prezensa, "ORAS_DADER_TAMA")?.atrazadu,
  ).length;

  // The arrival feed, newest punch first.
  const feed = markaOna
    .flatMap((liña) => {
      const marka = markaBa(liña.prezensa, "ORAS_DADER_TAMA");
      return marka ? [{ liña, marka }] : [];
    })
    .sort((a, b) => b.marka.oras.localeCompare(a.marka.oras));

  /**
   * `ohin-hotu` nests only id / numeru_id / naran / kargu / foto per teacher,
   * so the number to chase an absence with comes from the roster call.
   */
  const kontaktu = (profesorId: number) =>
    profesor.find((p) => p.id === profesorId)?.nu_kontaktu || "—";

  return (
    <>
      <StatCards>
        <StatCard k="Profesór total" v={ohin.rezumu.total} />
        <StatCard
          k="Marka ona"
          v={ohin.rezumu.marka_ona}
          sub={`/ ${ohin.rezumu.total}`}
        />
        <StatCard k="Seidauk marka" v={ohin.rezumu.seidauk_marka} />
        <StatCard k="Atrazadu ohin" v={atrazadu} />
      </StatCards>

      <Grid2>
        <Panel>
          <PanelTitle>Seidauk marka ohin</PanelTitle>
          {seidauk.length ? (
            <DataTable>
              <tbody>
                {seidauk.map((liña) => (
                  <ClickRow key={liña.profesor.id} onOpen={() => setDetalle(liña)}>
                    <Td>
                      <NameCell
                        naran={liña.profesor.naran_kompletu}
                        sub={liña.profesor.kargu}
                      />
                    </Td>
                    <Td className="text-right font-mono text-muted">
                      {kontaktu(liña.profesor.id)}
                    </Td>
                  </ClickRow>
                ))}
              </tbody>
            </DataTable>
          ) : (
            <Empty>Profesór hotu marka tiha ona ✓</Empty>
          )}
        </Panel>

        <Panel>
          <PanelTitle>Marka foun ohin loron</PanelTitle>
          {feed.length ? (
            <DataTable>
              <tbody>
                {feed.map(({ liña, marka }) => (
                  <ClickRow key={liña.profesor.id} onOpen={() => setDetalle(liña)}>
                    <Td>
                      <NameCell
                        naran={liña.profesor.naran_kompletu}
                        sub={`${marka.sesaun_display} ${marka.tipu_display} · foto + GPS ✓`}
                      />
                    </Td>
                    <Td className="text-right">
                      <PunchChip marka={marka} />
                    </Td>
                  </ClickRow>
                ))}
              </tbody>
            </DataTable>
          ) : (
            <Empty>Seidauk iha marka ohin loron</Empty>
          )}
        </Panel>
      </Grid2>

      {detalle ? (
        <DetalleModal
          profesor={detalle.profesor}
          data={ohin.data}
          prezensa={detalle.prezensa}
          onClose={() => setDetalle(null)}
        />
      ) : null}
    </>
  );
}

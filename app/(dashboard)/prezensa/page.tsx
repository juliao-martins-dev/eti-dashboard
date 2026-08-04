"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DetalleModal } from "@/components/DetalleModal";
import { IconLisensa } from "@/components/icons";
import { Filters } from "@/components/Filters";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  ClickRow,
  DataTable,
  EmptyRow,
  NameCell,
  Td,
  Th,
} from "@/components/ui/DataTable";
import { Field, Row2 } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Panel } from "@/components/ui/Panel";
import { PunchChip } from "@/components/ui/PunchChip";
import { useToast } from "@/components/ui/Toast";
import {
  dataDate,
  dataNaran,
  KOLUMNA_LISTA,
  LORON_KURTU,
  lorokraik,
  oras,
  ORARIU,
} from "@/lib/format";
import { markaBa } from "@/lib/mock-data";
import { filtraPeriodu, type Filtru, type RejistuLoron } from "@/lib/periodu";
import {
  hasaiPrezensa,
  rejistuLisensa,
  useDadus,
  type LisensaFoun,
} from "@/lib/store";
import type { Estadu, Marka } from "@/lib/types";

const TIPU_LISENSA: { value: Estadu; label: string }[] = [
  { value: "LISENSA", label: "Lisensa" },
  { value: "MISAUN", label: "Misaun" },
  { value: "FERIADU", label: "Feriadu" },
];

const LISENSA_VAZIU: LisensaFoun = {
  profesor_id: 0,
  estadu: "LISENSA",
  husi: "2026-08-05",
  toO: "2026-08-05",
  obs: "",
};

export default function PrezensaPage() {
  // useSearchParams needs a Suspense boundary in the App Router; the fallback
  // never shows in practice because the page is client-rendered.
  return (
    <Suspense fallback={null}>
      <Prezensa />
    </Suspense>
  );
}

function Prezensa() {
  const toast = useToast();
  const { profesor, rejistu } = useDadus();

  // Relatóriu deep-links here as /prezensa?who=3&per=fulan&fulan=7&semana=2,
  // read once as the initial filter — after that the toolbar owns it.
  const sp = useSearchParams();
  const [filtru, setFiltru] = useState<Filtru>(() => {
    const who = sp.get("who");
    const per = sp.get("per");
    return {
      who: who && who !== "hotu" && Number(who) ? Number(who) : "hotu",
      per: per === "semana" || per === "fulan" ? per : "loron",
      loron: sp.get("loron") ?? "2026-08-03",
      fulan: Number(sp.get("fulan")) || 7,
      semana: Number(sp.get("semana")) || 2,
    };
  });

  const [detalle, setDetalle] = useState<RejistuLoron | null>(null);
  const [lisensaAbertu, setLisensaAbertu] = useState(false);
  const [lisensa, setLisensa] = useState<LisensaFoun>(LISENSA_VAZIU);

  const linha = useMemo(
    () =>
      filtraPeriodu(rejistu, filtru).sort(
        (a, b) =>
          a.prezensa.data.localeCompare(b.prezensa.data) ||
          a.profesor.id - b.profesor.id,
      ),
    [rejistu, filtru],
  );

  const komProfesor = filtru.who === "hotu";

  function abreLisensa(inisial?: Partial<LisensaFoun>) {
    setLisensa({
      ...LISENSA_VAZIU,
      profesor_id: profesor[0]?.id ?? 0,
      ...inisial,
    });
    setLisensaAbertu(true);
  }

  function salvaLisensa() {
    if (!lisensa.husi || !lisensa.toO || lisensa.toO < lisensa.husi) {
      toast("Data la loos");
      return;
    }
    rejistuLisensa(lisensa);
    setLisensaAbertu(false);
    setDetalle(null);
    toast(
      `${lisensa.estadu.charAt(0)}${lisensa.estadu.slice(1).toLowerCase()} rejistu ona ✓`,
    );
  }

  function hasai(r: RejistuLoron) {
    hasaiPrezensa(r.profesor.id, r.prezensa.data);
    setDetalle(null);
    toast(`${r.prezensa.estadu_display} hasai ona — loron fila ba mamuk`);
  }

  return (
    <>
      <Filters value={filtru} onChange={setFiltru}>
        <Button variant="ghost" onClick={() => abreLisensa()}>
          <IconLisensa />
          Rejistu Lisensa
        </Button>
      </Filters>

      <Panel>
        <DataTable>
          <thead>
            <tr>
              <Th>Data</Th>
              {komProfesor ? <Th>Profesór</Th> : null}
              {KOLUMNA_LISTA.map((k) => (
                <Th key={k.kolumna} sub={oras(ORARIU[k.kolumna])}>
                  {k.label}
                </Th>
              ))}
              <Th>Estadu</Th>
            </tr>
          </thead>
          <tbody>
            {linha.length ? (
              linha.map((r) => {
                const p = r.prezensa;
                const d = dataDate(p.data);
                const sabadu = d.getDay() === 6;
                // Anything but PREZENTE was written by the administration, so
                // there are no punches to show — the OBS takes their place.
                const marka = p.estadu === "PREZENTE";

                return (
                  <ClickRow
                    key={`${r.profesor.id}|${p.data}`}
                    onOpen={() => setDetalle(r)}
                  >
                    <Td>
                      <NameCell
                        naran={dataNaran(p.data)}
                        sub={LORON_KURTU[d.getDay()]}
                      />
                    </Td>

                    {komProfesor ? (
                      <Td>
                        <NameCell
                          naran={r.profesor.naran_kompletu}
                          sub={r.profesor.kargu}
                        />
                      </Td>
                    ) : null}

                    {marka ? (
                      KOLUMNA_LISTA.map((k) => (
                        <Sela
                          key={k.kolumna}
                          marka={markaBa(p, k.kolumna)}
                          semSesaun={sabadu && lorokraik(k.kolumna)}
                        />
                      ))
                    ) : (
                      <Td colSpan={4} className="text-muted">
                        {p.obs || "—"}
                      </Td>
                    )}

                    <Td>
                      <Badge estadu={p.estadu} />
                    </Td>
                  </ClickRow>
                );
              })
            ) : (
              <EmptyRow colSpan={komProfesor ? 7 : 6}>
                La iha dadus ba períodu ne&apos;e
              </EmptyRow>
            )}
          </tbody>
        </DataTable>
      </Panel>

      {detalle ? (
        <DetalleModal
          profesor={detalle.profesor}
          data={detalle.prezensa.data}
          prezensa={detalle.prezensa}
          onClose={() => setDetalle(null)}
          asaun={
            detalle.prezensa.estadu !== "PREZENTE" ? (
              <>
                <Button
                  variant="ghost"
                  className="mr-auto text-bad hover:border-bad hover:text-bad"
                  onClick={() => hasai(detalle)}
                >
                  Hasai rejistu
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    const p = detalle.prezensa;
                    setDetalle(null);
                    abreLisensa({
                      profesor_id: detalle.profesor.id,
                      estadu: p.estadu,
                      husi: p.data,
                      toO: p.data,
                      obs: p.obs,
                    });
                  }}
                >
                  Edita
                </Button>
              </>
            ) : null
          }
        />
      ) : null}

      <Modal
        open={lisensaAbertu}
        onClose={() => setLisensaAbertu(false)}
        title="Rejistu Lisensa"
        subtitle="Marka estadu ba loron ne'ebé profesór la marka prezensa"
        footer={
          <>
            <Button variant="ghost" onClick={() => setLisensaAbertu(false)}>
              Kansela
            </Button>
            <Button onClick={salvaLisensa}>Rejistu</Button>
          </>
        }
      >
        <Field label="Profesór" htmlFor="lWho">
          <select
            id="lWho"
            value={lisensa.profesor_id}
            onChange={(e) =>
              setLisensa({ ...lisensa, profesor_id: Number(e.target.value) })
            }
          >
            {profesor.map((p) => (
              <option key={p.id} value={p.id}>
                {p.naran_kompletu}
              </option>
            ))}
          </select>
        </Field>

        <Row2>
          <Field label="Tipu" htmlFor="lTipu">
            <select
              id="lTipu"
              value={lisensa.estadu}
              onChange={(e) =>
                setLisensa({ ...lisensa, estadu: e.target.value as Estadu })
              }
            >
              {TIPU_LISENSA.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label={<>&nbsp;</>}>
            <Badge estadu={lisensa.estadu} className="mt-2">
              Estadu iha lista prezensa
            </Badge>
          </Field>
        </Row2>

        <Row2>
          <Field label="Husi data" htmlFor="lFrom">
            <input
              id="lFrom"
              type="date"
              value={lisensa.husi}
              onChange={(e) => setLisensa({ ...lisensa, husi: e.target.value })}
            />
          </Field>
          <Field label="To'o data" htmlFor="lTo">
            <input
              id="lTo"
              type="date"
              value={lisensa.toO}
              onChange={(e) => setLisensa({ ...lisensa, toO: e.target.value })}
            />
          </Field>
        </Row2>

        <Field label="OBS (razaun)" htmlFor="lObs">
          <textarea
            id="lObs"
            rows={2}
            value={lisensa.obs}
            onChange={(e) => setLisensa({ ...lisensa, obs: e.target.value })}
            placeholder="ez. Moras — atestadu médiku"
          />
        </Field>
      </Modal>
    </>
  );
}

function Sela({ marka, semSesaun }: { marka: Marka | null; semSesaun: boolean }) {
  if (semSesaun) return <Td className="text-muted">×</Td>;
  if (!marka) return <Td className="text-muted">—</Td>;
  return (
    <Td>
      <PunchChip marka={marka} />
    </Td>
  );
}

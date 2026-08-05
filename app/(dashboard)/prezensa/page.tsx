"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DetalleModal } from "@/components/DetalleModal";
import { Filters } from "@/components/Filters";
import { IconLisensa } from "@/components/icons";
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
import { Field, Hint, Row2 } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Empty, Panel } from "@/components/ui/Panel";
import { PunchChip } from "@/components/ui/PunchChip";
import { useToast } from "@/components/ui/Toast";
import { ApiErru, mensajenErru } from "@/lib/api";
import {
  dataDate,
  dataNaran,
  KOLUMNA_LISTA,
  LORON_KURTU,
  lorokraik,
  markaBa,
  oras,
  ORARIU,
} from "@/lib/format";
import { useOhin } from "@/lib/ohin";
import type { Filtru, Periodu } from "@/lib/periodu";
import { hasaiEstadu, rejistuEstadu, useHotu } from "@/lib/prezensa";
import { useProfesor } from "@/lib/store";
import type { Data, Estadu, EstaduRejistu, Marka, PrezensaProfesorLoron } from "@/lib/types";

/** PREZENTE is absent on purpose: only a punch can produce it. */
const TIPU_LISENSA: { value: Estadu; label: string }[] = [
  { value: "LISENSA", label: "Lisensa" },
  { value: "MISAUN", label: "Misaun" },
  { value: "FERIADU", label: "Feriadu" },
  { value: "FALTA", label: "Falta" },
];

export default function PrezensaPage() {
  // useSearchParams needs a Suspense boundary in the App Router.
  return (
    <Suspense fallback={null}>
      <Portaun />
    </Suspense>
  );
}

/** Holds off until the client knows today, so no build-time date is hydrated. */
function Portaun() {
  const ohin = useOhin();
  if (!ohin) {
    return (
      <Panel>
        <Empty>Karega dadus…</Empty>
      </Panel>
    );
  }
  return <Prezensa ohin={ohin} />;
}

function Prezensa({ ohin }: { ohin: Data }) {
  const toast = useToast();
  const { profesor } = useProfesor();
  const sp = useSearchParams();
  const agora = dataDate(ohin);

  // Relatóriu deep-links here as ?who=&per=&fulan=&tinan=&semana=; read once
  // as the initial filter, after which the toolbar owns it.
  const [filtru, setFiltru] = useState<Filtru>(() => {
    const who = sp.get("who");
    const per = sp.get("per");
    return {
      who: who && Number(who) ? Number(who) : "hotu",
      per: per === "semana" || per === "fulan" ? (per as Periodu) : "loron",
      loron: sp.get("loron") ?? ohin,
      fulan: Number(sp.get("fulan")) || agora.getMonth() + 1,
      tinan: Number(sp.get("tinan")) || agora.getFullYear(),
      semana: Number(sp.get("semana")) || 1,
    };
  });

  const { dadus, karega, erru, refaz } = useHotu(filtru);

  const [detalle, setDetalle] = useState<PrezensaProfesorLoron | null>(null);
  const [lisensaAbertu, setLisensaAbertu] = useState(false);
  const [haruka, setHaruka] = useState(false);
  const [konflitu, setKonflitu] = useState<Data[] | null>(null);
  const [lisensa, setLisensa] = useState<EstaduRejistu>({
    profesor: 0,
    estadu: "LISENSA",
    husi: ohin,
    too: ohin,
    obs: "",
  });

  const linha = dadus?.profesor ?? [];
  const komProfesor = filtru.who === "hotu";

  function abreLisensa(inisial?: Partial<EstaduRejistu>) {
    setKonflitu(null);
    setLisensa({
      profesor: profesor[0]?.id ?? 0,
      estadu: "LISENSA",
      husi: ohin,
      too: ohin,
      obs: "",
      ...inisial,
    });
    setLisensaAbertu(true);
  }

  async function salvaLisensa() {
    if (!lisensa.profesor) {
      toast("Favor hili profesór");
      return;
    }
    setKonflitu(null);
    setHaruka(true);
    try {
      const r = await rejistuEstadu(lisensa);
      setLisensaAbertu(false);
      setDetalle(null);
      refaz();
      toast(`${r.total} loron rejistu ho ${r.estadu.toLowerCase()} ✓`);
    } catch (e) {
      // The whole range is refused when any day already holds punches — the
      // server names them, so the admin can go and look.
      if (e instanceof ApiErru && e.code === "iha_marka") {
        setKonflitu((e.corpo.loron as Data[]) ?? []);
      } else {
        toast(mensajenErru(e));
      }
    } finally {
      setHaruka(false);
    }
  }

  async function hasai(r: PrezensaProfesorLoron) {
    setHaruka(true);
    try {
      await hasaiEstadu(r.profesor.id, r.data);
      setDetalle(null);
      refaz();
      toast("Rejistu hasai ona — loron fila ba mamuk");
    } catch (e) {
      toast(mensajenErru(e));
    } finally {
      setHaruka(false);
    }
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
            {erru ? (
              <EmptyRow colSpan={komProfesor ? 7 : 6}>{erru}</EmptyRow>
            ) : karega ? (
              <EmptyRow colSpan={komProfesor ? 7 : 6}>Karega dadus…</EmptyRow>
            ) : linha.length ? (
              linha.map((r) => {
                const p = r.prezensa;
                const d = dataDate(r.data);
                const sabadu = d.getDay() === 6;
                // Only PREZENTE has punches to show; a hand-written day puts
                // its OBS in their place, and an empty day has neither.
                const komMarka = p?.estadu === "PREZENTE";

                return (
                  <ClickRow
                    key={`${r.profesor.id}|${r.data}`}
                    onOpen={() => setDetalle(r)}
                  >
                    <Td>
                      <NameCell
                        naran={dataNaran(r.data)}
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

                    {komMarka ? (
                      KOLUMNA_LISTA.map((k) => (
                        <Sela
                          key={k.kolumna}
                          marka={markaBa(p, k.kolumna)}
                          semSesaun={sabadu && lorokraik(k.kolumna)}
                        />
                      ))
                    ) : (
                      <Td colSpan={4} className="text-muted">
                        {p?.obs || "—"}
                      </Td>
                    )}

                    <Td>
                      {p?.estadu ? (
                        <Badge estadu={p.estadu} />
                      ) : (
                        <span className="text-muted">—</span>
                      )}
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
          data={detalle.data}
          prezensa={detalle.prezensa}
          onClose={() => setDetalle(null)}
          asaun={
            detalle.prezensa && detalle.prezensa.estadu !== "PREZENTE" ? (
              <>
                <Button
                  variant="ghost"
                  className="mr-auto text-bad hover:border-bad hover:text-bad"
                  disabled={haruka}
                  onClick={() => hasai(detalle)}
                >
                  Hasai rejistu
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    const p = detalle.prezensa!;
                    setDetalle(null);
                    abreLisensa({
                      profesor: detalle.profesor.id,
                      estadu: p.estadu,
                      husi: detalle.data,
                      too: detalle.data,
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
            <Button
              variant="ghost"
              disabled={haruka}
              onClick={() => setLisensaAbertu(false)}
            >
              Kansela
            </Button>
            <Button disabled={haruka} onClick={salvaLisensa}>
              {haruka ? "Haruka…" : "Rejistu"}
            </Button>
          </>
        }
      >
        <Field label="Profesór" htmlFor="lWho">
          <select
            id="lWho"
            value={lisensa.profesor}
            onChange={(e) =>
              setLisensa({ ...lisensa, profesor: Number(e.target.value) })
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
              value={lisensa.too}
              onChange={(e) => setLisensa({ ...lisensa, too: e.target.value })}
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

        {konflitu ? (
          <p
            role="alert"
            className="rounded-[8px] border border-[color-mix(in_srgb,var(--color-bad)_40%,transparent)] bg-[color-mix(in_srgb,var(--color-bad)_9%,transparent)] px-[11px] py-[9px] text-[12px] font-medium text-bad"
          >
            Loron ne&apos;e iha marka ona, la bele taka ho estadu:{" "}
            <b className="font-mono">{konflitu.join(", ")}</b>. La iha buat ida
            rejistu — troka períodu no koko fila fali.
          </p>
        ) : (
          <Hint>
            Servidor sei salta Domingu no kria lista prezensa se seidauk iha.
            Loron ho marka ona la bele taka.
          </Hint>
        )}
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

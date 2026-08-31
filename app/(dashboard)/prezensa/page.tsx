"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DetalleModal } from "@/components/DetalleModal";
import { Filters } from "@/components/Filters";
import { IconLisensa, IconRejeita, IconTaka } from "@/components/icons";
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
import { cx } from "@/lib/cx";
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
import {
  hasaiRejeisaun,
  hasaiStatus,
  rejeitaPrezensa,
  rejistuStatus,
  useHotu,
} from "@/lib/prezensa";
import { etiketaRoster, useProfesor } from "@/lib/store";
import type {
  Data,
  Marka,
  MotivuRejeisaun,
  PrezensaProfesorLoron,
  Status,
  StatusRejistu,
} from "@/lib/types";

/** The two reasons an administrator may refuse a day's evidence. */
const MOTIVU_REJEISAUN: {
  value: MotivuRejeisaun;
  label: string;
  sub?: string;
}[] = [
  { value: "FOTO_FALSU", label: "Foto falsu" },
  { value: "DISTANSIA_DOOK", label: "Distánsia dook liu husi eskola" },
  {
    value: "HOTU_HOTU",
    label: "Hotu-hotu",
    // Spelled out because "Hotu-hotu" alone does not say what it covers.
    sub: "Foto falsu no distánsia dook liu husi eskola",
  },
];

/** PRESENT is absent on purpose: only a punch can produce it. */
const TIPU_LISENSA: { value: Status; label: string }[] = [
  { value: "LEAVE", label: "Lisensa" },
  { value: "MISSION", label: "Misaun" },
  { value: "HOLIDAY", label: "Feriadu" },
  { value: "ABSENT", label: "Falta" },
];

/**
 * The grid's own filter, on top of the shared period/teacher toolbar.
 *
 * `mamuk` is not a status the API stores — it is a row with no `prezensa` at
 * all, which is the day nobody recorded anything. That is the row an
 * administrator opens this screen to find, so it earns a place in the list.
 */
const STATUS_FILTRU = [
  { value: "hotu", label: "Status hotu-hotu" },
  { value: "PRESENT", label: "Prezente" },
  { value: "ABSENT", label: "Falta" },
  { value: "LEAVE", label: "Lisensa" },
  { value: "MISSION", label: "Misaun" },
  { value: "HOLIDAY", label: "Feriadu" },
  { value: "mamuk", label: "Seidauk iha rejistu" },
] as const;

type StatusFiltru = (typeof STATUS_FILTRU)[number]["value"];

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
  /** The day being refused, while the reason is chosen. */
  const [rejeita, setRejeita] = useState<PrezensaProfesorLoron | null>(null);
  const [motivu, setMotivu] = useState<MotivuRejeisaun>("FOTO_FALSU");
  const [motivuObs, setMotivuObs] = useState("");
  const [lisensa, setLisensa] = useState<StatusRejistu>({
    profesor: 0,
    status: "LEAVE",
    husi: ohin,
    too: ohin,
    obs: "",
  });

  // Memoised for its identity, not its cost: `?? []` mints a fresh array on
  // every render while the fetch is in flight, which would defeat the filter
  // memo below.
  const linha = useMemo(() => dadus?.profesor ?? [], [dadus]);
  const komProfesor = filtru.who === "hotu";

  const [status, setStatus] = useState<StatusFiltru>("hotu");

  // Same labeller as the toolbar, so a teacher is named identically wherever
  // the screen offers a choice between accounts.
  const etiketa = useMemo(() => etiketaRoster(profesor), [profesor]);

  // Narrowing rather than paging: a month for the whole school is ~1500 rows,
  // and the reason to open it is almost always one kind of day. Filtering
  // answers that in one step, where paging made it 300 pages to look through.
  const liñaFiltradu = useMemo(() => {
    if (status === "hotu") return linha;
    if (status === "mamuk") return linha.filter((r) => !r.prezensa);
    return linha.filter((r) => r.prezensa?.status === status);
  }, [linha, status]);

  function abreLisensa(inisial?: Partial<StatusRejistu>) {
    setKonflitu(null);
    setLisensa({
      profesor: profesor[0]?.id ?? 0,
      status: "LEAVE",
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
      const r = await rejistuStatus(lisensa);
      setLisensaAbertu(false);
      setDetalle(null);
      refaz();
      const naran =
        TIPU_LISENSA.find((t) => t.value === r.status)?.label ?? r.status;
      toast(`${r.total} loron rejistu ho ${naran.toLowerCase()} ✓`);
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

  function abreRejeita(r: PrezensaProfesorLoron) {
    setMotivu("FOTO_FALSU");
    setMotivuObs("");
    setRejeita(r);
  }

  async function konfirmaRejeita() {
    const alvu = rejeita?.prezensa;
    if (!alvu) return;
    setHaruka(true);
    try {
      await rejeitaPrezensa(alvu.id, motivu, motivuObs.trim());
      setRejeita(null);
      setDetalle(null);
      refaz();
      toast("Prezensa rejeita ona — loron ne'e sai Falta");
    } catch (e) {
      toast(mensajenErru(e));
    } finally {
      setHaruka(false);
    }
  }

  async function hasaiRejeita(r: PrezensaProfesorLoron) {
    if (!r.prezensa) return;
    setHaruka(true);
    try {
      // The punches were never deleted, so the day simply returns to PRESENT.
      await hasaiRejeisaun(r.prezensa.id);
      setDetalle(null);
      refaz();
      toast("Rejeisaun hasai ona — loron fila ba prezente");
    } catch (e) {
      toast(mensajenErru(e));
    } finally {
      setHaruka(false);
    }
  }

  async function hasai(r: PrezensaProfesorLoron) {
    setHaruka(true);
    try {
      await hasaiStatus(r.profesor.id, r.data);
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
        <select
          aria-label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFiltru)}
        >
          {STATUS_FILTRU.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
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
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {erru ? (
              <EmptyRow colSpan={komProfesor ? 7 : 6}>{erru}</EmptyRow>
            ) : karega ? (
              <EmptyRow colSpan={komProfesor ? 7 : 6}>Karega dadus…</EmptyRow>
            ) : liñaFiltradu.length ? (
              liñaFiltradu.map((r) => {
                const p = r.prezensa;
                const d = dataDate(r.data);
                const sabadu = d.getDay() === 6;
                // Only PRESENT has punches to show; a hand-written day puts
                // its OBS in their place, and an empty day has neither.
                const komMarka = p?.status === "PRESENT";

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
                      {p?.status ? (
                        <>
                          <Badge status={p.status} />
                          {/* A rejected day is ABSENT like any other; the line
                              underneath is what tells the two apart at a
                              glance, and says who is answerable for it. */}
                          {p.rejeisaun_motivu ? (
                            <small className="mt-[3px] block text-[11px] leading-tight text-bad">
                              {p.rejeisaun_motivu_display}
                              {p.rejeita_husi_naran ? (
                                <span className="block text-muted">
                                  husi {p.rejeita_husi_naran}
                                </span>
                              ) : null}
                            </small>
                          ) : null}
                        </>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </Td>
                  </ClickRow>
                );
              })
            ) : (
              <EmptyRow colSpan={komProfesor ? 7 : 6}>
                {status === "hotu"
                  ? "La iha dadus ba períodu ne'e"
                  : "La iha liña ho status ne'e iha períodu ne'e"}
              </EmptyRow>
            )}
          </tbody>
        </DataTable>
        {/* The one thing paging gave that filtering does not: how much is
            here. Without it a filtered grid cannot be told from a short one. */}
        {erru || karega || !liñaFiltradu.length ? null : (
          <div className="border-t border-border px-[14px] py-[10px] text-[12.5px] text-muted">
            <b className="font-mono font-semibold text-text">
              {liñaFiltradu.length}
            </b>{" "}
            liña
            {status === "hotu" ? null : (
              <>
                {" "}
                husi{" "}
                <b className="font-mono font-semibold text-text">
                  {linha.length}
                </b>
              </>
            )}
          </div>
        )}
      </Panel>

      {detalle ? (
        <DetalleModal
          profesor={detalle.profesor}
          data={detalle.data}
          prezensa={detalle.prezensa}
          onClose={() => setDetalle(null)}
          asaun={
            <>
              {/*
                A day with punches can be refused; a day already refused can
                have that taken back. Both are about evidence, so neither
                appears on a day that has none.
              */}
              {detalle.prezensa?.status === "PRESENT" &&
              detalle.prezensa.marka.length > 0 ? (
                <Button
                  variant="ghost"
                  tone="bad"
                  className="mr-auto"
                  disabled={haruka}
                  onClick={() => abreRejeita(detalle)}
                >
                  <IconRejeita />
                  Rejeita Prezensa
                </Button>
              ) : null}

              {detalle.prezensa?.rejeisaun_motivu ? (
                <Button
                  variant="ghost"
                  tone="ok"
                  className="mr-auto"
                  disabled={haruka}
                  onClick={() => hasaiRejeita(detalle)}
                >
                  Hasai rejeisaun
                </Button>
              ) : null}

              {/*
                The hand-written path. A rejected day is ABSENT too, but it is
                not a hand-written one -- removing it would try to delete a day
                holding punches, which the server refuses anyway.
              */}
              {detalle.prezensa &&
              detalle.prezensa.status !== "PRESENT" &&
              !detalle.prezensa.rejeisaun_motivu ? (
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
                        status: p.status,
                        husi: detalle.data,
                        too: detalle.data,
                        obs: p.obs,
                      });
                    }}
                  >
                    Edita
                  </Button>
                </>
              ) : null}
            </>
          }
        />
      ) : null}

      {/*
        Stacked on the detail modal, so it takes over the outside-click and
        Escape: one stray click must not throw away a half-typed reason.
      */}
      <Modal
        open={rejeita !== null}
        onClose={() => setRejeita(null)}
        title="Motivu Rejeita"
        subtitle={
          rejeita
            ? `${rejeita.profesor.naran_kompletu} · ${dataNaran(rejeita.data)}`
            : undefined
        }
        foraLiur={false}
        larguraMax="460px"
        footer={
          <>
            <Button variant="ghost" disabled={haruka} onClick={() => setRejeita(null)}>
              <IconTaka />
              Kansela
            </Button>
            <Button tone="bad" disabled={haruka} onClick={konfirmaRejeita}>
              <IconRejeita />
              {haruka ? "Rejeita…" : "Konfirma"}
            </Button>
          </>
        }
      >
        <Field label="Motivu">
          {/* Radios, not a select: there are two, and both need reading. */}
          <div className="flex flex-col gap-[2px]">
            {MOTIVU_REJEISAUN.map((m) => (
              <label
                key={m.value}
                className={cx(
                  "flex cursor-pointer items-center gap-[9px] rounded-[8px] border px-[11px] py-[9px] text-[13px]",
                  motivu === m.value
                    ? "border-bad bg-[color-mix(in_srgb,var(--color-bad)_8%,transparent)] font-semibold text-bad"
                    : "border-border hover:bg-bg",
                )}
              >
                <input
                  type="radio"
                  name="motivu"
                  className="h-[15px] w-[15px] shrink-0 accent-[var(--color-bad)]"
                  checked={motivu === m.value}
                  onChange={() => setMotivu(m.value)}
                />
                <span className="min-w-0">
                  {m.label}
                  {m.sub ? (
                    <small className="mt-[1px] block text-[11.5px] font-normal text-muted">
                      {m.sub}
                    </small>
                  ) : null}
                </span>
              </label>
            ))}
          </div>
        </Field>

        <Field label="Observasaun" htmlFor="rObs">
          <textarea
            id="rObs"
            rows={3}
            value={motivuObs}
            onChange={(e) => setMotivuObs(e.target.value)}
            placeholder="ez. Foto la hanesan profesór ne'e"
          />
        </Field>

        <Hint>
          Loron ne&apos;e sei sai <b>Falta</b>. Marka sira ho sira-nia foto no
          GPS sei nafatin iha— sira mak evidénsia ba desizaun ne&apos;e, no bele
          hasai rejeisaun karik sala.
        </Hint>
      </Modal>

      <Modal
        open={lisensaAbertu}
        onClose={() => setLisensaAbertu(false)}
        title="Rejistu Lisensa"
        subtitle="Marka status ba loron ne'ebé profesór la marka prezensa"
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
                {etiketa(p)}
              </option>
            ))}
          </select>
        </Field>

        <Row2>
          <Field label="Tipu" htmlFor="lTipu">
            <select
              id="lTipu"
              value={lisensa.status}
              onChange={(e) =>
                setLisensa({ ...lisensa, status: e.target.value as Status })
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
            <Badge status={lisensa.status} className="mt-2">
              Status iha lista prezensa
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
            Loron ne&apos;e iha marka ona, la bele taka ho status:{" "}
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

"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Grid2, Panel, PanelTitle } from "@/components/ui/Panel";
import { Seg } from "@/components/ui/Seg";
import { useToast } from "@/components/ui/Toast";
import { apiAlternativa, setApiBase, useApiBase } from "@/lib/api";
import { cx } from "@/lib/cx";
import { oras } from "@/lib/format";
import { useKonfig } from "@/lib/prezensa";
import { ACCENT, setAccent, setModu, useTema, type Modu } from "@/lib/theme";

const MODU: { value: Modu; label: string }[] = [
  { value: "light", label: "☀ Naroman" },
  { value: "dark", label: "☾ Nakukun" },
];

export default function KonfigPage() {
  const toast = useToast();
  const { accent, modu } = useTema();
  const { dadus: konfig, karega, erru } = useKonfig();
  const base = useApiBase();
  // Empty until hydration, so no swap is offered against the wrong base.
  const outru = base ? apiAlternativa() : null;

  return (
    <Grid2>
      <Panel>
        <PanelTitle>Aparénsia</PanelTitle>
        <div className="flex flex-col gap-4 p-4">
          <Field label="Kór prinsipál">
            <div className="flex flex-wrap gap-[10px]">
              {ACCENT.map((a) => {
                const ativu = a.kor.toLowerCase() === accent.toLowerCase();
                return (
                  <button
                    key={a.kor}
                    type="button"
                    title={a.naran}
                    aria-label={a.naran}
                    aria-pressed={ativu}
                    onClick={() => setAccent(a.kor)}
                    style={{ background: a.kor }}
                    className={cx(
                      "flex h-10 w-10 items-center justify-center rounded-[10px] border-2 font-bold text-white",
                      ativu ? "border-text" : "border-transparent",
                    )}
                  >
                    {ativu ? "✓" : null}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Modu">
            <Seg ariaLabel="Modu" options={MODU} value={modu} onChange={setModu} />
          </Field>

          {/* The accent and mode already applied and persisted on click; this
              is the prototype's confirmation, kept as it was. */}
          <Button
            className="self-start"
            onClick={() => toast("Konfigurasaun rai ona ✓")}
          >
            Rai konfigurasaun
          </Button>
        </div>
      </Panel>

      <Panel>
        <PanelTitle>
          Informasaun sistema
          <span className="text-[11px] font-normal text-muted">
            husi servidor (.env)
          </span>
        </PanelTitle>
        <div className="px-4 pt-[6px] pb-3">
          {erru ? (
            <div className="py-[9px] text-[13px] text-bad">{erru}</div>
          ) : karega || !konfig ? (
            <div className="py-[9px] text-[13px] text-muted">Karega dadus…</div>
          ) : (
            <>
              <Kv naran="Oras dadér">
                <b className="font-mono">
                  {oras(konfig.oras_dader_tama)} — {oras(konfig.oras_dader_fila)}
                </b>
              </Kv>
              <Kv naran="Oras lorokraik">
                <b className="font-mono">
                  {oras(konfig.oras_lorokraik_tama)} —{" "}
                  {oras(konfig.oras_lorokraik_fila)}
                </b>
              </Kv>
              <Kv naran="Limite sesaun">
                <b className="font-mono">{oras(konfig.limite_sesaun)}</b>
              </Kv>
              <Kv naran="Sábadu lorokraik">
                <b>La iha sesaun</b>
              </Kv>
              <Kv naran="Geofence (raiu eskola)">
                <b className="font-mono">{konfig.eskola_raiu_metru} m</b>
              </Kv>
              <Kv naran="Obriga fatin">
                <b className={konfig.eskola_obriga_fatin ? undefined : "text-warn"}>
                  {konfig.eskola_obriga_fatin ? "Ativu" : "Dezativadu"}
                </b>
              </Kv>
              <Kv naran="Servidor API">
                <span className="flex items-center gap-2">
                  <b className="font-mono text-[12px]">{base}</b>
                  {outru ? (
                    <button
                      type="button"
                      title={`Troka ba ${outru}`}
                      onClick={() => {
                        setApiBase(outru);
                        location.reload();
                      }}
                      className="rounded-[6px] border border-border px-2 py-[2px] text-[11px] font-medium text-muted hover:border-accent hover:text-accent"
                    >
                      Troka
                    </button>
                  ) : null}
                </span>
              </Kv>
            </>
          )}
        </div>
      </Panel>
    </Grid2>
  );
}

function Kv({ naran, children }: { naran: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-3 border-b border-border py-[9px] text-[13px] last:border-b-0">
      <span className="text-muted">{naran}</span>
      {children}
    </div>
  );
}

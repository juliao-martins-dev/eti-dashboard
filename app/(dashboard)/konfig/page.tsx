"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Grid2, Panel, PanelTitle } from "@/components/ui/Panel";
import { Seg } from "@/components/ui/Seg";
import { useToast } from "@/components/ui/Toast";
import { cx } from "@/lib/cx";
import { hamoosDadus, useDadus } from "@/lib/store";
import { ACCENT, setAccent, setModu, useTema, type Modu } from "@/lib/theme";

/** Read off eti-api's settings; the panel is a mirror, not a form. */
const SISTEMA: { naran: string; valor: string; mono?: boolean }[] = [
  { naran: "Oras dadér", valor: "08:00 — 12:00", mono: true },
  { naran: "Oras lorokraik", valor: "13:30 — 17:30", mono: true },
  { naran: "Limite sesaun", valor: "13:00", mono: true },
  { naran: "Sábadu lorokraik", valor: "La iha sesaun" },
  { naran: "Geofence (raiu eskola)", valor: "100 m", mono: true },
  { naran: "Obriga fatin", valor: "Ativu" },
];

const MODU: { value: Modu; label: string }[] = [
  { value: "light", label: "☀ Naroman" },
  { value: "dark", label: "☾ Nakukun" },
];

export default function KonfigPage() {
  const toast = useToast();
  const { accent, modu } = useTema();
  const { profesor, rejistu } = useDadus();

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
          {SISTEMA.map((s) => (
            <Kv key={s.naran} naran={s.naran}>
              <b className={s.mono ? "font-mono" : undefined}>{s.valor}</b>
            </Kv>
          ))}
        </div>
      </Panel>

      <Panel>
        <PanelTitle>
          Dadus mock
          <span className="text-[11px] font-normal text-muted">
            rai iha localStorage
          </span>
        </PanelTitle>
        <div className="flex flex-col gap-4 p-4">
          <div>
            <Kv naran="Profesór iha lista">
              <b className="font-mono">{profesor.length}</b>
            </Kv>
            <Kv naran="Rejistu prezensa">
              <b className="font-mono">{rejistu.length}</b>
            </Kv>
          </div>
          {/* Drops added teachers and hand-written days, back to the seed. The
              theme keys are separate on purpose and stay untouched. */}
          <Button
            variant="ghost"
            className="self-start text-bad hover:border-bad hover:text-bad"
            onClick={() => {
              hamoosDadus();
              toast("Dadus mock hamoos ona — fila ba dadus orijinál ✓");
            }}
          >
            Hamoos dadus
          </Button>
        </div>
      </Panel>
    </Grid2>
  );
}

function Kv({ naran, children }: { naran: string; children: ReactNode }) {
  return (
    <div className="flex justify-between border-b border-border py-[9px] text-[13px] last:border-b-0">
      <span className="text-muted">{naran}</span>
      {children}
    </div>
  );
}

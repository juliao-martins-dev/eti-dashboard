"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { IconXave } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { Field, Hint } from "@/components/ui/Field";
import { Grid2, Panel, PanelTitle } from "@/components/ui/Panel";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Seg } from "@/components/ui/Seg";
import { useToast } from "@/components/ui/Toast";
import {
  apiAlternativa,
  ApiErru,
  mensajenErru,
  setApiBase,
  useApiBase,
} from "@/lib/api";
import { trokaPassword } from "@/lib/auth";
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
      <TrokaPasswordKard />
    </Grid2>
  );
}

/**
 * The signed-in administrator changes their own password.
 *
 * This is the only route by which an admin can change a password at all — the
 * roster's reset refuses both `rasik` (yourself) and `eh_admin` (another
 * admin) — so without this card an administrator who wanted a new password
 * had nowhere to go.
 */
function TrokaPasswordKard() {
  const toast = useToast();
  const [tuan, setTuan] = useState("");
  const [foun, setFoun] = useState("");
  const [konfirma, setKonfirma] = useState("");
  const [haruka, setHaruka] = useState(false);
  const [erru, setErru] = useState<string | null>(null);
  /** Django's validator messages, already user-readable and already Tetun. */
  const [erros, setErros] = useState<string[]>([]);

  const laHanesan = konfirma.length > 0 && foun !== konfirma;
  const hanesanTuan = foun.length > 0 && foun === tuan;
  const prontu =
    tuan.length > 0 && foun.length > 0 && !laHanesan && !hanesanTuan;

  function limpa() {
    setErru(null);
    setErros([]);
  }

  async function submete(e: FormEvent) {
    e.preventDefault();
    if (!prontu || haruka) return;

    setHaruka(true);
    limpa();
    try {
      // Persists the fresh token pair itself; the session survives the change.
      const d = await trokaPassword(tuan, foun, konfirma);
      setTuan("");
      setFoun("");
      setKonfirma("");
      toast(
        d.sesaun_taka > 0
          ? `Password troka ona ✓ — sesaun ${d.sesaun_taka} taka`
          : "Password troka ona ✓",
      );
    } catch (e) {
      if (e instanceof ApiErru && e.code === "password_fraku") {
        // Every reason the password was refused, not just the first.
        const lista = e.corpo.erros;
        setErros(Array.isArray(lista) ? (lista as string[]) : []);
      }
      setErru(mensajenErru(e));
      // Only the wrong field is cleared: retyping a long new password because
      // the *old* one was mistyped is the kind of thing that makes people
      // give up on changing it at all.
      if (e instanceof ApiErru && e.code === "password_tuan_sala") setTuan("");
    } finally {
      setHaruka(false);
    }
  }

  return (
    <Panel>
      <PanelTitle>
        Seguransa
        <span className="text-[11px] font-normal text-muted">konta rasik</span>
      </PanelTitle>

      <form onSubmit={submete} className="flex flex-col gap-[14px] p-4">
        <Field label="Password tuan" htmlFor="kTuan">
          <PasswordInput
            id="kTuan"
            autoComplete="current-password"
            value={tuan}
            onChange={(e) => {
              setTuan(e.target.value);
              limpa();
            }}
            placeholder="Hatama password atuál"
          />
        </Field>

        <Field label="Password foun" htmlFor="kFoun">
          <PasswordInput
            id="kFoun"
            autoComplete="new-password"
            value={foun}
            onChange={(e) => {
              setFoun(e.target.value);
              limpa();
            }}
            placeholder="Hatama password foun"
          />
        </Field>

        <Field label="Konfirma password foun" htmlFor="kKonfirma">
          <PasswordInput
            id="kKonfirma"
            autoComplete="new-password"
            value={konfirma}
            onChange={(e) => {
              setKonfirma(e.target.value);
              limpa();
            }}
            placeholder="Hatama fila fali"
          />
        </Field>

        {/* Said before the request, so the button never looks simply broken. */}
        {laHanesan ? (
          <p className="-mt-[6px] text-[12.5px] text-bad">
            Password foun rua la hanesan
          </p>
        ) : hanesanTuan ? (
          <p className="-mt-[6px] text-[12.5px] text-bad">
            Password foun tenke la hanesan ho password tuan
          </p>
        ) : null}

        {erru ? (
          <div
            role="alert"
            className="rounded-[8px] border border-[color-mix(in_srgb,var(--color-bad)_40%,transparent)] bg-[color-mix(in_srgb,var(--color-bad)_9%,transparent)] px-[11px] py-[9px] text-[12px] font-medium text-bad"
          >
            {erros.length > 0 ? (
              <ul className="flex list-disc flex-col gap-[3px] pl-4">
                {erros.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            ) : (
              erru
            )}
          </div>
        ) : null}

        <Hint>
          Troka password sei taka sesaun hotu-hotu iha aparellu seluk. Iha ekrán
          ne&apos;e ita kontinua tama.
        </Hint>

        <Button
          type="submit"
          tone="info"
          disabled={!prontu || haruka}
          className="self-start"
        >
          <IconXave />
          {haruka ? "Troka…" : "Troka password"}
        </Button>
      </form>
    </Panel>
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

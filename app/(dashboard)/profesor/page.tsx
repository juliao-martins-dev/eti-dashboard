"use client";

import { useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useKonfig } from "@/lib/prezensa";
import {
  IconAumenta,
  IconBuka,
  IconDezativa,
  IconHamos,
  IconRai,
  IconTaka,
  IconXave,
} from "@/components/icons";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  ClickRow,
  DataTable,
  EmptyRow,
  NameCell,
  Td,
  Th,
  ThOrdena,
  type Dir,
} from "@/components/ui/DataTable";
import { Field, Hint, Row2 } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { Panel } from "@/components/ui/Panel";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { useToast } from "@/components/ui/Toast";
import { ApiErru, mensajenErru } from "@/lib/api";
import { kopia } from "@/lib/kopia";
import { usePajina } from "@/lib/pajina";
import {
  aumentaProfesor,
  atualizaProfesor,
  hamosProfesor,
  resetPasswordProfesor,
  useProfesor,
} from "@/lib/store";
import type { NivelEdukasaun, Sexu, User } from "@/lib/types";

interface Form {
  naran_kompletu: string;
  numeru_id: string;
  sexu: Sexu;
  email: string;
  kargu: string;
  nu_kontaktu: string;
  /** HABILITASAUN LITERÁRIA is a heading over these two on the paper roster. */
  nivel_edukasaun: NivelEdukasaun | "";
  area_estudu: string;
  disiplina_hanorin: string;
}

const FORM_VAZIU: Form = {
  naran_kompletu: "",
  numeru_id: "",
  sexu: "FETO",
  email: "",
  kargu: "",
  nu_kontaktu: "",
  nivel_edukasaun: "",
  area_estudu: "",
  disiplina_hanorin: "",
};

/** null = closed · "foun" = create · a User = edit that account. */
type Alvu = null | "foun" | User;

/** The sortable columns, by what they sort on rather than by their header. */
type Kampu = "naran" | "numeru" | "kargu" | "status";

/**
 * Locale-aware, and that matters here: half the roster carries á/é/ó/ú, and a
 * plain `<` sorts by code point, which files every accented letter after "z" —
 * "Ximenes" would come before "Álvaro". `numeric` also keeps "Sala 2" ahead of
 * "Sala 10" in the free-text columns.
 */
const kolator = new Intl.Collator("pt", { sensitivity: "base", numeric: true });

function kompara(a: User, b: User, kampu: Kampu): number {
  switch (kampu) {
    case "numeru":
      return a.numeru_id - b.numeru_id;
    case "kargu":
      return kolator.compare(a.kargu ?? "", b.kargu ?? "");
    case "status":
      // Active first when ascending; the roster is read to find who is live.
      return Number(b.is_active ?? true) - Number(a.is_active ?? true);
    default:
      return kolator.compare(a.naran_kompletu, b.naran_kompletu);
  }
}

export default function ProfesorPage() {
  const toast = useToast();
  const { profesor, karega, erru } = useProfesor();
  // The picklists come from the API so the form cannot drift from the model.
  const { dadus: konfig } = useKonfig();
  const [buka, setBuka] = useState("");
  const [alvu, setAlvu] = useState<Alvu>(null);
  const [form, setForm] = useState<Form>(FORM_VAZIU);
  const [haruka, setHaruka] = useState(false);
  /**
   * The password to hand over, from a create or a reset. The server keeps only
   * its hash, so this card is the one chance to read it either way — `tipu`
   * only decides the wording.
   */
  const [senha, setSenha] = useState<
    { naran: string; password: string; tipu: "foun" | "reset" } | null
  >(null);
  const senhaRef = useRef<HTMLInputElement>(null);
  /** Confirms the copy on the button itself; a toast alone is easy to miss. */
  const [kopiaOk, setKopiaOk] = useState(false);
  /**
   * Whether the handed-over password is legible. Held here rather than inside
   * the field because the copy fallback has to force it open — a browser will
   * not let the user Ctrl+C out of a masked input.
   */
  const [hatudu, setHatudu] = useState(false);

  const [ordena, setOrdena] = useState<{ kampu: Kampu; dir: Dir }>({
    kampu: "naran",
    dir: "asc",
  });

  const lista = useMemo(() => {
    const q = buka.trim().toLowerCase();
    if (!q) return profesor;
    return profesor.filter((p) =>
      `${p.naran_kompletu}${p.email}${p.kargu}${p.area_estudu ?? ""}${p.disiplina_hanorin ?? ""}`
        .toLowerCase()
        .includes(q),
    );
  }, [profesor, buka]);

  const ordenadu = useMemo(() => {
    const sinal = ordena.dir === "asc" ? 1 : -1;
    // Copied first: the roster array is shared state, and sort mutates.
    return [...lista].sort((a, b) => {
      const r = sinal * kompara(a, b, ordena.kampu);
      // Name breaks every tie, so equal kargu or equal status still comes out
      // in a stable, readable order rather than in fetch order.
      return r !== 0 || ordena.kampu === "naran"
        ? r
        : kolator.compare(a.naran_kompletu, b.naran_kompletu);
    });
  }, [lista, ordena]);

  const pajina = usePajina(ordenadu, {
    chave: `${buka}|${ordena.kampu}|${ordena.dir}`,
  });

  /** Same column flips direction; a new column starts ascending. */
  function trokaOrdena(kampu: Kampu) {
    setOrdena((o) =>
      o.kampu === kampu
        ? { kampu, dir: o.dir === "asc" ? "desc" : "asc" }
        : { kampu, dir: "asc" },
    );
  }

  function abre(a: Exclude<Alvu, null>) {
    setForm(
      a === "foun"
        ? FORM_VAZIU
        : {
            naran_kompletu: a.naran_kompletu,
            numeru_id: String(a.numeru_id),
            sexu: a.sexu === "MANE" ? "MANE" : "FETO",
            email: a.email,
            kargu: a.kargu ?? "",
            nu_kontaktu: a.nu_kontaktu ?? "",
            nivel_edukasaun: a.nivel_edukasaun ?? "",
            area_estudu: a.area_estudu ?? "",
            disiplina_hanorin: a.disiplina_hanorin ?? "",
          },
    );
    setAlvu(a);
  }

  async function salva() {
    const naran = form.naran_kompletu.trim();
    const numeru = Number(form.numeru_id);
    const email = form.email.trim();

    if (!naran || !numeru || !email) {
      toast("Favor prenxe naran, numeru ID no email");
      return;
    }

    const dadus = {
      numeru_id: numeru,
      naran_kompletu: naran,
      email,
      kargu: form.kargu.trim(),
      nu_kontaktu: form.nu_kontaktu.trim(),
      sexu: form.sexu,
      nivel_edukasaun: form.nivel_edukasaun,
      area_estudu: form.area_estudu.trim(),
      disiplina_hanorin: form.disiplina_hanorin.trim(),
    };

    setHaruka(true);
    try {
      if (alvu === "foun") {
        const kriadu = await aumentaProfesor(dadus);
        // Straight into the hand-over: closing without reading the password
        // means it is gone for good.
        setKopiaOk(false);
        setHatudu(false);
        setSenha({
          naran: kriadu.naran_kompletu,
          password: kriadu.password_inisial,
          tipu: "foun",
        });
        setAlvu(null);
      } else if (alvu) {
        await atualizaProfesor(alvu.id, dadus);
        setAlvu(null);
        toast("Dadus profesór atualiza ona ✓");
      }
    } catch (e) {
      // duplicate_numeru / duplicate_email arrive with a Tetun `detail` that
      // already says which column clashed, so it is shown as-is.
      toast(mensajenErru(e));
    } finally {
      setHaruka(false);
    }
  }

  async function kopiaSenha() {
    if (!senha) return;
    // Nothing is selected up front: `kopia` needs the click's user activation
    // intact, and it manages its own selection.
    const ok = await kopia(senha.password);
    setKopiaOk(ok);
    if (ok) {
      toast("Password kopia ona ✓");
      return;
    }
    // Last resort — leave the password highlighted so Ctrl+C still works.
    // It has to be revealed first: a masked input can be selected but not
    // copied out of, so the fallback would hand over an empty clipboard.
    // flushSync, because an ordinary setState would still be pending when
    // select() ran and the selection would land on the masked field.
    flushSync(() => setHatudu(true));
    senhaRef.current?.select();
    toast("La bele kopia otomátiku — password hili ona, uza Ctrl+C");
  }

  async function trokaAtivu(p: User) {
    const ativu = p.is_active ?? true;
    setHaruka(true);
    try {
      await atualizaProfesor(p.id, { is_active: !ativu });
      setAlvu(null);
      toast(
        ativu
          ? `Konta ${p.naran_kompletu} dezativa ona`
          : `Konta ${p.naran_kompletu} ativa fila fali ✓`,
      );
    } catch (e) {
      toast(mensajenErru(e));
    } finally {
      setHaruka(false);
    }
  }

  /* -- Hamos profesór: two password fields, then one irreversible call ---- */

  const [hamos, setHamos] = useState<User | null>(null);
  const [senha1, setSenha1] = useState("");
  const [senha2, setSenha2] = useState("");

  const senhaHanesan = senha1.length > 0 && senha1 === senha2;

  function abreHamos(p: User) {
    setSenha1("");
    setSenha2("");
    setHamos(p);
  }

  async function konfirmaHamos() {
    if (!hamos || !senhaHanesan) return;
    setHaruka(true);
    try {
      await hamosProfesor(hamos.id, senha1);
      setHamos(null);
      setAlvu(null);
      toast(`Profesór ${hamos.naran_kompletu} hamos ona`);
    } catch (e) {
      // A wrong password must not leave the typed value behind for a retry.
      if (e instanceof ApiErru && e.code === "password_sala") {
        setSenha1("");
        setSenha2("");
      }
      toast(mensajenErru(e));
    } finally {
      setHaruka(false);
    }
  }

  /* -- Reset password: two matching fields, then hand it over ------------- */

  const [reset, setReset] = useState<User | null>(null);
  const [nova1, setNova1] = useState("");
  const [nova2, setNova2] = useState("");

  const novaHanesan = nova1.length > 0 && nova1 === nova2;

  function abreReset(p: User) {
    setNova1("");
    setNova2("");
    setReset(p);
  }

  async function konfirmaReset() {
    if (!reset || !novaHanesan) return;
    setHaruka(true);
    try {
      await resetPasswordProfesor(reset.id, nova1, nova2);
      const naran = reset.naran_kompletu;
      setReset(null);
      setAlvu(null);
      // Straight into the hand-over card: the teacher has to be told what it
      // is, and the server never sends it back.
      setKopiaOk(false);
      setHatudu(false);
      setSenha({ naran, password: nova1, tipu: "reset" });
    } catch (e) {
      toast(mensajenErru(e));
    } finally {
      setHaruka(false);
    }
  }

  const edita = alvu !== null && alvu !== "foun";
  /** An ADMIN row is read-only here: the API refuses both destructive calls. */
  const alvuEhAdmin = edita && (alvu as User).role === "ADMIN";

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative">
          <IconBuka className="pointer-events-none absolute top-1/2 left-[9px] h-[14px] w-[14px] -translate-y-1/2 text-muted" />
          <input
            value={buka}
            onChange={(e) => setBuka(e.target.value)}
            placeholder="Buka naran, email, kargu, área, disiplina…"
            aria-label="Buka profesór"
            className="w-[230px] pl-[30px]"
          />
        </div>
        <div className="flex-1" />
        <Button onClick={() => abre("foun")}>
          <IconAumenta />
          Aumenta Profesór
        </Button>
      </div>

      <Panel>
        <DataTable>
          <thead>
            <tr>
              {/* Only the columns worth ordering by: the qualification pair
                  and the phone number have no order anyone reads them in. */}
              <ThOrdena
                ativu={ordena.kampu === "naran"}
                dir={ordena.dir}
                onOrdena={() => trokaOrdena("naran")}
              >
                Profesór
              </ThOrdena>
              <ThOrdena
                ativu={ordena.kampu === "numeru"}
                dir={ordena.dir}
                onOrdena={() => trokaOrdena("numeru")}
              >
                Nu. ID
              </ThOrdena>
              <ThOrdena
                ativu={ordena.kampu === "kargu"}
                dir={ordena.dir}
                onOrdena={() => trokaOrdena("kargu")}
              >
                Kargu
              </ThOrdena>
              <Th>Habilitasaun literária</Th>
              <Th>Kontaktu</Th>
              <ThOrdena
                ativu={ordena.kampu === "status"}
                dir={ordena.dir}
                onOrdena={() => trokaOrdena("status")}
              >
                Status konta
              </ThOrdena>
            </tr>
          </thead>
          <tbody>
            {erru ? (
              <EmptyRow colSpan={6}>{erru}</EmptyRow>
            ) : karega ? (
              <EmptyRow colSpan={6}>Karega dadus…</EmptyRow>
            ) : pajina.fatia.length ? (
              pajina.fatia.map((p) => {
                const ativu = p.is_active ?? true;
                return (
                  <ClickRow key={p.id} onOpen={() => abre(p)}>
                    <Td>
                      <div className="flex items-center gap-2">
                        <NameCell naran={p.naran_kompletu} sub={p.email} />
                        {p.role === "ADMIN" ? (
                          <Badge tone="viol">Admin</Badge>
                        ) : null}
                      </div>
                    </Td>
                    <Td className="font-mono">{p.numeru_id}</Td>
                    <Td>{p.kargu || "—"}</Td>
                    <Td>
                      {p.nivel_edukasaun_display || p.area_estudu ? (
                        <>
                          <div>{p.nivel_edukasaun_display || "—"}</div>
                          <div className="text-[12px] text-muted">
                            {p.area_estudu || "—"}
                          </div>
                        </>
                      ) : (
                        "—"
                      )}
                    </Td>
                    <Td className="font-mono text-muted">{p.nu_kontaktu || "—"}</Td>
                    <Td>
                      <Badge tone={ativu ? "ok" : "muted"}>
                        {ativu ? "Ativu" : "Dezativadu"}
                      </Badge>
                    </Td>
                  </ClickRow>
                );
              })
            ) : (
              <EmptyRow colSpan={6}>La hetan rezultadu</EmptyRow>
            )}
          </tbody>
        </DataTable>
        {erru || karega ? null : <Pagination pajina={pajina} naran="profesór" />}
      </Panel>

      <Modal
        open={alvu !== null}
        onClose={() => setAlvu(null)}
        title={edita ? (alvu as User).naran_kompletu : "Aumenta Profesór"}
        subtitle={
          edita
            ? "Atualiza dadus konta profesór nian"
            : "Kria konta foun ba aplikasaun ETI PREZENSA"
        }
        footer={
          <>
            {/* Grouped and pushed left: these act on the account, not on the
                form, and each carries the colour of what it does — amber for
                reversible, blue for the credential, red for irreversible. */}
            {edita && !alvuEhAdmin ? (
              <div className="mr-auto flex flex-wrap gap-2">
                <Button
                  variant="ghost"
                  tone={((alvu as User).is_active ?? true) ? "warn" : "ok"}
                  disabled={haruka}
                  onClick={() => trokaAtivu(alvu as User)}
                >
                  <IconDezativa />
                  {((alvu as User).is_active ?? true) ? "Dezativa" : "Ativa"}
                </Button>
                <Button
                  variant="ghost"
                  tone="info"
                  disabled={haruka}
                  onClick={() => abreReset(alvu as User)}
                >
                  <IconXave />
                  Reset password
                </Button>
                <Button
                  variant="ghost"
                  tone="bad"
                  disabled={haruka}
                  onClick={() => abreHamos(alvu as User)}
                >
                  <IconHamos />
                  Hamos
                </Button>
              </div>
            ) : null}
            <Button variant="ghost" disabled={haruka} onClick={() => setAlvu(null)}>
              <IconTaka />
              Kansela
            </Button>
            <Button disabled={haruka} onClick={salva}>
              {edita ? <IconRai /> : <IconAumenta />}
              {haruka ? "Haruka…" : edita ? "Rai mudansa" : "Kria konta"}
            </Button>
          </>
        }
      >
        <Field label="Naran kompletu" htmlFor="fNaran">
          <input
            id="fNaran"
            value={form.naran_kompletu}
            onChange={(e) => setForm({ ...form, naran_kompletu: e.target.value })}
            placeholder="ez. Marcelina da Silva"
          />
        </Field>

        <Row2>
          <Field label="Numeru ID" htmlFor="fNum">
            <input
              id="fNum"
              type="number"
              value={form.numeru_id}
              onChange={(e) => setForm({ ...form, numeru_id: e.target.value })}
              placeholder="ez. 1071"
            />
          </Field>
          <Field label="Sexu" htmlFor="fSexu">
            <select
              id="fSexu"
              value={form.sexu}
              onChange={(e) => setForm({ ...form, sexu: e.target.value as Sexu })}
            >
              <option value="FETO">Feto</option>
              <option value="MANE">Mane</option>
            </select>
          </Field>
        </Row2>

        <Field label="Email (uza atu login)" htmlFor="fEmail">
          <input
            id="fEmail"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="naran@eti.tl"
          />
        </Field>

        <Row2>
          <Field label="Kargu" htmlFor="fKargu">
            <input
              id="fKargu"
              value={form.kargu}
              onChange={(e) => setForm({ ...form, kargu: e.target.value })}
              placeholder="ez. Profesóra Kímika"
            />
          </Field>
          <Field label="Nu. kontaktu" htmlFor="fTel">
            <input
              id="fTel"
              value={form.nu_kontaktu}
              onChange={(e) => setForm({ ...form, nu_kontaktu: e.target.value })}
              placeholder="+670 …"
            />
          </Field>
        </Row2>

        {/*
          HABILITASAUN LITERÁRIA is a heading over two columns on the paper
          roster, so it is a fieldset here rather than one input.
        */}
        <Row2>
          <Field label="Nivel edukasaun" htmlFor="fNivel">
            <select
              id="fNivel"
              value={form.nivel_edukasaun}
              onChange={(e) =>
                setForm({
                  ...form,
                  nivel_edukasaun: e.target.value as NivelEdukasaun | "",
                })
              }
            >
              <option value="">—</option>
              {(konfig?.nivel_edukasaun ?? []).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Aréa estudu" htmlFor="fArea">
            {/*
              A datalist, not a select: the school's own roster spells some
              areas more than one way and new ones appear, so this suggests
              without refusing anything.
            */}
            <input
              id="fArea"
              list="areaEstudu"
              value={form.area_estudu}
              onChange={(e) => setForm({ ...form, area_estudu: e.target.value })}
              placeholder="ez. Gestão Informática"
            />
            <datalist id="areaEstudu">
              {(konfig?.area_estudu_sujere ?? []).map((a) => (
                <option key={a} value={a} />
              ))}
            </datalist>
          </Field>
        </Row2>

        <Field label="Disiplina hanorin" htmlFor="fDisiplina">
          <input
            id="fDisiplina"
            value={form.disiplina_hanorin}
            onChange={(e) =>
              setForm({ ...form, disiplina_hanorin: e.target.value })
            }
            placeholder="ez. Sistema Base de Dados & Tec. Multimedia"
          />
        </Field>

        {edita ? null : (
          <Hint>
            Sistema sei kria password inisiál. Haruka email seidauk funsiona, tan
            ne&apos;e password sei hatudu dala ida de&apos;it iha ekrán — kopia no
            entrega ba profesór hodi login iha aplikasaun móvel.
          </Hint>
        )}
      </Modal>

      <Modal
        open={senha !== null}
        onClose={() => setSenha(null)}
        title={senha?.tipu === "reset" ? "Password foun ✓" : "Konta kria ona ✓"}
        subtitle={
          senha
            ? `${senha.tipu === "reset" ? "Password foun" : "Password inisiál"} ba ${senha.naran}`
            : undefined
        }
        footer={
          <Button
            onClick={() => {
              const tipu = senha?.tipu;
              setSenha(null);
              toast(
                tipu === "reset"
                  ? "Password reset ona ✓"
                  : "Konta profesór kria ona ✓",
              );
            }}
          >
            Hotu
          </Button>
        }
      >
        <div className="flex items-center gap-2">
          {/*
            Masked by default, so the password is not left standing on a
            screen someone else can see. Kopia is unaffected either way: it
            copies `senha.password` straight from state and never reads this
            input, so what lands on the clipboard is the same password whether
            the eye is open or shut.
          */}
          <PasswordInput
            ref={senhaRef}
            readOnly
            hatudu={hatudu}
            onHatudu={setHatudu}
            value={senha?.password ?? ""}
            onFocus={(e) => e.currentTarget.select()}
            autoComplete="off"
            className="font-mono"
          />
          <Button variant="ghost" onClick={kopiaSenha} className="shrink-0">
            {kopiaOk ? "Kopia ona ✓" : "Kopia"}
          </Button>
        </div>
        <Hint>
          Password ne&apos;e sei la aparese fali. Servidor rai de&apos;it nia
          hash, no la iha endpoint atu rekupera — se lakon,{" "}
          {senha?.tipu === "reset"
            ? "presiza halo reset fila fali."
            : "presiza kria konta foun."}
        </Hint>
      </Modal>

      {/*
        Hamos profesór. Stacked on top of the edit modal, so it takes over the
        outside-click: one stray click must not throw away a half-typed
        password.
      */}
      <Modal
        open={hamos !== null}
        onClose={() => setHamos(null)}
        title="Hamos profesór"
        subtitle={hamos ? hamos.naran_kompletu : undefined}
        foraLiur={false}
        larguraMax="460px"
        footer={
          <>
            <Button variant="ghost" disabled={haruka} onClick={() => setHamos(null)}>
              <IconTaka />
              Kansela
            </Button>
            <Button
              tone="bad"
              disabled={haruka || !senhaHanesan}
              onClick={konfirmaHamos}
            >
              <IconHamos />
              {haruka ? "Hamos…" : "Hamos permanente"}
            </Button>
          </>
        }
      >
        <div className="mb-4 rounded-[10px] border border-[color-mix(in_srgb,var(--color-bad)_35%,transparent)] bg-[color-mix(in_srgb,var(--color-bad)_9%,transparent)] px-4 py-3 text-[13.5px] leading-relaxed text-bad">
          Karik ita boot hakarak hamos manorin ho id{" "}
          <strong>{hamos?.numeru_id ?? "###"}</strong> sujere halo backup report
          molok atu delete atu nunee labele akontese buat neebe ita lakoi!
        </div>

        <Hint>
          Hamos sei lakon mós lista prezensa, loron no marka hotu-hotu ho
          sira-nia foto. La bele fila fali.
        </Hint>

        <div className="mt-4">
          <Field label="Password admin" htmlFor="fSenha1">
            <PasswordInput
              id="fSenha1"
              autoComplete="current-password"
              value={senha1}
              onChange={(e) => setSenha1(e.target.value)}
              placeholder="Hatama ita-nia password"
            />
          </Field>
        </div>

        <Field label="Konfirma password" htmlFor="fSenha2">
          <PasswordInput
            id="fSenha2"
            autoComplete="current-password"
            value={senha2}
            onChange={(e) => setSenha2(e.target.value)}
            placeholder="Hatama fila fali"
          />
        </Field>
        {senha2.length > 0 && senha1 !== senha2 ? (
          <p className="mt-1 text-[12.5px] text-bad">Password la hanesan</p>
        ) : null}
      </Modal>

      {/* Reset password — stacked on the edit modal, same as Hamos. */}
      <Modal
        open={reset !== null}
        onClose={() => setReset(null)}
        title="Reset password"
        subtitle={reset ? reset.naran_kompletu : undefined}
        foraLiur={false}
        larguraMax="460px"
        footer={
          <>
            <Button variant="ghost" disabled={haruka} onClick={() => setReset(null)}>
              <IconTaka />
              Kansela
            </Button>
            <Button
              tone="info"
              disabled={haruka || !novaHanesan}
              onClick={konfirmaReset}
            >
              <IconXave />
              {haruka ? "Rai…" : "Rai password foun"}
            </Button>
          </>
        }
      >
        <Hint>
          Profesór ne&apos;ebé lakon password presiza kontaktu admin. Hatama
          password foun iha ne&apos;e, depois entrega ba nia. Sesaun hotu-hotu
          ne&apos;ebé nia loke ona sei taka, entaun nia tenke tama fila fali ho
          password foun.
        </Hint>

        <div className="mt-4">
          <Field label="Password foun" htmlFor="fNova1">
            <PasswordInput
              id="fNova1"
              autoComplete="new-password"
              value={nova1}
              onChange={(e) => setNova1(e.target.value)}
              placeholder="Hatama password foun"
            />
          </Field>
        </div>

        <Field label="Konfirma password foun" htmlFor="fNova2">
          <PasswordInput
            id="fNova2"
            autoComplete="new-password"
            value={nova2}
            onChange={(e) => setNova2(e.target.value)}
            placeholder="Hatama fila fali"
          />
        </Field>
        {nova2.length > 0 && nova1 !== nova2 ? (
          <p className="mt-1 text-[12.5px] text-bad">Password la hanesan</p>
        ) : null}
      </Modal>
    </>
  );
}

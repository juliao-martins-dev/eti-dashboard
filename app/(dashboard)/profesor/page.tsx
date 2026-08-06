"use client";

import { useMemo, useRef, useState } from "react";
import { IconAumenta, IconBuka } from "@/components/icons";
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
import { Panel } from "@/components/ui/Panel";
import { useToast } from "@/components/ui/Toast";
import { mensajenErru } from "@/lib/api";
import { kopia } from "@/lib/kopia";
import { aumentaProfesor, atualizaProfesor, useProfesor } from "@/lib/store";
import type { Sexu, User } from "@/lib/types";

interface Form {
  naran_kompletu: string;
  numeru_id: string;
  sexu: Sexu;
  email: string;
  kargu: string;
  nu_kontaktu: string;
}

const FORM_VAZIU: Form = {
  naran_kompletu: "",
  numeru_id: "",
  sexu: "FETO",
  email: "",
  kargu: "",
  nu_kontaktu: "",
};

/** null = closed · "foun" = create · a User = edit that account. */
type Alvu = null | "foun" | User;

export default function ProfesorPage() {
  const toast = useToast();
  const { profesor, karega, erru } = useProfesor();
  const [buka, setBuka] = useState("");
  const [alvu, setAlvu] = useState<Alvu>(null);
  const [form, setForm] = useState<Form>(FORM_VAZIU);
  const [haruka, setHaruka] = useState(false);
  /** The one-time password from a 201; the server keeps only its hash. */
  const [senha, setSenha] = useState<{ naran: string; password: string } | null>(null);
  const senhaRef = useRef<HTMLInputElement>(null);

  const lista = useMemo(() => {
    const q = buka.trim().toLowerCase();
    if (!q) return profesor;
    return profesor.filter((p) =>
      `${p.naran_kompletu}${p.email}${p.kargu}`.toLowerCase().includes(q),
    );
  }, [profesor, buka]);

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
    };

    setHaruka(true);
    try {
      if (alvu === "foun") {
        const kriadu = await aumentaProfesor(dadus);
        // Straight into the hand-over: closing without reading the password
        // means it is gone for good.
        setSenha({ naran: kriadu.naran_kompletu, password: kriadu.password_inisial });
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
    // Select it either way: on the fallback path this is what the admin can
    // then hit Ctrl+C on, and it makes the click feel like it did something.
    senhaRef.current?.select();
    const ok = await kopia(senha.password);
    toast(
      ok
        ? "Password kopia ona ✓"
        : "La bele kopia otomátiku — password hili ona, uza Ctrl+C",
    );
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

  const edita = alvu !== null && alvu !== "foun";

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative">
          <IconBuka className="pointer-events-none absolute top-1/2 left-[9px] h-[14px] w-[14px] -translate-y-1/2 text-muted" />
          <input
            value={buka}
            onChange={(e) => setBuka(e.target.value)}
            placeholder="Buka naran, email, kargu…"
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
              <Th>Profesór</Th>
              <Th>Nu. ID</Th>
              <Th>Kargu</Th>
              <Th>Kontaktu</Th>
              <Th>Status konta</Th>
            </tr>
          </thead>
          <tbody>
            {erru ? (
              <EmptyRow colSpan={5}>{erru}</EmptyRow>
            ) : karega ? (
              <EmptyRow colSpan={5}>Karega dadus…</EmptyRow>
            ) : lista.length ? (
              lista.map((p) => {
                const ativu = p.is_active ?? true;
                return (
                  <ClickRow key={p.id} onOpen={() => abre(p)}>
                    <Td>
                      <NameCell naran={p.naran_kompletu} sub={p.email} />
                    </Td>
                    <Td className="font-mono">{p.numeru_id}</Td>
                    <Td>{p.kargu || "—"}</Td>
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
              <EmptyRow colSpan={5}>La hetan rezultadu</EmptyRow>
            )}
          </tbody>
        </DataTable>
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
            {edita ? (
              <Button
                variant="ghost"
                className="mr-auto"
                disabled={haruka}
                onClick={() => trokaAtivu(alvu as User)}
              >
                {((alvu as User).is_active ?? true)
                  ? "Dezativa konta"
                  : "Ativa fila fali"}
              </Button>
            ) : null}
            <Button variant="ghost" disabled={haruka} onClick={() => setAlvu(null)}>
              Kansela
            </Button>
            <Button disabled={haruka} onClick={salva}>
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
        title="Konta kria ona ✓"
        subtitle={senha ? `Password inisiál ba ${senha.naran}` : undefined}
        footer={
          <Button
            onClick={() => {
              setSenha(null);
              toast("Konta profesór kria ona ✓");
            }}
          >
            Hotu
          </Button>
        }
      >
        <div className="flex items-center gap-2">
          <input
            ref={senhaRef}
            readOnly
            value={senha?.password ?? ""}
            onFocus={(e) => e.currentTarget.select()}
            className="font-mono"
          />
          <Button variant="ghost" onClick={kopiaSenha}>
            Kopia
          </Button>
        </div>
        <Hint>
          Password ne&apos;e sei la aparese fali. Servidor rai de&apos;it nia hash,
          no la iha endpoint atu rekupera — se lakon, presiza kria konta foun.
        </Hint>
      </Modal>
    </>
  );
}

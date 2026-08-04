"use client";

import { useMemo, useState } from "react";
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
import { aumentaProfesor, atualizaProfesor, useDadus } from "@/lib/store";
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
  const { profesor } = useDadus();
  const [buka, setBuka] = useState("");
  const [alvu, setAlvu] = useState<Alvu>(null);
  const [form, setForm] = useState<Form>(FORM_VAZIU);

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
            kargu: a.kargu,
            nu_kontaktu: a.nu_kontaktu ?? "",
          },
    );
    setAlvu(a);
  }

  function salva() {
    const naran = form.naran_kompletu.trim();
    const numeru = Number(form.numeru_id);
    const email = form.email.trim();

    if (!naran || !numeru || !email) {
      toast("Favor prenxe naran, numeru ID no email");
      return;
    }

    // The API enforces both as unique (accounts.User); mirror it here so the
    // mock never holds a state the server would refuse.
    const sasan = profesor.find(
      (p) =>
        (alvu === "foun" || p.id !== (alvu as User).id) &&
        (p.numeru_id === numeru || p.email.toLowerCase() === email.toLowerCase()),
    );
    if (sasan) {
      toast(
        sasan.numeru_id === numeru
          ? `Numeru ID ${numeru} uza tiha ona husi ${sasan.naran_kompletu}`
          : `Email ne'e uza tiha ona husi ${sasan.naran_kompletu}`,
      );
      return;
    }

    const dadus = {
      numeru_id: numeru,
      naran_kompletu: naran,
      email,
      kargu: form.kargu.trim() || "Profesór/a",
      nu_kontaktu: form.nu_kontaktu.trim() || "—",
      sexu: form.sexu,
    };

    if (alvu === "foun") {
      // The store only, for now — creating the account is a POST that eti-api
      // does not expose yet.
      aumentaProfesor(dadus);
      toast("Konta profesór kria ona ✓");
    } else if (alvu) {
      atualizaProfesor(alvu.id, dadus);
      toast("Dadus profesór atualiza ona ✓");
    }
    setAlvu(null);
  }

  function trokaAtivu(p: User) {
    atualizaProfesor(p.id, { is_active: !(p.is_active ?? true) });
    toast(
      p.is_active ?? true
        ? `Konta ${p.naran_kompletu} dezativa ona`
        : `Konta ${p.naran_kompletu} ativa fila fali ✓`,
    );
    setAlvu(null);
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
              <Th>Estadu konta</Th>
            </tr>
          </thead>
          <tbody>
            {lista.length ? (
              lista.map((p) => {
                const ativu = p.is_active ?? true;
                return (
                  <ClickRow key={p.id} onOpen={() => abre(p)}>
                    <Td>
                      <NameCell naran={p.naran_kompletu} sub={p.email} />
                    </Td>
                    <Td className="font-mono">{p.numeru_id}</Td>
                    <Td>{p.kargu}</Td>
                    <Td className="font-mono text-muted">{p.nu_kontaktu}</Td>
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
            : "Kria konta foun ba aplikasaun ETI PRESENSA"
        }
        footer={
          <>
            {edita ? (
              <Button
                variant="ghost"
                className="mr-auto"
                onClick={() => trokaAtivu(alvu as User)}
              >
                {((alvu as User).is_active ?? true)
                  ? "Dezativa konta"
                  : "Ativa fila fali"}
              </Button>
            ) : null}
            <Button variant="ghost" onClick={() => setAlvu(null)}>
              Kansela
            </Button>
            <Button onClick={salva}>{edita ? "Rai mudansa" : "Kria konta"}</Button>
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
            Sistema sei kria password inisiál no haruka ba email. Profesór uza email +
            password ne&apos;e atu login iha aplikasaun móvel, hodi marka{" "}
            <b>check-in</b> no <b>check-out</b>.
          </Hint>
        )}
      </Modal>
    </>
  );
}

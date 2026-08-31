"use client";

import { useState, type ReactNode } from "react";
import { EvidensiaModal } from "@/components/EvidensiaModal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Hint } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { PunchCard } from "@/components/ui/PunchCard";
import {
  dataDate,
  dataOrasNaran,
  FULAN_NARAN,
  KOLUMNA_LISTA,
  LORON_KURTU,
  lorokraik,
  markaBa,
  oras,
  ORARIU,
  pad,
} from "@/lib/format";
import type { Data, Marka, Prezensa, Profesor } from "@/lib/types";

/**
 * One day of one teacher, opened up: the four punches with their evidence, or
 * the OBS behind a day the administration marked by hand.
 *
 * `prezensa` is null for a teacher who has not marked anything — the same
 * empty row `istoria` builds for an unmarked working day — and that still has
 * four cards worth showing, all of them "Seidauk marka".
 */
export function DetalleModal({
  profesor,
  data,
  prezensa,
  asaun,
  onClose,
}: {
  profesor: Profesor;
  data: Data;
  prezensa: Prezensa | null;
  /** Extra footer buttons, e.g. Prezensa's edit and remove for a leave. */
  asaun?: ReactNode;
  onClose: () => void;
}) {
  const d = dataDate(data);
  const sabadu = d.getDay() === 6;
  const status = prezensa?.status ?? null;
  const rejeitadu = !!prezensa?.rejeisaun_motivu;
  // A rejected day is ABSENT, but it still holds the punches the decision was
  // made from -- and those are precisely what an administrator reviewing the
  // judgement needs to see, so it keeps the cards rather than the OBS note.
  const komMarka = status === null || status === "PRESENT" || rejeitadu;
  /** Which punch is being inspected full size, with the cell it filled. */
  const [evidensia, setEvidensia] = useState<{ marka: Marka; label: string } | null>(
    null,
  );

  return (
    <>
    <Modal
      open
      onClose={onClose}
      // The evidence sits on top; without this one Escape would close both.
      eskape={evidensia === null}
      title={profesor.naran_kompletu}
      subtitle={
        <>
          {LORON_KURTU[d.getDay()]}, {pad(d.getDate())}{" "}
          {FULAN_NARAN[d.getMonth() + 1]} {d.getFullYear()}
          {status ? (
            <>
              {" · "}
              <Badge status={status} />
            </>
          ) : null}
        </>
      }
      footer={
        <>
          {asaun}
          <Button variant="ghost" onClick={onClose}>
            Taka
          </Button>
        </>
      }
    >
      {rejeitadu ? (
        <div className="rounded-[10px] border border-[color-mix(in_srgb,var(--color-bad)_35%,transparent)] bg-[color-mix(in_srgb,var(--color-bad)_9%,transparent)] px-[13px] py-[11px] text-[12.5px] leading-relaxed text-bad">
          <b className="block text-[13px]">
            Prezensa rejeita — {prezensa?.rejeisaun_motivu_display}
          </b>
          {prezensa?.rejeisaun_obs ? (
            <span className="mt-[3px] block">{prezensa.rejeisaun_obs}</span>
          ) : null}
          <span className="mt-[5px] block opacity-80">
            Husi {prezensa?.rejeita_husi_naran ?? "—"}
            {prezensa?.rejeita_iha
              ? ` · ${dataOrasNaran(prezensa.rejeita_iha)}`
              : ""}
          </span>
        </div>
      ) : null}

      {komMarka ? (
        <>
          <div className="grid grid-cols-2 gap-[10px]">
            {KOLUMNA_LISTA.map((k) => (
              <PunchCard
                key={k.kolumna}
                label={k.label}
                orariu={oras(ORARIU[k.kolumna])}
                marka={markaBa(prezensa, k.kolumna)}
                semSesaun={sabadu && lorokraik(k.kolumna)}
                onEvidensia={(marka) => setEvidensia({ marka, label: k.label })}
              />
            ))}
          </div>
          <Hint>
            Marka ida-idak rai ho foto no koordenada GPS — evidénsia ne&apos;ebé troka
            asinatura iha livru papél. Klik foto ka fatin atu haree boot.
          </Hint>
        </>
      ) : (
        <Hint>
          <b>OBS:</b> {prezensa?.obs || "—"}
        </Hint>
      )}
    </Modal>

    {evidensia ? (
      <EvidensiaModal
        profesor={profesor}
        data={data}
        label={evidensia.label}
        marka={evidensia.marka}
        onClose={() => setEvidensia(null)}
      />
    ) : null}
    </>
  );
}

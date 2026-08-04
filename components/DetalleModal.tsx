"use client";

import type { ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Hint } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { PunchCard } from "@/components/ui/PunchCard";
import {
  dataDate,
  FULAN_NARAN,
  KOLUMNA_LISTA,
  LORON_KURTU,
  lorokraik,
  oras,
  ORARIU,
  pad,
} from "@/lib/format";
import { markaBa } from "@/lib/mock-data";
import type { Data, Prezensa, Profesor } from "@/lib/types";

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
  const estadu = prezensa?.estadu ?? null;
  const komMarka = estadu === null || estadu === "PREZENTE";

  return (
    <Modal
      open
      onClose={onClose}
      title={profesor.naran_kompletu}
      subtitle={
        <>
          {LORON_KURTU[d.getDay()]}, {pad(d.getDate())}{" "}
          {FULAN_NARAN[d.getMonth() + 1]} {d.getFullYear()}
          {estadu ? (
            <>
              {" · "}
              <Badge estadu={estadu} />
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
              />
            ))}
          </div>
          <Hint>
            Marka ida-idak rai ho foto no koordenada GPS — evidénsia ne&apos;ebé troka
            asinatura iha livru papél.
          </Hint>
        </>
      ) : (
        <Hint>
          <b>OBS:</b> {prezensa?.obs || "—"}
        </Hint>
      )}
    </Modal>
  );
}

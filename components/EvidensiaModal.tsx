"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { cx } from "@/lib/cx";
import { dataDate, dataNaran, LORON_KURTU, oras } from "@/lib/format";
import type { Data, Marka, Profesor } from "@/lib/types";

/**
 * The proof behind one punch: the photo taken at the moment, and where the
 * phone was standing. This is the evidence that replaced the signature in the
 * paper book, so it is worth being able to look at properly rather than as a
 * 26px icon.
 */
export function EvidensiaModal({
  profesor,
  data,
  label,
  marka,
  onClose,
}: {
  profesor: Profesor;
  data: Data;
  /** "Dader Tama" and friends — which cell of the sheet this filled. */
  label: string;
  marka: Marka;
  onClose: () => void;
}) {
  const d = dataDate(data);
  const lat = Number(marka.latitude);
  const lon = Number(marka.longitude);
  const koordenadaOk = Number.isFinite(lat) && Number.isFinite(lon);

  // A small box around the point; OpenStreetMap needs no key, which matters
  // for a deployment that may never see the public internet.
  const raiu = 0.0015;
  const mapa = koordenadaOk
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${lon - raiu},${lat - raiu},${lon + raiu},${lat + raiu}&layer=mapnik&marker=${lat},${lon}`
    : null;
  const mapaLink = koordenadaOk
    ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=18/${lat}/${lon}`
    : null;

  const ihaEskola = marka.iha_eskola;
  const distansia = Math.round(marka.distansia_metru ?? 0);

  return (
    <Modal
      open
      onClose={onClose}
      larguraMax="560px"
      title={profesor.naran_kompletu}
      subtitle={
        <>
          {label} · {LORON_KURTU[d.getDay()]}, {dataNaran(data)} {d.getFullYear()}
        </>
      }
      footer={
        <>
          {mapaLink ? (
            <a
              href={mapaLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mr-auto inline-flex items-center gap-[7px] rounded-[8px] border border-border bg-surface px-[14px] py-2 text-[13px] font-semibold text-text hover:border-accent hover:text-accent"
            >
              Loke iha mapa
            </a>
          ) : null}
          <Button variant="ghost" onClick={onClose}>
            Taka
          </Button>
        </>
      }
    >
      {/* The photo, given the room it needs. `unoptimized` because the URL is
          on whichever host serves eti-api, and that address moves. */}
      <div className="relative h-[280px] w-full overflow-hidden rounded-[10px] border border-border bg-bg">
        {marka.foto ? (
          <Image
            src={marka.foto}
            alt={`Foto marka ${label} — ${profesor.naran_kompletu}`}
            fill
            unoptimized
            sizes="560px"
            className="object-contain"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[13px] text-muted">
            La iha foto ba marka ne&apos;e
          </div>
        )}
      </div>

      {/* The verdict first, because it is the one thing an admin is checking. */}
      <div
        className={cx(
          "flex items-center justify-between rounded-[8px] border px-[11px] py-[9px] text-[12.5px] font-semibold",
          ihaEskola
            ? "border-[color-mix(in_srgb,var(--color-ok)_40%,transparent)] bg-[color-mix(in_srgb,var(--color-ok)_9%,transparent)] text-ok"
            : "border-[color-mix(in_srgb,var(--color-warn)_40%,transparent)] bg-[color-mix(in_srgb,var(--color-warn)_9%,transparent)] text-warn",
        )}
      >
        <span>{ihaEskola ? "Iha eskola" : "Dook husi eskola"}</span>
        <span className="font-mono">{distansia} m</span>
      </div>

      {mapa ? (
        <div className="h-[210px] w-full overflow-hidden rounded-[10px] border border-border bg-bg">
          <iframe
            title={`Fatin marka ${label}`}
            src={mapa}
            loading="lazy"
            className="h-full w-full border-0"
          />
        </div>
      ) : null}

      <div className="rounded-[10px] border border-border bg-bg px-3 py-1">
        <Kv naran="Oras marka">
          <b className={cx("font-mono", marka.atrazadu && "text-warn")}>
            {oras(marka.oras)}
            {marka.atrazadu ? (
              <span className="font-sans text-[11px]"> atrazadu</span>
            ) : null}
          </b>
        </Kv>
        <Kv naran="Oras orariu">
          <b className="font-mono">{oras(marka.oras_orariu)}</b>
        </Kv>
        <Kv naran="Sesaun">
          <b>
            {marka.sesaun_display} {marka.tipu_display}
          </b>
        </Kv>
        <Kv naran="Koordenada">
          <b className="font-mono text-[12px]">
            {koordenadaOk ? `${marka.latitude}, ${marka.longitude}` : "—"}
          </b>
        </Kv>
        <Kv naran="Presizaun GPS">
          {/* eti-mobile never sends it, so this is usually empty — see plan.md §10 #6. */}
          <b className="font-mono">
            {marka.presizaun !== null ? `${Math.round(marka.presizaun)} m` : "—"}
          </b>
        </Kv>
      </div>
    </Modal>
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

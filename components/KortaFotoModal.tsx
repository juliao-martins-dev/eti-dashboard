"use client";

import { useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
// The package styles itself with class names and injects nothing, so without
// this import the cropper renders as a bare unpositioned image.
import "react-easy-crop/react-easy-crop.css";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { kortaFoto } from "@/lib/korta-foto";

/**
 * Frame the photo before it is uploaded.
 *
 * The avatar is a circle everywhere it appears, so the crop is locked square
 * with a round overlay — what the admin frames here is exactly what the
 * sidebar will show, rather than a rectangle the CSS quietly centre-crops.
 */
export function KortaFotoModal({
  src,
  haruka = false,
  onKansela,
  onProntu,
}: {
  /** An object URL for the file the admin picked. */
  src: string;
  /** True while the upload is in flight. */
  haruka?: boolean;
  onKansela: () => void;
  onProntu: (foto: File) => void;
}) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [erru, setErru] = useState<string | null>(null);
  const [korta, setKorta] = useState(false);

  async function konfirma() {
    if (!area) return;
    setErru(null);
    setKorta(true);
    try {
      onProntu(await kortaFoto(src, area));
    } catch (e) {
      setErru(e instanceof Error ? e.message : "La bele prosesa imajen");
    } finally {
      setKorta(false);
    }
  }

  const okupadu = korta || haruka;

  return (
    <Modal
      open
      onClose={onKansela}
      larguraMax="440px"
      // Framing is work in progress: a stray click on the backdrop or a
      // reflexive Escape should not throw it away. Only ✕, Kansela or Rai
      // close this one.
      eskape={false}
      foraLiur={false}
      title="Korta foto"
      subtitle="Book imajen no uza zoom atu hili parte ne'ebé sei sai avatar"
      footer={
        <>
          <Button variant="ghost" disabled={okupadu} onClick={onKansela}>
            Kansela
          </Button>
          <Button disabled={okupadu || !area} onClick={konfirma}>
            {haruka ? "Haruka…" : korta ? "Prepara…" : "Rai foto"}
          </Button>
        </>
      }
    >
      {/* react-easy-crop fills its parent absolutely, so the parent has to
          carry the size and the positioning context. */}
      <div className="relative h-[300px] w-full overflow-hidden rounded-[10px] bg-[rgba(8,6,4,0.92)]">
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          restrictPosition
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={(_, pixels) => setArea(pixels)}
        />
      </div>

      <label className="flex items-center gap-3 text-[12px] font-semibold text-muted">
        Zoom
        <input
          type="range"
          min={1}
          max={4}
          step={0.01}
          value={zoom}
          aria-label="Zoom"
          onChange={(e) => setZoom(Number(e.target.value))}
          className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-border accent-accent p-0"
        />
      </label>

      {erru ? (
        <p
          role="alert"
          className="rounded-[8px] border border-[color-mix(in_srgb,var(--color-bad)_40%,transparent)] bg-[color-mix(in_srgb,var(--color-bad)_9%,transparent)] px-[11px] py-[9px] text-[12px] font-medium text-bad"
        >
          {erru}
        </p>
      ) : null}
    </Modal>
  );
}

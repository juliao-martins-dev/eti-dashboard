"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { IconAntes, IconTaka, IconTuir } from "@/components/icons";

export interface Imajen {
  src: string;
  /** Shown under the photo; also the alt text. */
  naran?: string;
}

/**
 * A photo at full size over everything else.
 *
 * Takes a list rather than a single image so the same viewer can carry the
 * four punch photos of a day later; with one image the arrows and the counter
 * stay out of the way.
 */
export function Lightbox({
  imajen,
  inisiu = 0,
  onClose,
}: {
  imajen: Imajen[];
  inisiu?: number;
  onClose: () => void;
}) {
  const [i, setI] = useState(inisiu);
  const total = imajen.length;
  const atual = imajen[Math.min(i, total - 1)];

  useEffect(() => {
    const tekla = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (total < 2) return;
      if (e.key === "ArrowLeft") setI((n) => (n - 1 + total) % total);
      if (e.key === "ArrowRight") setI((n) => (n + 1) % total);
    };
    // The page behind must not scroll while a full-screen photo is up.
    const overflowTuan = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    addEventListener("keydown", tekla);
    return () => {
      document.body.style.overflow = overflowTuan;
      removeEventListener("keydown", tekla);
    };
  }, [onClose, total]);

  if (!atual || typeof document === "undefined") return null;

  const botaun =
    "rounded-full bg-white/10 p-2 text-white/75 backdrop-blur-sm transition-colors hover:bg-white/20 hover:text-white";

  return createPortal(
    /*
     * Rendered into <body>, not where it is written. The sidebar that opens
     * this carries a `translate`, and any non-initial translate makes an
     * element the containing block for its fixed descendants — so inset-0
     * would have covered the 218px sidebar instead of the viewport.
     */
    <div
      role="dialog"
      aria-modal="true"
      aria-label={atual.naran ?? "Foto"}
      // Above the modals, which sit at z-50.
      className="fixed inset-0 z-[60] flex animate-fade items-center justify-center bg-[rgba(8,6,4,0.82)] p-4 backdrop-blur-[3px] sm:p-8"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Taka"
        className={`absolute top-4 right-4 z-10 ${botaun}`}
      >
        <IconTaka className="h-5 w-5" />
      </button>

      {/* Shrinks to the photo, so the caption tracks the image rather than
          floating at the bottom of the screen. */}
      <figure className="flex animate-pop flex-col items-center gap-3">
        <div className="relative h-[68vh] w-[86vw] max-w-[680px] overflow-hidden rounded-[14px] bg-white/5 ring-1 ring-white/15 shadow-[0_24px_70px_rgba(0,0,0,0.55)]">
          <Image
            key={atual.src}
            src={atual.src}
            alt={atual.naran ?? "Foto"}
            fill
            unoptimized
            sizes="(min-width: 680px) 680px, 86vw"
            className="object-contain"
            priority
          />
        </div>

        {atual.naran ? (
          <figcaption className="max-w-[86vw] truncate text-center text-[13px] font-medium text-white/85">
            {atual.naran}
            {total > 1 ? (
              <span className="ml-2 font-mono text-white/50">
                {i + 1}/{total}
              </span>
            ) : null}
          </figcaption>
        ) : null}
      </figure>

      {total > 1 ? (
        <>
          <button
            type="button"
            aria-label="Foto molok"
            onClick={() => setI((n) => (n - 1 + total) % total)}
            className={`absolute top-1/2 left-3 -translate-y-1/2 ${botaun}`}
          >
            <IconAntes className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Foto tuir"
            onClick={() => setI((n) => (n + 1) % total)}
            className={`absolute top-1/2 right-3 -translate-y-1/2 ${botaun}`}
          >
            <IconTuir className="h-5 w-5" />
          </button>
        </>
      ) : null}
    </div>,
    document.body,
  );
}

"use client";

import { useEffect, useState } from "react";
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

  if (!atual) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={atual.naran ?? "Foto"}
      // Above the modals, which sit at z-50.
      className="fixed inset-0 z-[60] flex animate-fade flex-col items-center justify-center gap-4 bg-[rgba(10,8,6,0.88)] p-5"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Taka"
        className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white/80 backdrop-blur-sm hover:bg-white/20 hover:text-white"
      >
        <IconTaka className="h-5 w-5" />
      </button>

      <div className="relative h-[74vh] w-[92vw] max-w-[860px]">
        <Image
          key={atual.src}
          src={atual.src}
          alt={atual.naran ?? "Foto"}
          fill
          unoptimized
          sizes="92vw"
          className="animate-pop object-contain"
          priority
        />
      </div>

      {atual.naran ? (
        <p className="max-w-[92vw] truncate text-center text-[13px] font-medium text-white/85">
          {atual.naran}
          {total > 1 ? (
            <span className="ml-2 font-mono text-white/55">
              {i + 1}/{total}
            </span>
          ) : null}
        </p>
      ) : null}

      {total > 1 ? (
        <>
          <button
            type="button"
            aria-label="Foto molok"
            onClick={() => setI((n) => (n - 1 + total) % total)}
            className="absolute top-1/2 left-3 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white/80 hover:bg-white/20 hover:text-white"
          >
            <IconAntes className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Foto tuir"
            onClick={() => setI((n) => (n + 1) % total)}
            className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white/80 hover:bg-white/20 hover:text-white"
          >
            <IconTuir className="h-5 w-5" />
          </button>
        </>
      ) : null}
    </div>
  );
}

import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import type { Estadu } from "@/lib/types";

export type Tone = "ok" | "bad" | "info" | "viol" | "muted";

/**
 * Written out per tone rather than built from a template, because Tailwind
 * only emits classes it can read as whole strings in the source.
 */
const KOR: Record<Tone, string> = {
  ok: "text-ok bg-[color-mix(in_srgb,var(--color-ok)_11%,transparent)]",
  bad: "text-bad bg-[color-mix(in_srgb,var(--color-bad)_11%,transparent)]",
  info: "text-info bg-[color-mix(in_srgb,var(--color-info)_11%,transparent)]",
  viol: "text-viol bg-[color-mix(in_srgb,var(--color-viol)_11%,transparent)]",
  muted: "text-muted bg-bg",
};

const ESTADU_TONE: Record<Estadu, Tone> = {
  PREZENTE: "ok",
  FALTA: "bad",
  LISENSA: "info",
  MISAUN: "viol",
  FERIADU: "muted",
};

export function Badge({
  estadu,
  tone,
  children,
  className,
}: {
  /** Picks both the colour and, unless children say otherwise, the label. */
  estadu?: Estadu;
  /** For labels that are not an attendance state, such as an account status. */
  tone?: Tone;
  children?: ReactNode;
  className?: string;
}) {
  const kor = tone ?? (estadu ? ESTADU_TONE[estadu] : "muted");
  return (
    <span
      className={cx(
        "inline-block rounded-[99px] px-[9px] py-[3px] text-[11px] font-semibold",
        KOR[kor],
        className,
      )}
    >
      {children ?? estadu}
    </span>
  );
}

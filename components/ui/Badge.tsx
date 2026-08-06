import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import type { Status } from "@/lib/types";

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

const STATUS_TONE: Record<Status, Tone> = {
  PRESENT: "ok",
  ABSENT: "bad",
  LEAVE: "info",
  MISSION: "viol",
  HOLIDAY: "muted",
};

/**
 * The stored values are English, the interface is Tetun. Callers that pass no
 * children get the label, never the raw value — `status_display` from the API
 * says the same thing, but a badge should not need the whole row to render.
 */
export const STATUS_NARAN: Record<Status, string> = {
  PRESENT: "Prezente",
  ABSENT: "Falta",
  LEAVE: "Lisensa",
  MISSION: "Misaun",
  HOLIDAY: "Feriadu",
};

export function Badge({
  status,
  tone,
  children,
  className,
}: {
  /** Picks both the colour and, unless children say otherwise, the label. */
  status?: Status;
  /** For labels that are not an attendance state, such as an account status. */
  tone?: Tone;
  children?: ReactNode;
  className?: string;
}) {
  const kor = tone ?? (status ? STATUS_TONE[status] : "muted");
  return (
    <span
      className={cx(
        "inline-block rounded-[99px] px-[9px] py-[3px] text-[11px] font-semibold",
        KOR[kor],
        className,
      )}
    >
      {children ?? (status ? STATUS_NARAN[status] : null)}
    </span>
  );
}

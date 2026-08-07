import type { ButtonHTMLAttributes } from "react";
import { cx } from "@/lib/cx";

/** What the action means, not what colour it is. */
export type ButtonTone = "accent" | "ok" | "warn" | "bad" | "info";

/**
 * Written out per tone rather than composed from a template, because Tailwind
 * only emits classes it can read as whole strings in the source.
 */
const SOLID: Record<ButtonTone, string> = {
  accent: "bg-accent text-white hover:brightness-[1.06]",
  ok: "bg-ok text-white hover:brightness-[1.06]",
  warn: "bg-warn text-white hover:brightness-[1.06]",
  bad: "bg-bad text-white hover:brightness-[1.06]",
  info: "bg-info text-white hover:brightness-[1.06]",
};

const GHOST: Record<ButtonTone, string> = {
  accent: "border-border bg-surface text-text hover:border-accent hover:text-accent",
  ok: "border-border bg-surface text-ok hover:border-ok hover:bg-[color-mix(in_srgb,var(--color-ok)_10%,transparent)]",
  warn: "border-border bg-surface text-warn hover:border-warn hover:bg-[color-mix(in_srgb,var(--color-warn)_10%,transparent)]",
  bad: "border-border bg-surface text-bad hover:border-bad hover:bg-[color-mix(in_srgb,var(--color-bad)_10%,transparent)]",
  info: "border-border bg-surface text-info hover:border-info hover:bg-[color-mix(in_srgb,var(--color-info)_10%,transparent)]",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "solid" | "ghost";
  tone?: ButtonTone;
};

export function Button({
  variant = "solid",
  tone = "accent",
  className,
  ...props
}: Props) {
  return (
    <button
      {...props}
      className={cx(
        "inline-flex items-center gap-[7px] rounded-[8px] px-[14px] py-2 text-[13px] font-semibold transition-colors",
        "[&_svg]:h-[14px] [&_svg]:w-[14px] [&_svg]:shrink-0",
        // Without this a disabled button looks exactly like a live one, which
        // matters most on the destructive actions.
        "disabled:pointer-events-none disabled:opacity-55",
        variant === "solid" ? SOLID[tone] : cx("border", GHOST[tone]),
        className,
      )}
    />
  );
}

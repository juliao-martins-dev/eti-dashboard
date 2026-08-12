"use client";

import { useState, type InputHTMLAttributes, type Ref } from "react";
import { IconMatan, IconMatanTaka } from "@/components/icons";
import { cx } from "@/lib/cx";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  ref?: Ref<HTMLInputElement>;
  /**
   * Lift the toggle when the caller has to reveal the value itself — the
   * hand-over card does exactly that when the clipboard is unavailable and
   * the password has to be selected for a manual Ctrl+C.
   *
   * Left undefined the component keeps its own state, which is what the
   * ordinary "type a new password" fields want.
   */
  hatudu?: boolean;
  onHatudu?: (hatudu: boolean) => void;
};

/**
 * A password field with an eye to reveal what was typed.
 *
 * Masking here is `type="password"` on the real value, not a substitute
 * string: the input always holds the actual password, so anything reading it
 * — a copy button, the confirm-match check, the form — sees the same thing
 * whether the eye is open or shut. Only the rendering changes.
 */
export function PasswordInput({
  hatudu,
  onHatudu,
  className,
  ...props
}: Props) {
  const [interno, setInterno] = useState(false);
  // Controlled when the caller passes `hatudu`, uncontrolled otherwise.
  const kontroladu = hatudu !== undefined;
  const aberta = kontroladu ? hatudu : interno;

  return (
    <div className="relative">
      <input
        {...props}
        type={aberta ? "text" : "password"}
        // Room for the button, so a long password never runs under the eye.
        className={cx("pr-[36px]", className)}
      />
      <button
        type="button"
        onClick={() => (kontroladu ? onHatudu?.(!aberta) : setInterno(!aberta))}
        aria-label={aberta ? "Subar password" : "Hatudu password"}
        title={aberta ? "Subar password" : "Hatudu password"}
        aria-pressed={aberta}
        className="absolute top-1/2 right-[5px] -translate-y-1/2 rounded-[6px] p-[5px] text-muted transition-colors hover:bg-bg hover:text-text"
      >
        {aberta ? (
          <IconMatanTaka className="h-4 w-4" />
        ) : (
          <IconMatan className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}

"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { IconTaka } from "@/components/icons";

/**
 * The prototype kept one overlay in the DOM and toggled `display`. Here the
 * modal is mounted only while open, which replays the pop animation on every
 * open exactly as toggling the class did.
 */
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  eskape = true,
  foraLiur = true,
  larguraMax = "520px",
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /**
   * Set false while a modal is stacked on top of this one: both listen on the
   * window, so one Escape would otherwise dismiss the pair at once.
   */
  eskape?: boolean;
  /**
   * Set false when a stray click outside must not throw away work in progress
   * — the dialog then closes only from its own ✕ or buttons.
   */
  foraLiur?: boolean;
  larguraMax?: string;
}) {
  useEffect(() => {
    if (!open || !eskape) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [open, eskape, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    /*
     * Rendered into <body>, not where it is written. The sidebar carries a
     * `translate` for its drawer, and any non-initial transform makes an
     * element the containing block for its fixed descendants — so a modal
     * opened from the admin chip was laying itself out inside the 218px
     * sidebar instead of over the viewport.
     */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(20,15,10,0.45)] p-5"
      onClick={(e) => {
        if (foraLiur && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        style={{ maxWidth: larguraMax }}
        className="max-h-[88vh] w-full animate-pop overflow-auto rounded-[14px] border border-border bg-surface"
      >
        <header className="flex items-center justify-between gap-3 border-b border-border px-[18px] py-[14px]">
          <div className="min-w-0">
            <h3 className="text-[15px]">{title}</h3>
            {subtitle ? (
              <small className="mt-[2px] block text-[12px] font-normal text-muted">
                {subtitle}
              </small>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Taka"
            className="shrink-0 rounded-[6px] p-1 text-muted hover:bg-bg hover:text-text"
          >
            <IconTaka className="h-4 w-4" />
          </button>
        </header>

        <div className="flex flex-col gap-3 px-[18px] py-4">{children}</div>

        {footer ? (
          <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-[18px] py-[13px]">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

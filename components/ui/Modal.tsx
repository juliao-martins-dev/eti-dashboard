"use client";

import { useEffect, type ReactNode } from "react";
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

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(20,15,10,0.45)] p-5"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        style={{ maxWidth: larguraMax }}
        className="max-h-[88vh] w-full animate-pop overflow-auto rounded-[14px] border border-border bg-surface"
      >
        <header className="flex items-center justify-between border-b border-border px-[18px] py-[14px]">
          <div>
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
            className="rounded-[6px] p-1 text-muted hover:bg-bg hover:text-text"
          >
            <IconTaka className="h-4 w-4" />
          </button>
        </header>

        <div className="flex flex-col gap-3 px-[18px] py-4">{children}</div>

        {footer ? (
          <footer className="flex justify-end gap-2 border-t border-border px-[18px] py-[13px]">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}

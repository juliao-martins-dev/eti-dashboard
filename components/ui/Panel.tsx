import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

export function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "overflow-hidden rounded-card border border-border bg-surface",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PanelTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h3
      className={cx(
        "flex items-center justify-between gap-2 border-b border-border px-4 py-3 text-[13px]",
        className,
      )}
    >
      {children}
    </h3>
  );
}

/** The two-column body of Painel and Konfigurasaun: 1fr / 1.4fr, stacked under 900px. */
export function Grid2({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "grid grid-cols-1 gap-[14px] min-[900px]:grid-cols-[1fr_1.4fr]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="p-[26px] text-center text-[13px] text-muted">{children}</div>;
}

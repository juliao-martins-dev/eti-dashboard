import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

/** The auto-fitting row of cards above Painel and Relatóriu. */
export function StatCards({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "mb-4 grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function StatCard({
  k,
  v,
  sub,
}: {
  /** The uppercase caption. */
  k: string;
  v: ReactNode;
  /** The muted tail of the value, e.g. "/ 8" or "%". */
  sub?: ReactNode;
}) {
  return (
    <div className="rounded-card border border-border bg-surface px-4 py-[14px]">
      <div className="text-[11.5px] font-semibold tracking-[0.05em] text-muted uppercase">
        {k}
      </div>
      <div className="mt-1 font-brand text-[26px] font-bold">
        {v}
        {/* No space before it — the prototype prints "6/ 8" flush. */}
        {sub ? <small className="text-[13px] font-medium text-muted">{sub}</small> : null}
      </div>
    </div>
  );
}

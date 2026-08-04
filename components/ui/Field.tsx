import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

export function Field({
  label,
  htmlFor,
  children,
  className,
}: {
  label: ReactNode;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label
        htmlFor={htmlFor}
        className="mb-[5px] block text-[12px] font-semibold text-muted"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

/** Two fields side by side inside a modal body. */
export function Row2({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-[10px]">{children}</div>;
}

/** The dashed explanatory box under a form. */
export function Hint({ children }: { children: ReactNode }) {
  return (
    <div
      className={cx(
        "rounded-[8px] border border-dashed border-border bg-bg px-[11px] py-[9px] text-[12px] text-muted",
      )}
    >
      {children}
    </div>
  );
}

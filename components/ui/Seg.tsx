import { cx } from "@/lib/cx";

/** The segmented control used by the toolbars and by Konfigurasaun's mode switch. */
export function Seg<T extends string>({
  options,
  value,
  onChange,
  className,
  ariaLabel,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cx(
        "inline-flex gap-[2px] rounded-[8px] border border-border bg-surface p-[2px]",
        className,
      )}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
          className={cx(
            "rounded-[6px] px-[11px] py-[5px] text-[12.5px]",
            o.value === value
              ? "bg-soft font-semibold text-accent"
              : "font-medium text-muted",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

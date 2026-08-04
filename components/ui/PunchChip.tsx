import { cx } from "@/lib/cx";
import { oras as fmtOras } from "@/lib/format";
import type { Marka } from "@/lib/types";

/**
 * A punch time as it appears in a grid cell. Late arrivals turn amber and
 * gain a dot — the prototype drew that dot with ::before; here it is a real
 * element, which lands in the same place because the chip is a flex row with
 * a 5px gap.
 */
export function PunchChip({
  marka,
  className,
}: {
  marka: Pick<Marka, "oras" | "atrazadu">;
  className?: string;
}) {
  const atrazadu = Boolean(marka.atrazadu);
  return (
    <span
      className={cx(
        "inline-flex items-center gap-[5px] rounded-[6px] border px-[7px] py-[2px] font-mono text-[12px] whitespace-nowrap",
        atrazadu
          ? "border-[color-mix(in_srgb,var(--color-warn)_40%,transparent)] bg-[color-mix(in_srgb,var(--color-warn)_9%,transparent)] text-warn"
          : "border-border bg-bg",
        className,
      )}
    >
      {atrazadu ? (
        <i className="h-[5px] w-[5px] rounded-full bg-warn" aria-hidden="true" />
      ) : null}
      {fmtOras(marka.oras)}
    </span>
  );
}

import { IconFoto, IconGeo } from "@/components/icons";
import { cx } from "@/lib/cx";
import { oras as fmtOras } from "@/lib/format";
import type { Marka } from "@/lib/types";

/**
 * One cell of the paper grid, opened up: what time was scheduled, what time
 * was punched, and the evidence that replaced the signature.
 */
export function PunchCard({
  label,
  orariu,
  marka,
  semSesaun,
}: {
  label: string;
  /** The scheduled time printed in that column's header, "08:00". */
  orariu: string;
  marka: Marka | null;
  /** Saturday afternoon — there is no session to miss. */
  semSesaun?: boolean;
}) {
  const atrazadu = Boolean(marka?.atrazadu);

  return (
    <div className="rounded-[10px] border border-border bg-bg px-3 py-[10px]">
      <div className="flex justify-between text-[11px] font-semibold tracking-[0.05em] text-muted uppercase">
        {label}
        <span>{orariu}</span>
      </div>

      <div
        className={cx(
          "mt-[5px] mb-[7px] font-mono text-[20px] font-semibold",
          !marka && "text-muted",
          atrazadu && "text-warn",
        )}
      >
        {marka ? fmtOras(marka.oras) : "—"}
        {atrazadu ? (
          <>
            {" "}
            <span className="font-sans text-[11px]">atrazadu</span>
          </>
        ) : null}
      </div>

      {marka ? (
        <div className="flex items-center gap-[7px] text-[11.5px] text-muted [&_svg]:h-[13px] [&_svg]:w-[13px]">
          <span className="flex h-[26px] w-[26px] items-center justify-center rounded-[6px] border border-border bg-surface text-muted">
            <IconFoto />
          </span>
          Foto
          <span
            className={cx(
              "flex items-center gap-1",
              marka.iha_eskola ? "text-ok" : "text-warn",
            )}
          >
            <IconGeo />
            {marka.iha_eskola ? "Iha eskola" : "Dook husi eskola"} ·{" "}
            {Math.round(marka.distansia_metru ?? 0)} m
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-[7px] text-[11.5px] text-muted">
          {semSesaun ? "La iha sesaun (Sábadu)" : "Seidauk marka"}
        </div>
      )}
    </div>
  );
}

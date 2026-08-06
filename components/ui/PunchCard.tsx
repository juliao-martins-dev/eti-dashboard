import { IconFoto, IconGeo } from "@/components/icons";
import { cx } from "@/lib/cx";
import { oras as fmtOras } from "@/lib/format";
import type { Marka } from "@/lib/types";

/**
 * One cell of the paper grid, opened up: what time was scheduled, what time
 * was punched, and the evidence that replaced the signature.
 *
 * With `onEvidensia` the photo and the geofence line become buttons that open
 * that evidence full size.
 */
export function PunchCard({
  label,
  orariu,
  marka,
  semSesaun,
  onEvidensia,
}: {
  label: string;
  /** The scheduled time printed in that column's header, "08:00". */
  orariu: string;
  marka: Marka | null;
  /** Saturday afternoon — there is no session to miss. */
  semSesaun?: boolean;
  onEvidensia?: (marka: Marka) => void;
}) {
  const atrazadu = Boolean(marka?.atrazadu);
  const loke = marka && onEvidensia ? () => onEvidensia(marka) : undefined;

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
          <button
            type="button"
            onClick={loke}
            disabled={!loke}
            title="Haree foto no fatin"
            aria-label={`Haree evidénsia ${label}`}
            className={cx(
              "flex items-center gap-[7px] rounded-[6px]",
              loke && "hover:text-text",
            )}
          >
            <span
              className={cx(
                "flex h-[26px] w-[26px] items-center justify-center rounded-[6px] border border-border bg-surface",
                loke && "hover:border-accent hover:text-accent",
              )}
            >
              <IconFoto />
            </span>
            Foto
          </button>

          <button
            type="button"
            onClick={loke}
            disabled={!loke}
            title="Haree fatin iha mapa"
            aria-label={`Haree fatin ${label}`}
            className={cx(
              "flex items-center gap-1 rounded-[6px]",
              marka.iha_eskola ? "text-ok" : "text-warn",
              loke && "underline decoration-transparent underline-offset-2 hover:decoration-current",
            )}
          >
            <IconGeo />
            {marka.iha_eskola ? "Iha eskola" : "Dook husi eskola"} ·{" "}
            {Math.round(marka.distansia_metru ?? 0)} m
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-[7px] text-[11.5px] text-muted">
          {semSesaun ? "La iha sesaun (Sábadu)" : "Seidauk marka"}
        </div>
      )}
    </div>
  );
}

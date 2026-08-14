"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cx } from "@/lib/cx";

/** Which edge of the trigger the bubble grows from. */
export type LadoTip = "right" | "top";

/**
 * How long the pointer rests before the bubble appears. Long enough that
 * sweeping the cursor down the rail does not fire four tooltips on the way
 * past, short enough that someone who stopped to read is not kept waiting.
 */
const ATRAZU = 350;

/** Gap between the trigger and the bubble, leaving room for the arrow. */
const FOLIN = 10;

interface Fatin {
  top: number;
  left: number;
}

/**
 * A tooltip that takes the accent from Konfigurasaun.
 *
 * Nothing here reads the colour: `bg-accent` resolves `--color-accent` off
 * <html>, which is the same variable the accent picker rewrites — so changing
 * the colour there recolours every tooltip on the next paint, with no state
 * to keep in step.
 *
 * Returned as props plus a node rather than as a wrapper component, so it can
 * go onto an existing `<Link>` or `<button>` without adding an element that
 * would disturb the flex layouts it sits in.
 */
export function useTooltip(
  label: ReactNode,
  { ativu = true, lado = "right" as LadoTip } = {},
) {
  const id = useId();
  const [fatin, setFatin] = useState<Fatin | null>(null);
  const tempu = useRef<number | null>(null);

  function limpa() {
    if (tempu.current !== null) {
      clearTimeout(tempu.current);
      tempu.current = null;
    }
  }

  function taka() {
    limpa();
    setFatin(null);
  }

  function medi(el: HTMLElement): Fatin {
    const r = el.getBoundingClientRect();
    return lado === "top"
      ? { top: r.top - FOLIN, left: r.left + r.width / 2 }
      : { top: r.top + r.height / 2, left: r.right + FOLIN };
  }

  // Position is taken when the pointer arrives rather than when the bubble
  // opens: the trigger cannot have moved in between, and reading layout on a
  // timer would be a forced reflow for nothing.
  function loke(el: HTMLElement, agora: boolean) {
    limpa();
    const f = medi(el);
    if (agora) setFatin(f);
    else tempu.current = window.setTimeout(() => setFatin(f), ATRAZU);
  }

  useEffect(() => {
    if (!fatin) return;
    const foraDeSitiu = () => setFatin(null);
    const tekla = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFatin(null);
    };
    // Capture, so a scroll in any pane closes it — a fixed bubble measured
    // against the old position would otherwise float away from its trigger.
    addEventListener("scroll", foraDeSitiu, true);
    addEventListener("keydown", tekla);
    return () => {
      removeEventListener("scroll", foraDeSitiu, true);
      removeEventListener("keydown", tekla);
    };
  }, [fatin]);

  // A tooltip left open when its trigger unmounts would hang on screen.
  useEffect(() => limpa, []);

  const props = ativu
    ? {
        "aria-describedby": fatin ? id : undefined,
        onPointerEnter: (e: PointerEvent<HTMLElement>) => {
          // Touch is excluded deliberately: a tap would both open the bubble
          // and follow the link, leaving it stranded over the new screen.
          if (e.pointerType === "mouse") loke(e.currentTarget, false);
        },
        onPointerLeave: taka,
        // Clicking has answered the question the tooltip was answering.
        onPointerDown: taka,
        onFocus: (e: FocusEvent<HTMLElement>) => {
          // :focus-visible, so it appears for the keyboard but not in the
          // wake of a mouse click, which focuses too.
          if (e.currentTarget.matches(":focus-visible")) loke(e.currentTarget, true);
        },
        onBlur: taka,
      }
    : {};

  const tooltip =
    ativu && fatin && typeof document !== "undefined"
      ? createPortal(
          /*
           * Into <body>, not where it is written. The sidebar carries a
           * translate for its drawer, and any non-initial transform makes an
           * element the containing block for its fixed descendants — a bubble
           * left inside would be positioned against the 68px rail.
           */
          <div
            role="tooltip"
            id={id}
            style={{ top: fatin.top, left: fatin.left }}
            className={cx(
              // Above the modals at z-50 and the lightbox at z-60: a tooltip
              // is never the thing being covered.
              "pointer-events-none fixed z-[70]",
              lado === "top"
                ? "-translate-x-1/2 -translate-y-full"
                : "-translate-y-1/2",
            )}
          >
            {/* The anchoring translate is on the wrapper above, so this one is
                free to animate without the two cancelling out. */}
            <div className="relative animate-tip rounded-[8px] bg-accent px-[10px] py-[6px] text-[12px] font-semibold whitespace-nowrap text-white shadow-[0_6px_20px_rgba(0,0,0,0.22)]">
              {label}
              <span
                aria-hidden="true"
                className={cx(
                  "absolute h-[8px] w-[8px] rotate-45 bg-accent",
                  lado === "top"
                    ? "bottom-[-3px] left-1/2 -translate-x-1/2"
                    : "top-1/2 left-[-3px] -translate-y-1/2",
                )}
              />
            </div>
          </div>,
          document.body,
        )
      : null;

  return { props, tooltip };
}

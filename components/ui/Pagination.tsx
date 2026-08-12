"use client";

import { IconAntes, IconTuir } from "@/components/icons";
import { cx } from "@/lib/cx";
import type { Pajinasaun } from "@/lib/pajina";

/**
 * The page numbers to render, with gaps collapsed.
 *
 * A month for the whole school is around 1 500 rows, which is 300 pages at
 * five a page — printing every number would be a wall of digits, so only the
 * two ends and the neighbourhood of the current page survive.
 */
function janela(atual: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const numeru = new Set<number>([1, total]);
  for (let p = atual - 1; p <= atual + 1; p++) {
    if (p > 1 && p < total) numeru.add(p);
  }

  const saida: (number | "gap")[] = [];
  let antes = 0;
  for (const n of [...numeru].sort((a, b) => a - b)) {
    if (antes && n - antes > 1) saida.push("gap");
    saida.push(n);
    antes = n;
  }
  return saida;
}

const botaun =
  "flex h-[28px] min-w-[28px] items-center justify-center rounded-[7px] border px-2 text-[12.5px] font-medium transition-colors disabled:pointer-events-none disabled:opacity-40";

/**
 * Sits inside the Panel, under the table it belongs to.
 *
 * The count is shown even when there is a single page: "12 husi 12" answers
 * "is this everything?", which is the question a paginated table always
 * raises and the reason a bare set of arrows is not enough.
 */
export function Pagination<T>({
  pajina: p,
  naran = "rezultadu",
  className,
}: {
  pajina: Pajinasaun<T>;
  /** What is being counted, for the range label. */
  naran?: string;
  className?: string;
}) {
  if (p.total === 0) return null;

  return (
    <nav
      aria-label="Pajinasaun"
      className={cx(
        "flex flex-wrap items-center justify-between gap-3 border-t border-border px-[14px] py-[10px]",
        className,
      )}
    >
      <span className="text-[12.5px] text-muted">
        <b className="font-mono font-semibold text-text">
          {p.husi}–{p.too}
        </b>{" "}
        husi <b className="font-mono font-semibold text-text">{p.total}</b>{" "}
        {naran}
      </span>

      {p.totalPajina > 1 ? (
        <div className="flex items-center gap-[5px]">
          <button
            type="button"
            onClick={() => p.vai(p.pajina - 1)}
            disabled={p.pajina === 1}
            aria-label="Pájina molok"
            className={cx(botaun, "border-border text-muted hover:border-accent hover:text-accent")}
          >
            <IconAntes className="h-[14px] w-[14px]" />
          </button>

          {janela(p.pajina, p.totalPajina).map((n, i) =>
            n === "gap" ? (
              <span
                key={`gap${i}`}
                aria-hidden="true"
                className="px-[2px] text-[12.5px] text-muted"
              >
                …
              </span>
            ) : (
              <button
                key={n}
                type="button"
                onClick={() => p.vai(n)}
                aria-label={`Pájina ${n}`}
                aria-current={n === p.pajina ? "page" : undefined}
                className={cx(
                  botaun,
                  n === p.pajina
                    ? "border-accent bg-accent font-semibold text-white"
                    : "border-border text-muted hover:border-accent hover:text-accent",
                )}
              >
                {n}
              </button>
            ),
          )}

          <button
            type="button"
            onClick={() => p.vai(p.pajina + 1)}
            disabled={p.pajina === p.totalPajina}
            aria-label="Pájina tuir"
            className={cx(botaun, "border-border text-muted hover:border-accent hover:text-accent")}
          >
            <IconTuir className="h-[14px] w-[14px]" />
          </button>
        </div>
      ) : null}
    </nav>
  );
}

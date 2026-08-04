import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

export function DataTable({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <table
      className={cx(
        "w-full border-collapse text-[13px] [&_tr:last-child_td]:border-b-0",
        className,
      )}
    >
      {children}
    </table>
  );
}

/** `sub` is the scheduled time printed under a column header ("08:00"). */
export function Th({
  children,
  sub,
  className,
  colSpan,
}: {
  children?: ReactNode;
  sub?: string;
  className?: string;
  colSpan?: number;
}) {
  return (
    <th
      colSpan={colSpan}
      className={cx(
        "border-b border-border px-[14px] py-[9px] text-left text-[11px] font-semibold tracking-[0.05em] whitespace-nowrap text-muted uppercase",
        className,
      )}
    >
      {children}
      {sub ? (
        <small className="mt-px block font-mono text-[10px] tracking-normal normal-case opacity-75">
          {sub}
        </small>
      ) : null}
    </th>
  );
}

export function Td({
  children,
  className,
  colSpan,
}: {
  children?: ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td
      colSpan={colSpan}
      className={cx("border-b border-border px-[14px] py-[9px] align-middle", className)}
    >
      {children}
    </td>
  );
}

/**
 * A row that opens something. Keyboard reachable, but it stays a plain <tr>
 * rather than taking role="button", which would cost the table its semantics.
 */
export function ClickRow({
  onOpen,
  children,
}: {
  onOpen: () => void;
  children: ReactNode;
}) {
  return (
    <tr
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className="cursor-pointer hover:bg-soft"
    >
      {children}
    </tr>
  );
}

/** The two-line cell used for every person in the app: name over a caption. */
export function NameCell({
  naran,
  sub,
  subClassName,
}: {
  naran: ReactNode;
  sub?: ReactNode;
  subClassName?: string;
}) {
  return (
    <>
      <b className="block font-semibold">{naran}</b>
      {sub ? (
        <small className={cx("text-[11.5px] text-muted", subClassName)}>{sub}</small>
      ) : null}
    </>
  );
}

/** A full-width "nothing here" row inside a table body. */
export function EmptyRow({
  colSpan,
  children,
}: {
  colSpan: number;
  children: ReactNode;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="p-[26px] text-center text-[13px] text-muted">
        {children}
      </td>
    </tr>
  );
}

import type { ButtonHTMLAttributes } from "react";
import { cx } from "@/lib/cx";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "solid" | "ghost";
};

export function Button({ variant = "solid", className, ...props }: Props) {
  return (
    <button
      {...props}
      className={cx(
        "inline-flex items-center gap-[7px] rounded-[8px] px-[14px] py-2 text-[13px] font-semibold [&_svg]:h-[14px] [&_svg]:w-[14px]",
        variant === "solid"
          ? "bg-accent text-white hover:brightness-[1.06]"
          : "border border-border bg-surface text-text hover:border-accent hover:text-accent",
        className,
      )}
    />
  );
}

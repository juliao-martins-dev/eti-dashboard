"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/lib/auth";
import {
  IconPainel,
  IconPrezensa,
  IconProfesor,
  IconRelatoriu,
} from "@/components/icons";
import { useToast } from "@/components/ui/Toast";
import { cx } from "@/lib/cx";
import { ADMIN } from "@/lib/mock-data";

// Konfigurasaun is deliberately absent: it lives in the admin chip menu at the
// foot of the sidebar, next to logout, rather than beside the daily screens.
const NAV = [
  { href: "/", label: "Painel", Icon: IconPainel },
  { href: "/profesor", label: "Profesór sira", Icon: IconProfesor },
  { href: "/prezensa", label: "Prezensa", Icon: IconPrezensa },
  { href: "/relatoriu", label: "Relatóriu", Icon: IconRelatoriu },
] as const;

const inisiais = (naran: string) =>
  naran
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-[218px] shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex items-center gap-[10px] border-b border-border px-4 pt-[18px] pb-[14px]">
        <Image
          src="/icon.png"
          alt="Escola Técnica Informática Dili"
          width={32}
          height={32}
          priority
          className="h-8 w-8 shrink-0"
        />
        <div className="min-w-0">
          <b className="block font-brand text-[15px] tracking-[0.02em]">
            ETI PRESENSA
          </b>
          <span className="mt-[3px] flex items-center gap-[6px] text-[11px] text-muted">
            <i className="inline-block h-[7px] w-[7px] shrink-0 rounded-full bg-accent" />
            Painel Administrasaun
          </span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-[2px] px-2 py-[10px]">
        {NAV.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cx(
                "flex w-full items-center gap-[10px] rounded-[8px] px-[10px] py-[9px] text-left",
                active
                  ? "bg-soft font-semibold text-accent"
                  : "font-medium text-muted hover:bg-bg hover:text-text",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <UserChip />
    </aside>
  );
}

/**
 * The admin chip opens a small menu: profile view, a jump to Konfigurasaun,
 * and a logout that only toasts — there is no session to end until the API
 * arrives, but the affordance is where it will live.
 */
function UserChip() {
  const router = useRouter();
  const toast = useToast();
  const [abertu, setAbertu] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abertu) return;
    const taka = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setAbertu(false);
    };
    const eskape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbertu(false);
    };
    addEventListener("mousedown", taka);
    addEventListener("keydown", eskape);
    return () => {
      removeEventListener("mousedown", taka);
      removeEventListener("keydown", eskape);
    };
  }, [abertu]);

  const item =
    "w-full rounded-[6px] px-[10px] py-[7px] text-left text-[12.5px] font-medium text-muted hover:bg-bg hover:text-text";

  return (
    <div ref={ref} className="relative border-t border-border p-3">
      {abertu ? (
        <div className="absolute bottom-full left-3 z-40 mb-1 w-[calc(100%-24px)] animate-pop rounded-[10px] border border-border bg-surface p-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
          <div className="border-b border-border px-[10px] pt-[7px] pb-2">
            <b className="block text-[12.5px]">{ADMIN.naran_kompletu}</b>
            <small className="block text-[11px] text-muted">{ADMIN.email}</small>
            <small className="block text-[11px] text-muted">{ADMIN.kargu}</small>
          </div>
          <button
            type="button"
            className={item}
            onClick={() => {
              setAbertu(false);
              router.push("/konfig");
            }}
          >
            Konfigurasaun
          </button>
          <button
            type="button"
            className={item}
            onClick={() => {
              setAbertu(false);
              logout();
              router.replace("/login");
              toast("Sai husi sistema ✓");
            }}
          >
            Sai (logout)
          </button>
        </div>
      ) : null}

      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={abertu}
        onClick={() => setAbertu((a) => !a)}
        className="flex w-full items-center gap-[9px] rounded-[8px] p-1 text-left hover:bg-bg"
      >
        <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-accent font-brand text-[12px] font-semibold text-white">
          {inisiais(ADMIN.naran_kompletu)}
        </div>
        <div>
          <b className="text-[12.5px]">{ADMIN.naran_kompletu}</b>
          <small className="block text-[11px] text-muted">
            {ADMIN.role} · ETI-Dili
          </small>
        </div>
      </button>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  IconPainel,
  IconPrezensa,
  IconProfesor,
  IconRelatoriu,
} from "@/components/icons";
import { useToast } from "@/components/ui/Toast";
import { mensajenErru } from "@/lib/api";
import { atualizaFoto, logout, useSesaun } from "@/lib/auth";
import { cx } from "@/lib/cx";

/** Anything larger is a phone original; the API has no upload limit of its own. */
const FOTO_MAX = 5 * 1024 * 1024;

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

/**
 * The profile photo, or initials on the accent circle until there is one.
 *
 * `unoptimized` because `foto` is an absolute URL on whichever host is serving
 * eti-api — that address changes between networks, and routing a 30px avatar
 * through the image optimiser would mean pinning every host in next.config.
 */
function Avatar({
  foto,
  naran,
  tamañu,
}: {
  foto: string | null;
  naran: string;
  tamañu: number;
}) {
  if (foto) {
    return (
      <Image
        src={foto}
        alt={naran}
        width={tamañu}
        height={tamañu}
        unoptimized
        className="shrink-0 rounded-full object-cover"
        style={{ width: tamañu, height: tamañu }}
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      style={{ width: tamañu, height: tamañu }}
      className="flex shrink-0 items-center justify-center rounded-full bg-accent font-brand text-[12px] font-semibold text-white"
    >
      {inisiais(naran)}
    </div>
  );
}

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
 * The admin chip: their own photo, and a menu to replace it, jump to
 * Konfigurasaun or sign out.
 */
function UserChip() {
  const router = useRouter();
  const toast = useToast();
  const sesaun = useSesaun();
  const [abertu, setAbertu] = useState(false);
  const [haruka, setHaruka] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const foneRef = useRef<HTMLInputElement>(null);

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

  // The profile cached at login; the guard sends you to /login without one.
  const naran = sesaun?.naran_kompletu ?? "…";

  async function trokaFoto(e: ChangeEvent<HTMLInputElement>) {
    const foto = e.target.files?.[0];
    // Clear it either way, so picking the same file again after a failure
    // still fires a change event.
    e.target.value = "";
    if (!foto) return;

    if (!foto.type.startsWith("image/")) {
      toast("Presiza hili imajen ida");
      return;
    }
    if (foto.size > FOTO_MAX) {
      toast("Foto boot liu — máximu 5 MB");
      return;
    }

    setHaruka(true);
    try {
      await atualizaFoto(foto);
      toast("Foto atualiza ona ✓");
    } catch (err) {
      toast(mensajenErru(err));
    } finally {
      setHaruka(false);
    }
  }

  return (
    <div ref={ref} className="relative border-t border-border p-3">
      {abertu ? (
        <div className="absolute bottom-full left-3 z-40 mb-1 w-[calc(100%-24px)] animate-pop rounded-[10px] border border-border bg-surface p-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
          <div className="flex items-center gap-[9px] border-b border-border px-[10px] pt-[7px] pb-2">
            <Avatar foto={sesaun?.foto ?? null} naran={naran} tamañu={36} />
            <div className="min-w-0">
              <b className="block truncate text-[12.5px]">{naran}</b>
              <small className="block truncate text-[11px] text-muted">
                {sesaun?.email}
              </small>
              {sesaun?.kargu ? (
                <small className="block truncate text-[11px] text-muted">
                  {sesaun.kargu}
                </small>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            className={item}
            disabled={haruka}
            onClick={() => {
              setAbertu(false);
              foneRef.current?.click();
            }}
          >
            {haruka ? "Haruka foto…" : sesaun?.foto ? "Troka foto" : "Aumenta foto"}
          </button>
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
              // Blacklists the refresh token server-side, then clears locally.
              void logout().then(() => router.replace("/login"));
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
        <Avatar foto={sesaun?.foto ?? null} naran={naran} tamañu={30} />
        <div className="min-w-0">
          <b className="block truncate text-[12.5px]">{naran}</b>
          <small className="block text-[11px] text-muted">
            {sesaun?.role_display ?? sesaun?.role ?? "ADMIN"} · ETI-Dili
          </small>
        </div>
      </button>

      {/* Lives outside the menu so the picker survives the menu closing. */}
      <input
        ref={foneRef}
        type="file"
        accept="image/*"
        hidden
        onChange={trokaFoto}
      />
    </div>
  );
}

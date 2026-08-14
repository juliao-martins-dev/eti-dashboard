"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  IconAntes,
  IconFoto,
  IconKonfigurasaun,
  IconPainel,
  IconPrezensa,
  IconProfesor,
  IconRelatoriu,
  IconSai,
  IconTuir,
} from "@/components/icons";
import { KortaFotoModal } from "@/components/KortaFotoModal";
import { Lightbox } from "@/components/ui/Lightbox";
import { useToast } from "@/components/ui/Toast";
import { mensajenErru } from "@/lib/api";
import { atualizaFoto, logout, useSesaun } from "@/lib/auth";
import { cx } from "@/lib/cx";
import { setKolapsu, useKolapsu } from "@/lib/sidebar";

/** Anything larger is a phone original; the API has no upload limit of its own. */
const FOTO_MAX = 5 * 1024 * 1024;

// Konfigurasaun is deliberately absent: it lives in the admin chip menu at the
// foot of the sidebar, next to logout, rather than beside the daily screens.
const NAV = [
  { href: "/", label: "Panel", Icon: IconPainel },
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

/**
 * Below `md` the sidebar is an off-canvas drawer the topbar's menu button
 * opens; from `md` up it is the sticky column it has always been, pixel for
 * pixel. The desktop classes all sit behind the `md:` prefix so nothing about
 * the wide layout changes.
 */
export function Sidebar({
  abertu = false,
  onClose,
}: {
  abertu?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const kolapsu = useKolapsu();

  useEffect(() => {
    if (!abertu) return;

    const eskape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };

    // Hold the page still behind the drawer; content scrolling under an open
    // overlay is what makes a drawer feel loose on a phone.
    const overflowTuan = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Crossing into the desktop layout turns the drawer back into the
    // permanent sidebar, so the overlay state has to go with it — otherwise
    // the backdrop and the scroll lock stay behind.
    const luan = matchMedia("(min-width: 48rem)");
    const kresi = (e: MediaQueryListEvent) => {
      if (e.matches) onClose?.();
    };

    addEventListener("keydown", eskape);
    luan.addEventListener("change", kresi);
    return () => {
      document.body.style.overflow = overflowTuan;
      removeEventListener("keydown", eskape);
      luan.removeEventListener("change", kresi);
    };
  }, [abertu, onClose]);

  return (
    <>
      {/* Only ever on top of a narrow screen; `md:hidden` keeps it out of the
          way of the desktop layout entirely. */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cx(
          "fixed inset-0 z-40 bg-[rgba(20,15,10,0.45)] transition-opacity md:hidden",
          // Matched to the panel so the dimming and the slide land together.
          abertu
            ? "opacity-100 duration-300 ease-out"
            : "pointer-events-none opacity-0 duration-200 ease-in",
        )}
      />

      <aside
        className={cx(
          "fixed top-0 left-0 z-50 flex h-screen w-[218px] shrink-0 flex-col border-r border-border bg-surface",
          // Transform *and* visibility: `visibility` is discrete but keeps the
          // panel visible for the whole slide out, flipping only at the end —
          // which is also what keeps a closed drawer out of the tab order.
          // Shadow is in the list so the depth fades rather than snapping.
          "transition-[transform,visibility,box-shadow]",
          // `md:left-auto` matters: a sticky element with left:0 would also
          // stick sideways the moment a wide table scrolls the page.
          "md:sticky md:left-auto md:z-auto md:visible md:translate-x-0 md:shadow-none",
          // Desktop no longer opts out of transitions entirely — the rail
          // needs its width animated. Only width, so the drawer's slide is
          // still governed by the mobile rules above.
          "md:transition-[width] md:duration-200 md:ease-out",
          // The rail is desktop-only: below `md` the sidebar is a drawer that
          // is either open or gone, and it always opens at full width.
          kolapsu ? "md:w-[68px]" : "md:w-[218px]",
          // Asymmetric on purpose: entering decelerates over 300ms so it feels
          // like it settles, leaving accelerates out in 200ms so dismissing
          // never feels like waiting.
          abertu
            ? "translate-x-0 shadow-[0_10px_40px_rgba(0,0,0,0.18)] duration-300 ease-out"
            : "invisible -translate-x-full duration-200 ease-in",
        )}
      >
      <div
        className={cx(
          "flex items-center gap-[10px] border-b border-border px-4 pt-[18px] pb-[14px]",
          // Centred on the rail so the mark sits over the icon column below.
          kolapsu && "md:justify-center md:px-0",
        )}
      >
        <Image
          src="/icon.png"
          alt="Escola Técnica Informática Dili"
          width={32}
          height={32}
          priority
          className="h-8 w-8 shrink-0"
        />
        <div className={cx("min-w-0", kolapsu && "md:hidden")}>
          <b className="block font-brand text-[15px] tracking-[0.02em]">
            ETI PREZENSA
          </b>
          <span className="mt-[3px] flex items-center gap-[6px] text-[11px] text-muted">
            <i className="inline-block h-[7px] w-[7px] shrink-0 rounded-full bg-accent" />
            Panel Administrasaun
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
              // Closing on navigation rather than on a pathname effect: the
              // drawer covers the page it just moved to.
              onClick={onClose}
              aria-current={active ? "page" : undefined}
              // The only thing naming the screen once the label is gone.
              title={kolapsu ? label : undefined}
              className={cx(
                "flex w-full items-center gap-[10px] rounded-[8px] px-[10px] py-[9px] text-left",
                kolapsu && "md:justify-center md:px-0",
                active
                  ? "bg-soft font-semibold text-accent"
                  : "font-medium text-muted hover:bg-bg hover:text-text",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {/* sr-only rather than hidden: the rail is a visual shorthand,
                  and a screen reader still needs to hear where the link goes. */}
              <span className={cx(kolapsu && "md:sr-only")}>{label}</span>
            </Link>
          );
        })}

        {/*
          The control the admin decides with. It lives at the foot of the nav
          rather than in the header because it has to be reachable in both
          states, and the header has no room for it once collapsed.

          `hidden md:flex`: there is nothing to collapse on a phone.
        */}
        <button
          type="button"
          onClick={() => setKolapsu(!kolapsu)}
          aria-pressed={kolapsu}
          title={kolapsu ? "Loke menu" : "Taka menu"}
          className={cx(
            "mt-auto hidden w-full items-center gap-[10px] rounded-[8px] px-[10px] py-[9px] text-left font-medium text-muted md:flex hover:bg-bg hover:text-text",
            kolapsu && "md:justify-center md:px-0",
          )}
        >
          {kolapsu ? (
            <IconTuir className="h-4 w-4 shrink-0" />
          ) : (
            <IconAntes className="h-4 w-4 shrink-0" />
          )}
          <span className={cx(kolapsu && "md:sr-only")}>Taka menu</span>
        </button>
      </nav>

        <UserChip kolapsu={kolapsu} />
      </aside>
    </>
  );
}

/**
 * The admin chip: their own photo, and a menu to replace it, jump to
 * Konfigurasaun or sign out.
 */
function UserChip({ kolapsu }: { kolapsu: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const sesaun = useSesaun();
  const [abertu, setAbertu] = useState(false);
  const [haruka, setHaruka] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  /** Object URL of the picked file while it is being framed, else null. */
  const [korta, setKorta] = useState<string | null>(null);
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

  // A picked file that is never framed — or one left open when the sidebar
  // unmounts at logout — would otherwise hold its blob until the tab closes.
  useEffect(() => {
    return () => {
      if (korta) URL.revokeObjectURL(korta);
    };
  }, [korta]);

  // Same gap as the nav items above, so the two icon columns line up.
  const item =
    "flex w-full items-center gap-[10px] rounded-[6px] px-[10px] py-[7px] text-left text-[12.5px] font-medium text-muted hover:bg-bg hover:text-text";

  // The profile cached at login; the guard sends you to /login without one.
  const naran = sesaun?.naran_kompletu ?? "…";

  /** Picking a file only opens the cropper; nothing is uploaded until framed. */
  function hiliFoto(e: ChangeEvent<HTMLInputElement>) {
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

    setAbertu(false);
    setKorta(URL.createObjectURL(foto));
  }

  function takaKorta() {
    setKorta((url) => {
      if (url) URL.revokeObjectURL(url);
      return null;
    });
  }

  async function salvaFoto(foto: File) {
    setHaruka(true);
    try {
      await atualizaFoto(foto);
      takaKorta();
      toast("Foto atualiza ona ✓");
    } catch (err) {
      toast(mensajenErru(err));
    } finally {
      setHaruka(false);
    }
  }

  return (
    <div ref={ref} className="relative border-t border-border p-3">
      {/*
        On the rail the chip is 44px wide, so a menu sized to its parent would
        be unreadable — it takes a fixed width there and overhangs the sidebar,
        which is what a rail flyout is supposed to do.
      */}
      {abertu ? (
        <div
          className={cx(
            "absolute bottom-full left-3 z-40 mb-1 w-[calc(100%-24px)] animate-pop rounded-[10px] border border-border bg-surface p-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)]",
            kolapsu && "md:w-[228px]",
          )}
        >
          <div className="flex items-center gap-[10px] border-b border-border px-[10px] pt-[9px] pb-[10px]">
            <div className="relative shrink-0">
              {/* The photo opens full size; the badge beside it replaces the
                  photo. Siblings, not nested, so neither swallows the other. */}
              <button
                type="button"
                onClick={() => sesaun?.foto && setLightbox(true)}
                disabled={!sesaun?.foto}
                aria-label={sesaun?.foto ? "Haree foto boot" : undefined}
                title={sesaun?.foto ? "Haree foto boot" : undefined}
                className={cx(
                  "block rounded-full",
                  sesaun?.foto && "cursor-zoom-in hover:brightness-95",
                )}
              >
                <Avatar foto={sesaun?.foto ?? null} naran={naran} tamañu={44} />
              </button>
              {/* The ring in --surface cuts the badge out of the avatar, so it
                  reads as attached rather than dropped on top. */}
              <button
                type="button"
                disabled={haruka}
                onClick={() => foneRef.current?.click()}
                aria-label={sesaun?.foto ? "Troka foto" : "Aumenta foto"}
                title={sesaun?.foto ? "Troka foto" : "Aumenta foto"}
                className={cx(
                  "absolute -right-[3px] -bottom-[3px] flex h-[19px] w-[19px] items-center justify-center rounded-full border-2 border-surface bg-accent text-white",
                  "[&_svg]:h-[10px] [&_svg]:w-[10px]",
                  haruka
                    ? "animate-pulse cursor-default"
                    : "hover:brightness-[1.08] active:scale-95",
                )}
              >
                <IconFoto />
              </button>
            </div>
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
            onClick={() => {
              setAbertu(false);
              router.push("/konfig");
            }}
          >
            <IconKonfigurasaun className="h-4 w-4 shrink-0" />
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
            <IconSai className="h-4 w-4 shrink-0" />
            Sai (logout)
          </button>
        </div>
      ) : null}

      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={abertu}
        onClick={() => setAbertu((a) => !a)}
        title={kolapsu ? naran : undefined}
        className={cx(
          "flex w-full items-center gap-[9px] rounded-[8px] p-1 text-left hover:bg-bg",
          kolapsu && "md:justify-center",
        )}
      >
        <Avatar foto={sesaun?.foto ?? null} naran={naran} tamañu={30} />
        <div className={cx("min-w-0", kolapsu && "md:hidden")}>
          <b className="block truncate text-[12.5px]">{naran}</b>
          <small className="block text-[11px] text-muted">
            {sesaun?.role_display ?? sesaun?.role ?? "ADMIN"} · ETI-Dili
          </small>
        </div>
      </button>

      {lightbox && sesaun?.foto ? (
        <Lightbox
          imajen={[{ src: sesaun.foto, naran }]}
          onClose={() => setLightbox(false)}
        />
      ) : null}

      {korta ? (
        <KortaFotoModal
          src={korta}
          haruka={haruka}
          onKansela={takaKorta}
          onProntu={salvaFoto}
        />
      ) : null}

      {/* Lives outside the menu so the picker survives the menu closing. */}
      <input
        ref={foneRef}
        type="file"
        accept="image/*"
        hidden
        onChange={hiliFoto}
      />
    </div>
  );
}

"use client";

/**
 * Copy from a selection, synchronously.
 *
 * Deliberately not transparent and not `display:none`: a node that is not
 * rendered, or is fully see-through, cannot hold a selection the copy command
 * will act on. Off-screen to the left is the one placement that stays
 * selectable without flashing on screen or scrolling the page.
 */
function viaSelesaun(texto: string): boolean {
  let kaixa: HTMLTextAreaElement | null = null;
  try {
    kaixa = document.createElement("textarea");
    kaixa.value = texto;
    kaixa.setAttribute("readonly", "");
    kaixa.style.position = "fixed";
    kaixa.style.left = "-9999px";
    kaixa.style.top = "0";
    kaixa.style.fontSize = "16px"; // iOS zooms the page under 16px.
    document.body.appendChild(kaixa);

    // Give the user their own selection back afterwards.
    const selesaun = document.getSelection();
    const antes = selesaun && selesaun.rangeCount ? selesaun.getRangeAt(0) : null;

    kaixa.focus({ preventScroll: true });
    kaixa.select();
    kaixa.setSelectionRange(0, texto.length);

    const ok = document.execCommand("copy");

    if (antes && selesaun) {
      selesaun.removeAllRanges();
      selesaun.addRange(antes);
    }
    return ok;
  } catch {
    return false;
  } finally {
    kaixa?.remove();
  }
}

/**
 * Copy text, reporting whether it actually reached the clipboard.
 *
 * The synchronous path runs **first**, and that ordering is the whole point.
 * Copying needs the browser's transient user activation, and that activation
 * is spent the instant the handler awaits anything — so reaching for the
 * promise-based Clipboard API first leaves the fallback running without a
 * gesture, where it fails silently. `execCommand` is deprecated but it is also
 * the only path that works on a plain-HTTP origin, which is how this dashboard
 * is served on the school LAN; `navigator.clipboard` does not even exist there.
 */
export async function kopia(texto: string): Promise<boolean> {
  if (!texto) return false;

  if (viaSelesaun(texto)) return true;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
  } catch {
    // Insecure origin, denied permission, or the document lost focus.
  }
  return false;
}

"use client";

/**
 * Copy text to the clipboard, and say honestly whether it worked.
 *
 * `navigator.clipboard` only exists in a secure context — HTTPS or localhost.
 * This dashboard is served over plain HTTP on the school LAN, so on every
 * machine that is not the dev box the modern API is simply undefined, and the
 * older `execCommand` path is the one that actually runs.
 *
 * Returns false rather than throwing, so the caller can tell the user to copy
 * by hand instead of showing a success message for a copy that never happened.
 */
export async function kopia(texto: string): Promise<boolean> {
  if (!texto) return false;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
  } catch {
    // Blocked by permissions or an insecure origin; try the old way.
  }

  try {
    const kaixa = document.createElement("textarea");
    kaixa.value = texto;
    kaixa.setAttribute("readonly", "");
    // Off-screen but still selectable — `display:none` cannot be selected,
    // and a visible element would flash.
    kaixa.style.position = "fixed";
    kaixa.style.top = "-1000px";
    kaixa.style.opacity = "0";
    document.body.appendChild(kaixa);

    kaixa.select();
    kaixa.setSelectionRange(0, texto.length);
    const ok = document.execCommand("copy");

    document.body.removeChild(kaixa);
    return ok;
  } catch {
    return false;
  }
}

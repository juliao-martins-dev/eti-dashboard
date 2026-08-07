"use client";

/** The pixel rectangle react-easy-crop reports for the chosen area. */
export interface AreaPixel {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * An avatar is never shown larger than 44px, so anything past this is bytes
 * over the school network for nothing. It also keeps the upload well under the
 * size the API would otherwise accept without complaint.
 */
const LADU_MAX = 512;
const KUALIDADE = 0.9;

function karegaImajen(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", () => reject(new Error("La bele loke imajen")));
    img.src = src;
  });
}

/**
 * Cut the chosen square out of the original and hand back a JPEG ready to
 * upload. Encoded as JPEG deliberately: a phone photo re-encoded as PNG comes
 * out several times larger for no visible gain on a 44px circle.
 */
export async function kortaFoto(
  src: string,
  area: AreaPixel,
  naran = "foto.jpg",
): Promise<File> {
  const img = await karegaImajen(src);

  const eskala = Math.min(1, LADU_MAX / Math.max(area.width, area.height));
  const larguz = Math.max(1, Math.round(area.width * eskala));
  const altura = Math.max(1, Math.round(area.height * eskala));

  const canvas = document.createElement("canvas");
  canvas.width = larguz;
  canvas.height = altura;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("La bele prosesa imajen");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    img,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    larguz,
    altura,
  );

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", KUALIDADE),
  );
  if (!blob) throw new Error("La bele prosesa imajen");

  return new File([blob], naran, { type: "image/jpeg" });
}

/**
 * The prototype's mock data, ported to the API's own shapes.
 *
 * The generator below is a faithful port of the one in
 * docs/eti-admin-dashboard.html — same seed, same order of random draws — so
 * the times on screen are the times the approved design showed. What changed
 * is the output: instead of a flat `{dt, df, lt, lf}` record it builds
 * `Prezensa` rows with real `Marka` children, so replacing this module with
 * fetch() calls will not touch a single component.
 */

import { dataDate, iso, LORON_API, ORARIU, pad } from "./format";
import type {
  Data,
  Estadu,
  Kolumna,
  Marka,
  OhinHotu,
  Prezensa,
  PrezensaProfesor,
  Profesor,
  Sesaun,
  Tipu,
  User,
} from "./types";

/** The day the prototype was frozen on; the whole mock is built around it. */
export const TODAY: Data = "2026-08-04";
export const TINAN = 2026;

/** School coordinates — `ESKOLA_LATITUDE` / `ESKOLA_LONGITUDE` defaults. */
const ESKOLA = { latitude: -8.552336, longitude: 125.541603 };
/** Metres per degree of latitude, to place a punch at its stated distance. */
const METRU_BA_GRAU = 111_320;

const ESTADU_DISPLAY: Record<Estadu, string> = {
  PREZENTE: "Prezente",
  FALTA: "Falta",
  LISENSA: "Lisensa",
  MISAUN: "Misaun",
  FERIADU: "Feriadu",
};
const SESAUN_DISPLAY: Record<Sesaun, string> = {
  DADER: "Dader",
  LOROKRAIK: "Lorokraik",
};
const TIPU_DISPLAY: Record<Tipu, string> = { TAMA: "Tama", FILA: "Fila" };

/** The admin whose chip sits at the foot of the sidebar. */
export const ADMIN: User = {
  id: 100,
  numeru_id: 1001,
  email: "juliao.martins@eti.tl",
  naran_kompletu: "Julião Martins",
  kargu: "Administradór Sistema",
  foto: null,
  role: "ADMIN",
  role_display: "Administradór",
};

export const PROFESOR_HOTU: User[] = [
  {
    id: 1,
    numeru_id: 1021,
    naran_kompletu: "Maria Fátima Soares",
    kargu: "Profesóra Informátika",
    email: "maria.soares@eti.tl",
    nu_kontaktu: "+670 7723 1104",
    sexu: "FETO",
    foto: null,
    role: "PROFESSOR",
    role_display: "Professór",
    is_active: true,
  },
  {
    id: 2,
    numeru_id: 1007,
    naran_kompletu: "João Baptista da Costa",
    kargu: "Profesór Redes",
    email: "joao.dacosta@eti.tl",
    nu_kontaktu: "+670 7745 8820",
    sexu: "MANE",
    foto: null,
    role: "PROFESSOR",
    role_display: "Professór",
    is_active: true,
  },
  {
    id: 3,
    numeru_id: 1015,
    naran_kompletu: "Ana Paula Ximenes",
    kargu: "Profesóra Matemátika",
    email: "ana.ximenes@eti.tl",
    nu_kontaktu: "+670 7810 3345",
    sexu: "FETO",
    foto: null,
    role: "PROFESSOR",
    role_display: "Professór",
    is_active: true,
  },
  {
    id: 4,
    numeru_id: 1032,
    naran_kompletu: "Carlos Alberto Belo",
    kargu: "Profesór Eletrónika",
    email: "carlos.belo@eti.tl",
    nu_kontaktu: "+670 7733 9012",
    sexu: "MANE",
    foto: null,
    role: "PROFESSOR",
    role_display: "Professór",
    is_active: true,
  },
  {
    id: 5,
    numeru_id: 1044,
    naran_kompletu: "Filomena Gusmão",
    kargu: "Profesóra Portugés",
    email: "filomena.gusmao@eti.tl",
    nu_kontaktu: "+670 7756 2211",
    sexu: "FETO",
    foto: null,
    role: "PROFESSOR",
    role_display: "Professór",
    is_active: true,
  },
  {
    id: 6,
    numeru_id: 1050,
    naran_kompletu: "Domingos Sarmento",
    kargu: "Profesór Programasaun",
    email: "domingos.sarmento@eti.tl",
    nu_kontaktu: "+670 7791 6604",
    sexu: "MANE",
    foto: null,
    role: "PROFESSOR",
    role_display: "Professór",
    is_active: true,
  },
  {
    id: 7,
    numeru_id: 1058,
    naran_kompletu: "Rosa Maria Pereira",
    kargu: "Profesóra Inglés",
    email: "rosa.pereira@eti.tl",
    nu_kontaktu: "+670 7768 4433",
    sexu: "FETO",
    foto: null,
    role: "PROFESSOR",
    role_display: "Professór",
    is_active: true,
  },
  {
    id: 8,
    numeru_id: 1063,
    naran_kompletu: "Abílio dos Santos",
    kargu: "Profesór Físika",
    email: "abilio.santos@eti.tl",
    nu_kontaktu: "+670 7702 5578",
    sexu: "MANE",
    foto: null,
    role: "PROFESSOR",
    role_display: "Professór",
    is_active: true,
  },
];

/** The `Profesor` subset `ohin-hotu` nests in each report line. */
export const profesorKurtu = (u: User): Profesor => ({
  id: u.id,
  numeru_id: u.numeru_id,
  naran_kompletu: u.naran_kompletu,
  kargu: u.kargu,
  foto: u.foto,
});

/* ── Generator ─────────────────────────────────────────────────────────────
 * Same linear congruential generator and the same order of draws as the
 * prototype. Change either and every time on every screen moves.
 */

let seed = 42;
const rnd = () => {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
};

/** Minutes since midnight as `HH:MM:SS`. */
const fmt = (m: number): string => `${pad(Math.floor(m / 60))}:${pad(m % 60)}:00`;

interface PunchRaw {
  minutu: number;
  atrazadu: boolean;
  distansia_metru: number;
  iha_eskola: boolean;
}

interface LoronRaw {
  profesor_id: number;
  data: Data;
  estadu: Estadu;
  obs: string;
  dt: PunchRaw | null;
  df: PunchRaw | null;
  lt: PunchRaw | null;
  lf: PunchRaw | null;
}

const LISENSA: Record<number, { husi: Data; toO: Data; estadu: Estadu; obs: string }> = {
  3: {
    husi: "2026-07-13",
    toO: "2026-07-15",
    estadu: "LISENSA",
    obs: "Moras — atestadu médiku",
  },
  6: {
    husi: "2026-07-20",
    toO: "2026-07-22",
    estadu: "MISAUN",
    obs: "Formasaun iha INFORDEPE",
  },
};

const FALTA: Record<string, true> = {
  "2|2026-07-08": true,
  "8|2026-07-24": true,
};

const rows: LoronRaw[] = [];

/** `orariu` of 0 means a departure, which is never late. */
const punch = (minutu: number, orariu: number, distansia?: number): PunchRaw => ({
  minutu,
  atrazadu: orariu ? minutu > orariu : false,
  distansia_metru: distansia ?? Math.round(4 + rnd() * 60),
  iha_eskola: true,
});

function mkLoron(profesorId: number, d: Date): void {
  const data = iso(d);
  const kunut = `${profesorId}|${data}`;

  const lisensa = LISENSA[profesorId];
  if (lisensa && data >= lisensa.husi && data <= lisensa.toO) {
    rows.push({
      profesor_id: profesorId,
      data,
      estadu: lisensa.estadu,
      obs: lisensa.obs,
      dt: null,
      df: null,
      lt: null,
      lf: null,
    });
    return;
  }

  if (FALTA[kunut]) {
    rows.push({
      profesor_id: profesorId,
      data,
      estadu: "FALTA",
      obs: "",
      dt: null,
      df: null,
      lt: null,
      lf: null,
    });
    return;
  }

  const sabadu = d.getDay() === 6;
  const ohin = data === TODAY;

  const dtm = 466 + Math.floor(rnd() * 22);
  const row: LoronRaw = {
    profesor_id: profesorId,
    data,
    estadu: "PREZENTE",
    obs: "",
    dt: punch(dtm, 480),
    df: ohin ? null : punch(720 + Math.floor(rnd() * 12), 0),
    lt: sabadu || ohin ? null : punch(802 + Math.floor(rnd() * 16), 810),
    lf: sabadu || ohin ? null : punch(1050 + Math.floor(rnd() * 14), 0),
  };

  // The one punch in the mock that lands outside the geofence, so the day
  // detail has something to show for "Dook husi eskola".
  if (kunut === "5|2026-07-09" && row.dt) {
    row.dt.distansia_metru = 142;
    row.dt.iha_eskola = false;
  }

  rows.push(row);
}

// July in full, then the first days of August. Sundays are not days on the
// sheet; today (04 Agostu) is missing two teachers on purpose.
for (let loron = 1; loron <= 31; loron++) {
  const d = new Date(TINAN, 6, loron);
  if (d.getDay() === 0) continue;
  for (const p of PROFESOR_HOTU) mkLoron(p.id, d);
}
for (let loron = 1; loron <= 4; loron++) {
  const d = new Date(TINAN, 7, loron);
  if (d.getDay() === 0) continue;
  for (const p of PROFESOR_HOTU) {
    if (iso(d) === TODAY && (p.id === 4 || p.id === 7)) continue;
    mkLoron(p.id, d);
  }
}

/* ── Raw rows to API shapes ───────────────────────────────────────────────── */

let markaId = 1;
let prezensaId = 1;

function mkMarka(p: PunchRaw, sesaun: Sesaun, tipu: Tipu, data: Data): Marka {
  const id = markaId++;
  const kolumna = `ORAS_${sesaun}_${tipu}` as Kolumna;
  const orasStr = fmt(p.minutu);
  return {
    id,
    sesaun,
    sesaun_display: SESAUN_DISPLAY[sesaun],
    tipu,
    tipu_display: TIPU_DISPLAY[tipu],
    kolumna,
    oras: orasStr,
    oras_orariu: ORARIU[kolumna],
    atrazadu: tipu === "TAMA" ? p.atrazadu : null,
    // Asia/Dili is UTC+9 and the server stamps the punch as it lands.
    rejistu_iha: `${data}T${orasStr}+09:00`,
    foto: `/media/prezensa/${data.slice(0, 4)}/${data.slice(5, 7)}/marka-${id}.jpg`,
    latitude: (ESKOLA.latitude + p.distansia_metru / METRU_BA_GRAU).toFixed(6),
    longitude: ESKOLA.longitude.toFixed(6),
    // eti-mobile never sends the accuracy, so the column is always null.
    presizaun: null,
    distansia_metru: p.distansia_metru,
    iha_eskola: p.iha_eskola,
  };
}

function mkPrezensa(row: LoronRaw, profesor: User): Prezensa {
  const marka: Marka[] = [];
  if (row.dt) marka.push(mkMarka(row.dt, "DADER", "TAMA", row.data));
  if (row.df) marka.push(mkMarka(row.df, "DADER", "FILA", row.data));
  if (row.lt) marka.push(mkMarka(row.lt, "LOROKRAIK", "TAMA", row.data));
  if (row.lf) marka.push(mkMarka(row.lf, "LOROKRAIK", "FILA", row.data));

  const orasBa = (kolumna: Kolumna) =>
    marka.find((m) => m.kolumna === kolumna)?.oras ?? null;

  return {
    id: prezensaId++,
    profesor: profesor.naran_kompletu,
    data: row.data,
    loron: LORON_API[dataDate(row.data).getDay()],
    oras_dader_tama: orasBa("ORAS_DADER_TAMA"),
    oras_dader_fila: orasBa("ORAS_DADER_FILA"),
    oras_lorokraik_tama: orasBa("ORAS_LOROKRAIK_TAMA"),
    oras_lorokraik_fila: orasBa("ORAS_LOROKRAIK_FILA"),
    estadu: row.estadu,
    estadu_display: ESTADU_DISPLAY[row.estadu],
    obs: row.obs,
    marka,
  };
}

/**
 * Every generated day, in the `ohin-hotu` line shape — the only response the
 * API has that carries both a teacher and their day, which is what the
 * Prezensa and Relatóriu tables need to filter by teacher.
 */
export const REJISTU_HOTU: PrezensaProfesor[] = rows.map((row) => {
  const profesor = PROFESOR_HOTU.find((p) => p.id === row.profesor_id)!;
  return {
    profesor: profesorKurtu(profesor),
    prezensa: mkPrezensa(row, profesor),
    marka_ona: Boolean(row.dt || row.df || row.lt || row.lf),
  };
});

/**
 * `GET /api/prezensa/ohin-hotu/` for TODAY, teachers ordered by name.
 * Takes its inputs so the live store can pass its own copies; the defaults are
 * the seed, which is what a standalone caller wants.
 */
export function ohinHotu(
  profesorHotu: User[] = PROFESOR_HOTU,
  rejistuHotu: PrezensaProfesor[] = REJISTU_HOTU,
): OhinHotu {
  const ohin = new Map(
    rejistuHotu
      .filter((r) => r.prezensa?.data === TODAY)
      .map((r) => [r.profesor.id, r]),
  );

  const liña: PrezensaProfesor[] = [...profesorHotu]
    .sort((a, b) => a.naran_kompletu.localeCompare(b.naran_kompletu))
    .map((p) => {
      const rejistu = ohin.get(p.id);
      return {
        profesor: profesorKurtu(p),
        prezensa: rejistu?.prezensa ?? null,
        marka_ona: rejistu?.marka_ona ?? false,
      };
    });

  const markaOna = liña.filter((l) => l.marka_ona).length;
  return {
    data: TODAY,
    loron: LORON_API[dataDate(TODAY).getDay()],
    rezumu: {
      total: liña.length,
      marka_ona: markaOna,
      seidauk_marka: liña.length - markaOna,
    },
    profesor: liña,
  };
}

/**
 * A day the administration marked by hand — LISENSA, MISAUN or FERIADU. It
 * carries an estadu and an OBS and no punches, which is exactly the row the
 * API would hold if an endpoint existed to write one (nothing sets these
 * states today; see plan.md §10 issues 16 and 17).
 */
export function kriaPrezensaEstadu(
  profesor: User,
  data: Data,
  estadu: Estadu,
  obs: string,
): Prezensa {
  return mkPrezensa(
    { profesor_id: profesor.id, data, estadu, obs, dt: null, df: null, lt: null, lf: null },
    profesor,
  );
}

/** The punch that filled one column of a day, if it was ever made. */
export const markaBa = (
  prezensa: Prezensa | null | undefined,
  kolumna: Kolumna,
): Marka | null => prezensa?.marka.find((m) => m.kolumna === kolumna) ?? null;

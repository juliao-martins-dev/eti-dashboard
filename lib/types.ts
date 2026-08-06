/**
 * The shapes eti-api actually returns, named exactly as it names them.
 *
 * Tetun is preserved field for field the way eti-mobile/lib does it, so the
 * later swap from lib/mock to fetch() changes where the data comes from and
 * nothing about the components that read it. Every type below is traceable to
 * a serializer in eti-api: see the reference on each one.
 */

/** `accounts.User.Role` */
export type Role = "ADMIN" | "PROFESSOR" | "ESTUDANTE";

/** `accounts.User.Sexu` */
export type Sexu = "MANE" | "FETO";

/** `accounts.User.NivelEdukasaun` */
export type NivelEdukasaun =
  | "ENSINU_SEKUNDARIU"
  | "DIPLOMA"
  | "BACHARELATU"
  | "LICENCIADO"
  | "POST_GRADUACAO"
  | "MESTRADO"
  | "DOUTORAMENTU";

/**
 * `attendance.Prezensa.Status` — stored values are English; the Tetun label
 * the user reads comes back in `status_display`.
 */
export type Status = "PRESENT" | "ABSENT" | "LEAVE" | "MISSION" | "HOLIDAY";

/** `attendance.Sesaun` — the two blocks of the school day. */
export type Sesaun = "DADER" | "LOROKRAIK";

/** `attendance.Tipu` — arrival or departure. */
export type Tipu = "TAMA" | "FILA";

/** `Marka.kolumna` — which column of the paper sheet a punch fills. */
export type Kolumna =
  | "ORAS_DADER_TAMA"
  | "ORAS_DADER_FILA"
  | "ORAS_LOROKRAIK_TAMA"
  | "ORAS_LOROKRAIK_FILA";

/** `HH:MM:SS` — DRF TimeField. */
export type Oras = string;

/** `YYYY-MM-DD` — DRF DateField. */
export type Data = string;

/** ISO 8601 with offset — DRF DateTimeField. */
export type DataOras = string;

/** The `code` on a 400 from a punch or a bad period. */
export type ErruKode =
  | "duplicate"
  | "no_clock_in"
  | "no_session"
  | "dook_husi_eskola"
  | "invalid_period"
  | "token_not_valid";

/**
 * A full account row. `GET /api/auth/me/` returns only the first eight fields
 * (`accounts.UserSerializer`); the roster fields after them exist on the model
 * but no endpoint exposes them yet, so the teacher-management screens will
 * need one added to eti-api.
 */
export interface User {
  id: number;
  numeru_id: number;
  email: string;
  naran_kompletu: string;
  kargu: string;
  foto: string | null;
  role: Role;
  role_display: string;

  sexu?: Sexu | "";
  habilitasaun_literaria?: string;
  disiplina_hanorin?: string;
  nu_kontaktu?: string;
  nivel_edukasaun?: NivelEdukasaun | "";
  area_estudu?: string;
  is_active?: boolean;
}

/** `attendance.ProfesorSerializer` — just enough to label a report row. */
export interface Profesor {
  id: number;
  numeru_id: number;
  naran_kompletu: string;
  kargu: string;
  foto: string | null;
}

/** `attendance.MarkaSerializer` — one punch and the evidence behind it. */
export interface Marka {
  id: number;
  sesaun: Sesaun;
  sesaun_display: string;
  tipu: Tipu;
  tipu_display: string;
  kolumna: Kolumna;
  oras: Oras;
  /** The scheduled time printed in that column's header. */
  oras_orariu: Oras;
  /** `null` on departures — only an arrival can be late. */
  atrazadu: boolean | null;
  rejistu_iha: DataOras;
  foto: string;
  latitude: string;
  longitude: string;
  presizaun: number | null;
  distansia_metru: number | null;
  iha_eskola: boolean | null;
}

/** `attendance.PrezensaSerializer` — one row of the grid, one teacher, one day. */
export interface Prezensa {
  id: number;
  /** `str(User)`, i.e. the teacher's name — not their id. */
  profesor: string;
  data: Data;
  loron: string;
  oras_dader_tama: Oras | null;
  oras_dader_fila: Oras | null;
  oras_lorokraik_tama: Oras | null;
  oras_lorokraik_fila: Oras | null;
  status: Status;
  status_display: string;
  obs: string;
  marka: Marka[];
}

/** `attendance.PrezensaOhinSerializer` — today plus the state of the two buttons. */
export interface PrezensaOhin extends Prezensa {
  sesaun: Sesaun;
  oras_tama: Oras | null;
  oras_fila: Oras | null;
  bele_clock_in: boolean;
  bele_clock_out: boolean;
}

/**
 * `attendance.PrezensaProfesorSerializer` — one line of the daily report.
 * `prezensa` is null for a teacher who has not marked anything, which is the
 * point of the report.
 */
export interface PrezensaProfesor {
  profesor: Profesor;
  prezensa: Prezensa | null;
  marka_ona: boolean;
}

/**
 * One line of `GET /api/prezensa/hotu/`. The calendar day sits at the top
 * level because an unmarked day has `prezensa: null` and the date would have
 * nowhere else to live.
 */
export interface PrezensaProfesorLoron extends PrezensaProfesor {
  data: Data;
}

/** `GET /api/prezensa/hotu/` — echoes back whichever period it was asked for. */
export interface HotuResposta {
  data?: Data;
  loron?: string;
  fulan?: number;
  tinan?: number;
  semana?: number | null;
  profesor: PrezensaProfesorLoron[];
}

/** `POST /api/prezensa/status/` payload — `too` is Tetun `to'o`, kept ASCII. */
export interface StatusRejistu {
  profesor: number;
  status: Status;
  husi: Data;
  too: Data;
  obs: string;
}

/** `201` from the same call. */
export interface StatusRejistuResposta {
  detail: string;
  profesor: number;
  status: Status;
  husi: Data;
  too: Data;
  loron: Data[];
  total: number;
}

/** `GET /api/konfig/` — the schedule and geofence, read-only. */
export interface KonfigSistema {
  oras_dader_tama: Oras;
  oras_dader_fila: Oras;
  oras_lorokraik_tama: Oras;
  oras_lorokraik_fila: Oras;
  limite_sesaun: Oras;
  eskola_raiu_metru: number;
  eskola_obriga_fatin: boolean;
}

/** `POST /api/profesor/` body; `PATCH` takes any subset plus `is_active`. */
export interface ProfesorFoun {
  numeru_id: number;
  naran_kompletu: string;
  email: string;
  kargu?: string;
  nu_kontaktu?: string;
  sexu?: Sexu;
}

export type ProfesorPatch = Partial<ProfesorFoun> & { is_active?: boolean };

/** The 201 from `POST /api/profesor/`: a roster row plus a one-time password. */
export interface ProfesorKriadu extends User {
  password_inisial: string;
}

export interface OhinHotuRezumu {
  total: number;
  marka_ona: number;
  seidauk_marka: number;
}

/** `GET /api/prezensa/ohin-hotu/` — today for every teacher. */
export interface OhinHotu {
  data: Data;
  loron: string;
  rezumu: OhinHotuRezumu;
  profesor: PrezensaProfesor[];
}

export interface IstoriaRezumu {
  loron_servisu: number;
  marka_ona: number;
  seidauk_marka: number;
  marka_total: number;
  atrazadu: number;
}

/**
 * One row of `istoria`: a `Prezensa`, or an empty stand-in for a working day
 * nobody marked — which is why `id` and `status` are nullable here.
 */
export interface IstoriaLoron
  extends Omit<Prezensa, "id" | "status" | "status_display"> {
  id: number | null;
  status: Status | null;
  status_display: string | null;
  semana: number;
  sabadu: boolean;
}

/** `GET /api/prezensa/istoria/` — one month (or week) of one teacher's sheet. */
export interface Istoria {
  profesor: string;
  fulan: number;
  fulan_display: string;
  tinan: number;
  semana: number | null;
  rezumu: IstoriaRezumu;
  loron: IstoriaLoron[];
}

/** `attendance.ListaPrezensaSerializer` — one printed monthly sheet. */
export interface ListaPrezensa {
  id: number;
  profesor: string;
  kargu: string;
  fulan: number;
  fulan_display: string;
  tinan: number;
  prezensa: Prezensa[];
}

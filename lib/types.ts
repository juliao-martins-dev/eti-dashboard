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
  | "FINALISTA"
  | "UNIVERSITARIA"
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

/**
 * `attendance.Motivu` — why an administrator refused a day's evidence.
 *
 * Both are human judgements. There is no auto-rejection: an out-of-fence
 * punch is already refused at check-in time whenever the geofence is
 * enforced, and a poor indoor fix reports 50–100 m of `presizaun` on its own.
 */
export type MotivuRejeita =
  | "FOTO_FALSU"
  | "DISTANSIA_DOOK"
  /** Both at once — a photo that is not the teacher, taken away from school. */
  | "HOTU_HOTU";

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
  | "no_checkin"
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

  /** The Tetun label for `nivel_edukasaun`, ready to print. */
  nivel_edukasaun_display?: string;

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
  /**
   * Optional because `hotu` does not send it. Its nested `profesor` repeats on
   * every one of the ~1500 rows a month for the whole school returns, so the
   * report joins this from the roster rather than widening all of them for a
   * value the printed header uses once per teacher.
   */
  disiplina_hanorin?: string;
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

  /*
   * Rejeita. Carried on every day so the grid can badge a rejected one
   * without a second request; empty on every day nobody has rejected.
   *
   * A rejected day has `status: "ABSENT"` — there is no separate FALTA value,
   * because ABSENT is already what the report counter, the badge and both
   * exports read as "Falta".
   */
  rejeita_motivu: MotivuRejeita | "";
  /** The Tetun label, or null when the day is not rejected. */
  rejeita_motivu_display: string | null;
  /** The administrator's note. Separate from `obs`, the printed OBS column. */
  rejeita_obs: string;
  rejeita_husi_naran: string | null;
  rejeita_iha: DataOras | null;

  marka: Marka[];
}

/** `attendance.PrezensaOhinSerializer` — today plus the state of the two buttons. */
export interface PrezensaOhin extends Prezensa {
  sesaun: Sesaun;
  oras_tama: Oras | null;
  oras_fila: Oras | null;
  bele_checkin: boolean;
  bele_checkout: boolean;
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

/**
 * `200` from `POST /api/auth/troka-password/`.
 *
 * The pair matters as much as the message: changing the password blacklists
 * every refresh token the account had, the caller's included, so these are the
 * replacements and must be stored or the next refresh fails.
 */
export interface TrokaPasswordResposta {
  detail: string;
  /** How many other sessions were signed out. */
  sesaun_taka: number;
  access: string;
  refresh: string;
}

/** `GET /api/konfig/` — the schedule and geofence, read-only. */
export interface Opsaun {
  value: string;
  label: string;
}

export interface KonfigSistema {
  oras_dader_tama: Oras;
  oras_dader_fila: Oras;
  oras_lorokraik_tama: Oras;
  oras_lorokraik_fila: Oras;
  limite_sesaun: Oras;
  eskola_raiu_metru: number;
  eskola_obriga_fatin: boolean;
  /** Roster picklists, so the forms do not hardcode what the server owns. */
  nivel_edukasaun: Opsaun[];
  area_estudu_sujere: string[];
  sexu: Opsaun[];
}

/** `POST /api/profesor/` body; `PATCH` takes any subset plus `is_active`. */
export interface ProfesorFoun {
  numeru_id: number;
  naran_kompletu: string;
  email: string;
  kargu?: string;
  nu_kontaktu?: string;
  sexu?: Sexu;
  /** HABILITASAUN LITERÁRIA on the paper roster is a heading over these two. */
  nivel_edukasaun?: NivelEdukasaun | "";
  area_estudu?: string;
  disiplina_hanorin?: string;
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

/** `POST /api/profesor/{id}/reset-password/` — 200. */
export interface ResetPasswordResposta {
  detail: string;
  /** How many of the teacher's open sessions were revoked by the reset. */
  sesaun_taka: number;
  profesor: User;
}

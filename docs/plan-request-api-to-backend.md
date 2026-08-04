# API Requests: eti-dashboard → eti-api

What the admin dashboard needs from the backend, derived by reading every
screen of the finished mock-driven UI and mapping each piece of data it
renders (or writes) to an existing endpoint — or to a gap. Written for the
backend maintainer; endpoint shapes below follow eti-api's own conventions.

Companion to `docs/plan.md` (the full system context). Issue numbers like
"§10 #16" refer to that document.

---

## 1. How the dashboard consumes data today

All five screens read one client-side store (`lib/store.ts`) seeded by a
generator (`lib/mock-data.ts`) that fabricates API-shaped responses. The types
in `lib/types.ts` were written from eti-api's serializers, field for field —
`Prezensa`, `Marka`, `PrezensaProfesor`, `OhinHotu`, `Istoria` all exist
already and match `attendance/serializers.py`. **The swap is designed to touch
only the store**: every component reads `useDadus()` or calls a store mutation
(`aumentaProfesor`, `atualizaProfesor`, `rejistuLisensa`, `hasaiPrezensa`),
so each mutation maps one-to-one onto a request this document asks for.

Conventions the dashboard already follows and expects the API to keep:

- Domain fields in **Tetun**, exactly as the models spell them
  (`naran_kompletu`, `oras_dader_tama`, `distansia_metru`, `iha_eskola`).
- Trailing slash on every path.
- JWT Bearer auth; admin-only routes gated by `EhAdmin`
  (`accounts/permissions.py`).
- Errors as `{detail, code, ...extra}` with the codes listed in plan.md §6.
- Times as `HH:MM:SS`, dates as `YYYY-MM-DD` (DRF defaults).

## 2. Already covered by existing endpoints

| Dashboard feature | Endpoint | Notes |
| --- | --- | --- |
| Login / logout / session (sidebar chip, "Sai" menu item) | `POST /api/auth/login/`, `refresh/`, `logout/`, `GET /api/auth/me/` | `me` returns `naran_kompletu`, `email`, `kargu`, `role` — everything the chip and its menu show. |
| Painel: 4 stat cards, "Seidauk marka ohin", "Marka foun ohin loron" feed | `GET /api/prezensa/ohin-hotu/` | Shape matches `OhinHotu` in `lib/types.ts` (`app/page.tsx` builds all three sections from it). **Caveat 1:** the seidauk list shows each teacher's `nu_kontaktu`, which `ProfesorSerializer` does not include — covered by R1, joined client-side. **Caveat 2:** the feed sorts punches newest-first from `marka[]`, so nothing extra is needed there. |
| Evidence modal (foto + GPS per punch) | nested `marka[]` in any `Prezensa` | Needs `foto` to be an absolute URL and reachable in production — see R7. |

## 3. Requested endpoints

Ordered so that each phase leaves the dashboard shippable.

### Phase 1 — read-only dashboard against live data

**R1 · `GET /api/profesor/`** — teacher roster (admin)

- **Who calls it:** `app/profesor/page.tsx` (the table), `components/Filters.tsx`
  (the "Profesór hotu-hotu" select on Prezensa/Relatóriu), `app/page.tsx`
  (joining `nu_kontaktu` into the seidauk list).
- **Auth:** `IsAuthenticated + EhAdmin`.
- **Response:** array of the `User` shape the dashboard already types —
  `UserSerializer` fields plus the roster fields the screens display:

  ```json
  [{
    "id": 3, "numeru_id": 1015, "email": "ana.ximenes@eti.tl",
    "naran_kompletu": "Ana Paula Ximenes", "kargu": "Profesóra Matemátika",
    "foto": null, "role": "PROFESSOR", "role_display": "Professór",
    "sexu": "FETO", "nu_kontaktu": "+670 7810 3345", "is_active": true
  }]
  ```

- **Notes:** include **inactive** accounts (the dashboard shows a
  "Dezativadu" badge and offers reactivation). Ordering by `naran_kompletu`
  matches the model's `Meta.ordering`. At 57 staff, no pagination needed —
  if DRF pagination is on globally, please disable it here or document the
  envelope so the client can unwrap it.

**R2 · `GET /api/prezensa/hotu/`** — attendance for any teacher over a period (admin)

- **Who calls it:** `app/prezensa/page.tsx` (the grid, all three period modes)
  and `app/relatoriu/page.tsx` (aggregates are computed client-side from the
  same rows — no separate report endpoint needed).
- **Why new:** `GET /api/prezensa/` and `istoria/` are scoped to
  `request.user`; the admin screens need the same data across teachers.
- **Auth:** `IsAuthenticated + EhAdmin`.
- **Query params:** `data=YYYY-MM-DD` (single day) **or**
  `fulan=&tinan=&semana?=` (month / week of month, same semantics and
  validation as `istoria`, error `invalid_period`). Optional
  `profesor=<id>` narrows to one teacher.
- **Response:** the `PrezensaProfesor` line shape `ohin-hotu` already uses,
  one element per teacher per working day in the period, including empty
  days (`prezensa: null`) — the dashboard's Relatóriu counts `loron servisu`
  from the rows it receives:

  ```json
  {
    "fulan": 7, "tinan": 2026, "semana": null,
    "profesor": [
      { "profesor": {"id": 3, "...": "..."},
        "prezensa": { "id": 91, "data": "2026-07-13", "estadu": "LISENSA",
                       "obs": "Moras — atestadu médiku", "marka": [], "...": "..." },
        "marka_ona": false }
    ]
  }
  ```

- **Notes:** a full month for 57 teachers ≈ 1 500 rows with nested `marka` —
  fine for the LAN deployment, but if payload becomes a concern a
  `?marka=false` flag that omits the nested punches would let the grid load
  light and the evidence modal fetch one day via `GET /api/prezensa/{id}/`
  (which would then also need an admin variant).

**R7 · Punch photos in production** *(infrastructure, not an endpoint)*

- `/media/*` is served only when `DEBUG=True` (`core/urls.py`). The evidence
  modal renders `marka.foto`; before the dashboard goes live the web server
  must serve `MEDIA_ROOT`, and `foto` should be an absolute URL (DRF does
  this automatically when the serializer gets a `request` in context — it
  already does).

### Phase 2 — mutations

**R3 · `POST /api/profesor/`** — create a teacher account

- **Who calls it:** `aumentaProfesor()` ← the "Aumenta Profesór" modal.
- **Request:** `{numeru_id, naran_kompletu, email, kargu?, nu_kontaktu?, sexu?}`.
- **Response:** `201` with the created R1 shape.
- **Errors:** `400 {detail, code: "duplicate_numeru"}` /
  `"duplicate_email"` — the dashboard already validates locally and needs to
  map the server's answer onto the same two toasts.
- **Note:** the modal promises *"Sistema sei kria password inisiál no haruka
  ba email"*. If e-mail delivery is not ready, please return the initial
  password in the 201 body (`password_inisial`) so the admin can hand it
  over — the hint text will be adjusted to match whichever is implemented.

**R4 · `PATCH /api/profesor/{id}/`** — update a teacher / (de)activate

- **Who calls it:** `atualizaProfesor()` ← the edit modal and the
  "Dezativa konta / Ativa fila fali" button.
- **Request:** any subset of the R3 fields plus `is_active`.
- **Notes:** deactivation must be a soft toggle, never a delete — the sheets
  reference the account. Same duplicate error codes as R3.
  Mind plan.md §10 #14: `ohin-hotu` (and R2) filter `is_active=True`, so a
  deactivated teacher drops out of Painel counts — that is the behaviour the
  dashboard assumes.

**R5 · `POST /api/prezensa/estadu/`** — register LISENSA / MISAUN / FERIADU over a range

- **Who calls it:** `rejistuLisensa()` ← the "Rejistu Lisensa" modal (also
  reached prefilled via the day modal's "Edita" button).
- **Why new:** nothing writes `estadu` other than PREZENTE, and nothing
  writes `obs` (§10 #16, #17).
- **Auth:** `IsAuthenticated + EhAdmin`.
- **Request:**

  ```json
  { "profesor": 3, "estadu": "LISENSA",
    "husi": "2026-08-05", "too": "2026-08-07",
    "obs": "Moras — atestadu médiku" }
  ```

  (`to'o` has an apostrophe in Tetun; `too` keeps the key ASCII — backend's
  call.)
- **Behaviour the dashboard implements today and expects the server to own:**
  skip Sundays; create the monthly sheet/rows via
  `Prezensa.objects.ba_loron()` if absent; overwrite the `estadu`/`obs` of
  the days in range; validate `husi <= too` (`400 {code: "invalid_period"}`).
- **Open rule (please decide):** a day that already has punches. The mock
  currently lets a leave overwrite it and the punches are lost from view —
  fine for a mock, wrong for real data. Suggest refusing with
  `400 {code: "iha_marka"}` and letting the admin see the conflict, since
  `Marka` rows are evidence and should never be silently orphaned.

**R6 · `DELETE /api/prezensa/estadu/`** — remove a hand-written day

- **Who calls it:** `hasaiPrezensa()` ← "Hasai rejistu" in the day modal.
- **Request:** `{profesor, data}` (or `/api/prezensa/estadu/{prezensa_id}/`).
- **Behaviour:** only valid on days whose `estadu` is not PREZENTE and that
  hold no `marka`; the day returns to "no record". `400 {code: "iha_marka"}`
  otherwise.

### Phase 3 — nice-to-have

**R8 · `GET /api/konfig/`** — system info panel

- **Who calls it:** `app/konfig/page.tsx`, whose "Informasaun sistema" panel
  is currently hardcoded to mirror the defaults. Label says *husi servidor
  (.env)* — this endpoint makes that true.
- **Response:** `{oras_dader_tama, oras_dader_fila, oras_lorokraik_tama,
  oras_lorokraik_fila, limite_sesaun, eskola_raiu_metru, eskola_obriga_fatin}`
  — the `Prezensa.ORAS_*` constants plus the geofence settings. **Never**
  include coordinates or any secret.
- **Auth:** `IsAuthenticated` is enough; nothing here is sensitive.

## 4. Explicitly not requested

- **No punch editing endpoint.** The dashboard deliberately renders the four
  times read-only. A server-stamped time plus photo plus GPS is the whole
  audit story; a correction workflow, if ever needed, should annotate `obs`,
  not rewrite `Marka`.
- **No CSV/report endpoint.** Relatóriu aggregates and exports client-side
  from R2's rows (`lib/csv.ts`); the numbers on screen and in the file can
  never disagree.
- **No theme/preferences endpoint.** Accent and dark mode live in
  `localStorage` (`lib/theme.ts`).

## 5. Open questions for the backend

1. **R1 contact fields on `ohin-hotu`:** alternative to the client-side join
   would be adding `nu_kontaktu` to `ProfesorSerializer` — one line, but it
   widens a serializer the mobile app also receives. Dashboard is happy
   either way; the join is already written.
2. **R5 conflict rule** (punches under a leave) — see above; blocking is our
   recommendation.
3. **Admins in reports** (§10 #14): `ohin-hotu` lists `role=PROFESSOR` only.
   Fine for the dashboard, but confirm a teaching director won't need to
   appear — R2 inherits whatever `ohin-hotu` decides.
4. **Token lifetime UX:** access tokens live 15 min. The dashboard will
   implement the same single-flight refresh the mobile app has
   (`eti-mobile/lib/api.ts`) — no backend change needed, just flagging the
   dependency on `POST /api/auth/refresh/` rotation behaviour staying as is.

## 6. Swap plan on the dashboard side (for reference)

Phase 1 lands: `lib/store.ts` keeps its exact exports but `useDadus()` reads
from `GET /api/profesor/` + R2 instead of the generator; components do not
change. Phase 2 lands: the four store mutations become `fetch` calls and the
optimistic local write is replaced by re-fetch (or kept as optimistic update
with rollback on the error codes above). `lib/mock-data.ts` then only serves
tests and Storybook-style demos.

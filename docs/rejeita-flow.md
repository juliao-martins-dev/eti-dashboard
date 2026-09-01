# Rejecting a day's evidence — the dashboard flow

How an administrator refuses the evidence behind a teacher's day, and what the
dashboard shows before and after.

**Contract:** `docs/api-contract.md` §6 (copied from `eti-api`; that repo is the
source). Where this file and the contract disagree, the contract is right.

Tetun strings below are **copied verbatim from the components**. Do not reword
them here — if the UI text changes, copy the new text across.

---

## What it is

An administrator looks at a day, judges the evidence unacceptable — a fake
photo, a punch far from the school — and refuses it. The day becomes **`ABSENT`
("Falta")** and carries a reason, an optional note, who decided, and when.

It is deliberately **not automatic**. An out-of-fence punch is already refused
at check-in time while `ESKOLA_OBRIGA_FATIN` is on, and a poor indoor GPS fix
reports 50–100 m of accuracy on its own — a rule here would mark honest
teachers absent with nobody in the loop. `FOTO_FALSU` is a judgement no rule can
make at all.

---

## Where it lives

| Piece | File |
|---|---|
| The grid, the buttons, the reason modal | `app/(dashboard)/prezensa/page.tsx` |
| The rejection banner on a day | `components/DetalleModal.tsx` |
| `rejeitaPrezensa()` / the undo call | `lib/prezensa.ts` |
| `rejeitadu()` and the OBS column for exports | `lib/relatoriu.ts` |
| The five fields on `Prezensa` | `lib/types.ts` |

---

## The flow

### 1. Open a day

The administrator opens a day from the grid. `DetalleModal` shows the punches —
photo, time, distance — because those are what the judgement is made from.

### 2. Press **Rejeita Prezensa**

`abreRejeita()` opens the reason modal, titled **Motivu Rejeita**, with the
teacher's name and the date beneath it. The reason resets to `FOTO_FALSU` and
the note field is cleared each time it opens.

The two reasons offered, exactly as the component lists them:

| `value` | `label` |
|---|---|
| `FOTO_FALSU` | Foto falsu |
| `DISTANSIA_DOOK` | Distánsia dook liu husi eskola |

> ⚠️ **The API accepts a third reason the dashboard never offers: `HOTU_HOTU`
> ("Hotu-hotu").** The dashboard cannot produce it, but it **can receive** it —
> a day rejected by any other means will arrive with that value, and
> `rejeita_motivu_display` will render "Hotu-hotu" correctly. Do not switch on
> the two-value list when reading.

### 3. Confirm

`konfirmaRejeita()` sends the note trimmed:

```
POST /prezensa/{id}/rejeita/   { motivu, obs }
```

The button reads **Konfirma**, and **Rejeita…** while the request is in flight.
On success the toast is:

> Prezensa rejeita ona — loron ne'e sai Falta

The response is the **full day object**, so the grid updates from it — no
refetch.

### 4. How a rejected day then reads

**In the grid** — the badge is `ABSENT` like any other absence, so a second line
underneath is what separates the two:

```
{rejeita_motivu_display}
husi {rejeita_husi_naran}
```

**In `DetalleModal`** — a red panel above the punches:

> **Prezensa rejeita — {rejeita_motivu_display}**
> {rejeita_obs}
> Husi {rejeita_husi_naran} · {rejeita_iha}

The punches stay visible on purpose: an administrator reviewing the judgement
needs to see the evidence it was made from.

### 5. Undoing it

**Hasai rejeita** calls `DELETE /prezensa/{id}/rejeita/`. The day returns to
`PRESENT` and all five fields clear.

The button is shown only when `detalle.prezensa?.rejeita_motivu` is truthy —
which matches the API, since `DELETE` on a day that was never rejected here
answers **400 `la_rejeita`**. Only a day *this endpoint* rejected can be
restored, so a `LEAVE` day written through `/prezensa/status/` cannot be flipped
to `PRESENT` through this door.

---

## The one check that matters

```ts
const rejeitadu = !!prezensa?.rejeita_motivu;
```

A rejected day is `ABSENT` exactly like a hand-written absence. **This is the
only thing separating them.** Anything that colours, counts or exports by
`status` alone will merge the two.

`lib/relatoriu.ts` already handles this: `rejeitadu()` is checked **before** the
status branch when building the OBS column, so an export says which of the two a
day was.

### The five fields

| Field | Type | When not rejected |
|---|---|---|
| `rejeita_motivu` | `FOTO_FALSU` · `DISTANSIA_DOOK` · `HOTU_HOTU` · `""` | `""` |
| `rejeita_motivu_display` | `string \| null` — the Tetun label | `null` |
| `rejeita_obs` | `string` | `""` |
| `rejeita_husi_naran` | `string \| null` | `null` |
| `rejeita_iha` | ISO timestamp `\| null` | `null` |

They are on **every** day object, not only rejected ones.

> **Renamed 2026-09-01** — was `rejeisaun_motivu`, `rejeisaun_obs`,
> `rejeisaun_motivu_display`. A hard cutover; the old keys are no longer sent.

---

## Errors

| code | Status | What the dashboard should do |
|---|---|---|
| `la_iha_marka` | 400 | The day has no punches, so there is nothing to refuse. A day nobody marked is made absent through **Rejistu Lisensa** instead. Hide **Rejeita Prezensa** on an unmarked day |
| `marka_seluk` | 400 | The `marka` id belongs to another day. The dashboard does not send `marka`, so this should not occur |
| `la_rejeita` | 400 | `DELETE` on a day that was never rejected — keep **Hasai rejeita** hidden unless `rejeita_motivu` is set |
| — | 403 | Not an admin |
| — | 404 | No day with that id |

---

## ⚠️ What rejection does **not** do

Verified against the backend, because the feature is often described otherwise:

1. **It is a property of the day, not of one punch.** The status lives on the
   day; the printed sheet has one status column per day.
2. **The request may carry a `marka` id, but the server discards it.** It is
   validated as belonging to the day and then never stored. Nothing records
   *which* punch was objected to. The dashboard does not send it.
3. **Punch rows are untouched.** There is no soft-invalidation flag on a punch.
4. **The slot does not reopen.** Because the punch survives, the teacher cannot
   punch that session again — the API answers `duplicate`.

> **OPEN QUESTION.** The feature is sometimes described as "the slot reopens so
> the teacher can punch again", with the punch soft-invalidated. The code does
> neither. Recorded in `eti-api/docs/api-contract.md` §6 and as known issue 18
> in `eti-api/docs/plan.md`. **Do not build a "punch again" affordance on this
> until it is resolved** — today it would fail.

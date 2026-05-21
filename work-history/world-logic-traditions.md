# world-logic-traditions — Survey, tickets, and design docs for non-Western logic systems

**Branch:** `docs/world-logic-traditions`
**Merged:** TBD

## What changed

- **Survey** (commit `b44e539`) — `docs/formal-logic/world-logic-traditions.md`,
  a scoping survey of formalizable non-Western logic traditions
  eligible for the Logic Lab.
- **Four queue tickets** in `.tickets/`:
  - `feat-logic-lab-navya-nyaya.md` — Gaṅgeśa's Navya-Nyāya as a new
    system (relational-abstract DSL, vyāpti engine, dependency tree).
  - `feat-logic-lab-saptabhangi.md` — Jain sevenfold predication as a
    new system (seven-bhaṅga structure, standpoint engine, inclusion
    lattice).
  - `feat-logic-lab-avicennan.md` — Avicennan modal-temporal
    syllogistic as a new system (modalized moods, validity table,
    modal square).
  - `feat-logic-lab-indian-buddhist-hetucakra.md` — Dharmakīrti's
    three hetu types, apoha, and the Nyāyapraveśa fault taxonomy as an
    *extension* to the shipped `indian-buddhist` system.
- **Four design docs** in `docs/formal-logic/`: `navya-nyaya.md`,
  `saptabhangi.md`, `avicennan.md`, and `indian-buddhist.md`. The
  first three are design docs *ahead of* implementation (marked "not
  yet shipped"); `indian-buddhist.md` doubles as the retroactive
  per-system doc for the already-shipped phase 1.
- Updated `world-logic-traditions.md` (status line + per-candidate
  ticket/doc pointers) and `lab-roadmap.md` (references list + the
  Indian/Buddhist status line) so both index the new tickets by slug.

## Why

The survey explicitly deferred per-candidate detail: "per-candidate
detail belongs in a `docs/formal-logic/<system>.md` once a ticket
opens." This branch executes that for the four systems the user
prioritized for implementation. Each follows the established Lab
pattern — a tight `.tickets/` queue entry plus a `kripke-modal-logic.md`-
shaped design doc — so the work can be picked up cold.

Catuṣkoṭi and Mohist disputation were intentionally left un-ticketed:
the survey ranks Catuṣkoṭi as the cheap first pick but it was not on
the user's list, and Mohist is flagged as speculative with real
re-scoping risk.

## Notes for future work

- **hetu-cakra is an extension, not a new system.** Per the
  `indian-buddhist` work-history defer note and an explicit user
  decision, Dharmakīrti's hetu types / apoha / 33-fault scheme ship
  *inside* `indian-buddhist`. The ticket slug keeps the `hetucakra`
  suffix for continuity even though the wheel itself already shipped.
- **`saptabhangi` has a soft dependency** on `feat/logic-lab-many-valued`,
  which has no ticket file yet — only a roadmap entry. Saptabhaṅgī
  phase 1 ships standalone; the phase-2 compound evaluator is where
  the shared n-valued substrate should be built. Whoever opens the
  many-valued ticket should cross-link it.
- **These are design docs ahead of code** — an unusual state for
  `docs/formal-logic/`, where every other per-system doc describes
  shipped work. Each carries a "Status: not yet shipped" header so
  the state is unambiguous.
- **Deliberate phase-1 scoping calls** are recorded in each doc's
  "Open questions": one vyāpti definition for Navya-Nyāya (Gaṅgeśa's
  competing definitions deferred), the three-primitive reading of
  `avaktavya` for saptabhaṅgī, and mood-table-lookup rather than
  derived semantics for Avicennan. Revisit these if implementation
  surfaces a forcing function.
- **Suggested implementation order** still follows the survey's
  sequencing section (Catuṣkoṭi → Navya-Nyāya → Saptabhaṅgī →
  Mohist); the four tickets here can otherwise be picked up
  independently — only saptabhaṅgī has a (soft) dependency.

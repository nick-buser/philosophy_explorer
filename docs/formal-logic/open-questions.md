# Open Questions & Risk Register

**Status:** Draft — first-pass notes, 2026-04-16

Unresolved decisions, scope-cut alternatives, and risks to track.
Entries stay here until they're answered (by a ticket) or obsoleted
(by implementation choices).

---

## 1. Scope honesty

The total surface being sketched across these docs is large:

- A custom 2D structured notation editor for Begriffsschrift.
- Deep embedding of Begriffsschrift in Lean.
- A Lean integration layer (subprocess, caching, sandboxing).
- Support for multiple historical systems (Aristotelian, Stoic, Boole,
  Peirce EG, Venn, Schröder) with pairwise translation where possible.
- An argument-graph layer (Toulmin + Brandomian) composable with formal
  verification.
- A shared IR with partial translations and a lossiness UX.

Each piece is individually interesting. Cumulatively, this is a
**multi-year project** if built to the level these docs sketch.
That's fine if that's the goal; worth stating so it's not accidentally
agreed-to.

### 1.1 Lean 80/20 alternative

If the real goal is "philosophy notes with occasional formal
verification," a much narrower scope gets most of the value:

- **SVG-rendered Frege** (AST + renderer) for notes and reading aids.
  No structured editor — pre-built from text DSL only.
- **Inline KaTeX** for comparison systems (Boole, modern symbolic).
- **Lean integration** as an optional "verify this" button on a small
  whitelist of systems (propositional only), not a deep integration.
- **No argument-graph layer** — argument-as-text plus the existing
  entity graph is enough.
- **Prose-only treatment** of Aristotelian, Stoic, Leibniz, scholastic,
  and Peirce EG material.

This is a ~3–6 month project rather than a ~multi-year one. Decision
deferred — keep both options on the table; commit per-ticket.

---

## 2. Open design questions

### 2.1 Frege's `≡` / identity semantics

The 1879 content-identity predates Sinn/Bedeutung but already does
non-standard work. Options:

- (a) Pure Leibnizian identity (simplest, least faithful).
- (b) Coarser content-identity with multiple modes.
- (c) Flag as interpretive gap; offer user-switchable interpretations.

See `formal-verification.md` §2.3.

### 2.2 Neo4j adoption timing

CLAUDE.md positions Neo4j as future; in-memory graph is current.
Questions:

- Do argument-graph queries (derivation-chain traversal, commitment
  closure) push us to Neo4j earlier than the entity graph would?
- Is it worth a dual-write period during migration, or is a single
  switchover acceptable given we're pre-production?

### 2.3 Aristotelian — prose or mechanized?

Two possible treatments:

- **Prose only** — explanatory notes, schema diagrams, no executable
  semantics. Fits a read/compare UI.
- **Mechanized** — implement categorical-form validity and
  syllogistic moods. A charming ~200-line exercise; not comparable in
  depth to Lean-backed verification, but demonstrates the contrast.

The second is fun; the first is enough for the comparison matrix.

### 2.4 Peirce existential graphs — when?

EGs are the richest 2D foil to Frege. Their geometry is simpler than
Begriffsschrift. When in the sequencing do we add them?

- After Frege AST + SVG lands, while the infrastructure is fresh — or
- Defer until after Lean integration so we have a working end-to-end
  flow before adding another notation.

Sequencing recommendation in `README.md` §Suggested sequencing puts
Peirce at step 5 (after argument graph). Worth revisiting if the
notation work wants a direct follow-up.

### 2.5 Authoring model

Per `editor-and-ir.md` §2.4, the recommended primary mode is a
structured editor. But:

- **Structural only** — simplest to build well; text users may bounce.
- **Text DSL only** — fastest to type; loses the pedagogical clarity
  of structural editing.
- **Both with round-trip** — best UX; most build cost; round-trip is
  non-trivial to get right.

If we do both, the DSL parser is on the critical path and should be
started alongside the AST design.

### 2.6 Canonical form / proposition identity

How do we decide two propositions are the "same"? α-equivalence?
Full decidable equivalence (undecidable in general for predicate
logic)? Content-hash of an AST normalized to a fixed form? Affects
whether the argument graph can de-duplicate propositions across
sources.

See `argument-graph.md` §5.

### 2.7 Translation across systems

One node with multiple renderings, or separate nodes linked by
`TRANSLATES_TO` edges? The first is cleaner for display; the second
is more honest about the fact that systems aren't interchangeable.

### 2.8 Philosopher-detail schema — extend or encode-as-notes?

The Peirce case study (see
`../case-studies/peirce/README.md` §"Schema question") wants to
surface concept summaries, structured bibliography, and a reading
DAG on the philosopher detail page. Options:

- **Option A** — encode into existing `notes.json` using
  `noteType: "concept_summary"` / `noteType: "bibliography"` /
  `noteType: "reading_order"`. No schema changes.
- **Option B** — extend `PhilosopherDetailDto` with structured
  `concepts`, `bibliography`, `readingOrder` fields. Requires F#
  DTO + query + OpenAPI regen + seed format versioning.

Recommendation in the case-study doc: Option A for now; revisit
after 2–3 case studies inform the true shape. Decision belongs to
the implementation ticket, not the docs branch.

### 2.9 Logic-explorer route shape and storage

From `logic-explorer-tab.md`:

- **Route shape** — nested layout (`logic/__root.tsx` with children)
  vs. flat sibling routes. Phase 1 can pick either; the nested
  layout earns its keep when we want shared chrome across
  index / per-system / compare.
- **Storage migration** — system and proposition records live in
  `data/seed/logic-systems.json` and `data/seed/logic-propositions.json`
  initially. When do they move to Postgres? Probably when (a)
  content grows past hand-editable scale or (b) we want
  user-authored systems/propositions.

---

## 3. Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Scope creep (see §1) | High | High | Cut to 80/20 if velocity is off after first two tickets. |
| Lean cold-start latency kills UX | Medium | Medium | Cache aggressively; long-running Lean service if needed. See `formal-verification.md` §4. |
| Custom structured editor is a tar pit | Medium | High | Consider text-DSL-only as a fallback; revisit after parser is built. |
| Faithful Frege formalization is philosophically contested | Medium | Low | Ship multiple interpretations as switchable; document assumptions. |
| Unrestricted comprehension / Russell's paradox when extending to Grundgesetze | Low (we won't extend) | Catastrophic if ignored | Restrict to 1879 fragment; flag in UI. See `formal-verification.md` §5. |
| User-supplied input executing as Lean code | Medium | High | Process-level sandbox, timeouts, resource limits. See `formal-verification.md` §4.3. |

---

## 4. Dependencies we'd need to add

None are urgent; each gets added by the ticket that first needs it.

- Web: KaTeX (or MathJax) for linear-symbolic notation.
- Web: parsimmon or peggy for short-form DSL parsing.
- F#: FParsec for server-side DSL parsing.
- Infra: Lean 4 toolchain (`lake`, `elan`) on the backend host or a
  sidecar container.
- Infra: Neo4j driver + deployment (future; currently covered by the
  in-memory graph).

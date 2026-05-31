namespace PhilosophyExplorer.Db

open System
open System.Data
open Dapper

/// Forward-only, ordered, journaled schema migrations. See docs/db-migrations.md.
///
/// Each migration runs at most once per database, recorded by id in the
/// `schema_migrations` journal. The list is **append-only**: never edit or
/// reorder a migration that has shipped — add a new one at the end. A lagging
/// store (prod deploys on a tag; dev on every push) catches up by applying its
/// backlog in order on its next deploy.
///
/// Division of labour: Migrations own *structure* (DDL); Db/Seed.fs owns
/// idempotent *content* (the JSON-driven inserts) and calls `Migrations.run`
/// first.
module Migrations =

    type Migration =
        { Id: string
          Up: IDbConnection -> IDbTransaction -> unit }

    /// Execute a (possibly multi-statement) SQL string inside the migration's
    /// transaction. Microsoft.Data.Sqlite requires Command.Transaction to be set
    /// when a transaction is open on the connection; Npgsql runs the batched
    /// statements together.
    let private exec (conn: IDbConnection) (tx: IDbTransaction) (sql: string) =
        use cmd = conn.CreateCommand()
        cmd.Transaction <- tx
        cmd.CommandText <- sql
        cmd.ExecuteNonQuery() |> ignore

    // ── 0001_baseline ───────────────────────────────────────────────────────
    // The full schema as of the introduction of the migration runner. Every
    // statement is `… IF NOT EXISTS`, so on a database that already carries this
    // schema (the live dev/prod stores) the baseline is a no-op that simply gets
    // recorded; on a fresh database it builds everything. SQLite's
    // datetime('now') defaults are substituted per dialect.
    let private baselineUp (conn: IDbConnection) (tx: IDbTransaction) =
        let tsDefault =
            match DbFactory.dialect with
            | DbFactory.Postgres -> "now()::text"
            | DbFactory.SQLite -> "datetime('now')"
        let ddl =
            """
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
            CREATE TABLE IF NOT EXISTS schools (
                id TEXT PRIMARY KEY,
                slug TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                also_known_as TEXT,
                period_start_year INTEGER,
                period_end_year INTEGER,
                period_certainty TEXT NOT NULL DEFAULT 'unknown',
                description TEXT,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
            CREATE TABLE IF NOT EXISTS philosophers (
                id TEXT PRIMARY KEY,
                slug TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                also_known_as TEXT,
                born_year INTEGER,
                born_year_end INTEGER,
                born_certainty TEXT NOT NULL DEFAULT 'unknown',
                died_year INTEGER,
                died_year_end INTEGER,
                died_certainty TEXT NOT NULL DEFAULT 'unknown',
                nationality TEXT,
                bio_short TEXT,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
            CREATE TABLE IF NOT EXISTS philosopher_schools (
                id TEXT PRIMARY KEY,
                philosopher_id TEXT NOT NULL REFERENCES philosophers(id) ON DELETE CASCADE,
                school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
                role TEXT NOT NULL DEFAULT 'member',
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
            CREATE UNIQUE INDEX IF NOT EXISTS ps_philosopher_school_role_idx
                ON philosopher_schools(philosopher_id, school_id, role);
            CREATE TABLE IF NOT EXISTS philosopher_influences (
                id TEXT PRIMARY KEY,
                influencer_id TEXT NOT NULL REFERENCES philosophers(id) ON DELETE CASCADE,
                influenced_id TEXT NOT NULL REFERENCES philosophers(id) ON DELETE CASCADE,
                influence_type TEXT NOT NULL DEFAULT 'direct',
                description TEXT,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
            CREATE UNIQUE INDEX IF NOT EXISTS pi_pair_type_idx
                ON philosopher_influences(influencer_id, influenced_id, influence_type);
            CREATE TABLE IF NOT EXISTS works (
                id TEXT PRIMARY KEY,
                slug TEXT NOT NULL UNIQUE,
                title TEXT NOT NULL,
                original_title TEXT,
                philosopher_id TEXT NOT NULL REFERENCES philosophers(id) ON DELETE RESTRICT,
                work_type TEXT NOT NULL DEFAULT 'other',
                composed_year INTEGER,
                composed_year_end INTEGER,
                composed_certainty TEXT NOT NULL DEFAULT 'unknown',
                original_language TEXT,
                description_short TEXT,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
            CREATE TABLE IF NOT EXISTS notes (
                id TEXT PRIMARY KEY,
                content TEXT NOT NULL,
                note_type TEXT NOT NULL DEFAULT 'other',
                source_type TEXT NOT NULL DEFAULT 'manual',
                source_name TEXT,
                source_url TEXT,
                philosopher_id TEXT REFERENCES philosophers(id) ON DELETE CASCADE,
                work_id TEXT REFERENCES works(id) ON DELETE CASCADE,
                school_id TEXT REFERENCES schools(id) ON DELETE CASCADE,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
            CREATE TABLE IF NOT EXISTS arguments (
                id TEXT PRIMARY KEY,
                extraction_id TEXT NOT NULL UNIQUE,
                -- origin: 'import' (seeded from claim_extractor) | 'user' (created in-app).
                origin TEXT NOT NULL DEFAULT 'import',
                work_id TEXT REFERENCES works(id) ON DELETE SET NULL,
                source_file TEXT,
                source_start_line INTEGER,
                source_end_line INTEGER,
                source_excerpt TEXT,
                intent TEXT NOT NULL,
                extractor_note TEXT,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
            CREATE TABLE IF NOT EXISTS argument_clauses (
                id TEXT PRIMARY KEY,
                argument_id TEXT NOT NULL REFERENCES arguments(id) ON DELETE CASCADE,
                role TEXT NOT NULL,
                position INTEGER NOT NULL,
                verbal_text TEXT,
                source_excerpt TEXT,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
            CREATE UNIQUE INDEX IF NOT EXISTS argument_clauses_pos_idx
                ON argument_clauses(argument_id, position);
            CREATE TABLE IF NOT EXISTS argument_formalizations (
                id TEXT PRIMARY KEY,
                argument_id TEXT NOT NULL REFERENCES arguments(id) ON DELETE CASCADE,
                formalism TEXT NOT NULL,
                is_primary INTEGER NOT NULL DEFAULT 0,
                fit_score REAL,
                reason TEXT,
                distortion_risk TEXT,
                ast_json TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
            CREATE UNIQUE INDEX IF NOT EXISTS argument_formalizations_arg_form_idx
                ON argument_formalizations(argument_id, formalism, is_primary);
            CREATE TABLE IF NOT EXISTS argument_formalism_assessments (
                id TEXT PRIMARY KEY,
                argument_id TEXT NOT NULL REFERENCES arguments(id) ON DELETE CASCADE,
                formalism TEXT NOT NULL,
                fit_score REAL NOT NULL,
                reason TEXT NOT NULL,
                distortion_risk TEXT,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
            CREATE UNIQUE INDEX IF NOT EXISTS argument_assessments_arg_form_idx
                ON argument_formalism_assessments(argument_id, formalism);
            CREATE TABLE IF NOT EXISTS argument_reviewer_notes (
                id TEXT PRIMARY KEY,
                argument_id TEXT NOT NULL REFERENCES arguments(id) ON DELETE CASCADE,
                position INTEGER NOT NULL,
                note TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
            CREATE UNIQUE INDEX IF NOT EXISTS argument_reviewer_notes_pos_idx
                ON argument_reviewer_notes(argument_id, position);
            CREATE TABLE IF NOT EXISTS argument_attributions (
                id TEXT PRIMARY KEY,
                argument_id TEXT NOT NULL REFERENCES arguments(id) ON DELETE CASCADE,
                philosopher_id TEXT NOT NULL REFERENCES philosophers(id) ON DELETE RESTRICT,
                work_id TEXT REFERENCES works(id) ON DELETE SET NULL,
                formalization_id TEXT REFERENCES argument_formalizations(id) ON DELETE SET NULL,
                provenance TEXT NOT NULL DEFAULT 'auto',
                source_text TEXT,
                note TEXT,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
            CREATE INDEX IF NOT EXISTS argument_attributions_arg_idx
                ON argument_attributions(argument_id);
            CREATE INDEX IF NOT EXISTS argument_attributions_phil_idx
                ON argument_attributions(philosopher_id);
            """.Replace("datetime('now')", tsDefault)
        exec conn tx ddl
        // Defensive additive column for any store whose `arguments` table
        // predates `origin` (the live dev/prod stores already have it → no-op).
        // Postgres-only: SQLite has no ADD COLUMN IF NOT EXISTS, and SQLite dev
        // is recreated on schema change.
        match DbFactory.dialect with
        | DbFactory.Postgres ->
            exec conn tx "ALTER TABLE arguments ADD COLUMN IF NOT EXISTS origin TEXT NOT NULL DEFAULT 'import';"
        | DbFactory.SQLite -> ()

    /// Ordered, append-only migration list. Add new migrations at the end.
    let private migrations : Migration list =
        [ { Id = "0001_baseline"; Up = baselineUp } ]

    let private ensureJournal (conn: IDbConnection) =
        conn.Execute(
            "CREATE TABLE IF NOT EXISTS schema_migrations (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL)")
        |> ignore

    /// Ids recorded in the journal (creates the journal table if missing).
    let appliedIds (conn: IDbConnection) : Set<string> =
        ensureJournal conn
        conn.Query<string>("SELECT id FROM schema_migrations") |> Set.ofSeq

    /// Latest applied migration id, or None. Tolerant of a missing journal table
    /// so the health endpoint can call it before any migration has run.
    let latestApplied (conn: IDbConnection) : string option =
        try
            conn.Query<string>("SELECT id FROM schema_migrations ORDER BY id DESC LIMIT 1")
            |> Seq.tryHead
        with _ -> None

    /// Apply every migration not yet recorded, in order, each in its own
    /// transaction. The recorded timestamp is set from F# (dialect-neutral).
    let run (conn: IDbConnection) =
        ensureJournal conn
        let applied = conn.Query<string>("SELECT id FROM schema_migrations") |> Set.ofSeq
        let mutable n = 0
        for m in migrations do
            if not (applied.Contains m.Id) then
                use tx = conn.BeginTransaction()
                m.Up conn tx
                conn.Execute(
                    "INSERT INTO schema_migrations (id, applied_at) VALUES (@Id, @At)",
                    {| Id = m.Id; At = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss") |},
                    transaction = tx)
                |> ignore
                tx.Commit()
                printfn $"  ~ migration applied: {m.Id}"
                n <- n + 1
        if n = 0 then printfn "  ~ migrations: up to date"

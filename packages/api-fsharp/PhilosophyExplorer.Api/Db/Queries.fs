namespace PhilosophyExplorer.Db

open System
open System.Data
open System.Text.Json.Nodes
open Dapper
open PhilosophyExplorer.Domain

/// Raw SQL queries using Dapper for both Postgres and SQLite.
/// Column names match the DB schema (snake_case); Dapper maps to PascalCase via DefaultTypeMap.
module Queries =

    // Configure Dapper to map snake_case columns to PascalCase properties.
    // This must be called explicitly at each process entry point. A bare
    // module-level `do` is not reliable here: the `Queries` module's other
    // bindings are all functions, so nothing forces the module's static
    // initializer to run before the first query — leaving the flag unset and
    // every snake_case column silently mapping to null.
    let configureDapper () =
        Dapper.DefaultTypeMap.MatchNamesWithUnderscores <- true

    let private openConn () =
        let conn = DbFactory.createConnection ()
        conn.Open()
        conn

    let listPhilosophers () =
        task {
            use conn = openConn ()
            let! rows =
                conn.QueryAsync<Philosopher>(
                    "SELECT id, slug, name, also_known_as, born_year, born_year_end, born_certainty,
                            died_year, died_year_end, died_certainty, nationality, bio_short,
                            created_at, updated_at
                     FROM philosophers ORDER BY born_year ASC NULLS LAST"
                )
            return rows |> Seq.toList
        }

    let getPhilosopherBySlug (slug: string) =
        task {
            use conn = openConn ()
            let! rows =
                conn.QueryAsync<Philosopher>(
                    "SELECT id, slug, name, also_known_as, born_year, born_year_end, born_certainty,
                            died_year, died_year_end, died_certainty, nationality, bio_short,
                            created_at, updated_at
                     FROM philosophers WHERE slug = @Slug",
                    {| Slug = slug |}
                )
            return rows |> Seq.tryHead
        }

    [<CLIMutable>]
    type WorkRow =
        { Id: string; Slug: string; Title: string; OriginalTitle: string
          WorkType: string; ComposedYear: System.Nullable<int>; ComposedYearEnd: System.Nullable<int>
          ComposedCertainty: string; OriginalLanguage: string; DescriptionShort: string }

    let getWorksByPhilosopherId (philosopherId: string) =
        task {
            use conn = openConn ()
            let! rows =
                conn.QueryAsync<WorkRow>(
                    "SELECT id, slug, title, original_title, work_type, composed_year, composed_year_end,
                            composed_certainty, original_language, description_short
                     FROM works WHERE philosopher_id = @PhilosopherId
                     ORDER BY composed_year ASC NULLS LAST",
                    {| PhilosopherId = philosopherId |}
                )
            return rows |> Seq.toList
        }

    [<CLIMutable>]
    type SchoolMembershipRow =
        { Id: string; Slug: string; Name: string; Role: string }

    let getSchoolMembershipsByPhilosopherId (philosopherId: string) =
        task {
            use conn = openConn ()
            let! rows =
                conn.QueryAsync<SchoolMembershipRow>(
                    "SELECT s.id, s.slug, s.name, ps.role
                     FROM philosopher_schools ps
                     INNER JOIN schools s ON ps.school_id = s.id
                     WHERE ps.philosopher_id = @PhilosopherId",
                    {| PhilosopherId = philosopherId |}
                )
            return rows |> Seq.toList
        }

    [<CLIMutable>]
    type RelatedPhilosopherRow =
        { Id: string; Slug: string; Name: string; InfluenceType: string; Description: string }

    let getOutgoingInfluences (philosopherId: string) =
        task {
            use conn = openConn ()
            let! rows =
                conn.QueryAsync<RelatedPhilosopherRow>(
                    "SELECT p.id, p.slug, p.name, pi.influence_type, pi.description
                     FROM philosopher_influences pi
                     INNER JOIN philosophers p ON pi.influenced_id = p.id
                     WHERE pi.influencer_id = @PhilosopherId",
                    {| PhilosopherId = philosopherId |}
                )
            return rows |> Seq.toList
        }

    let getIncomingInfluences (philosopherId: string) =
        task {
            use conn = openConn ()
            let! rows =
                conn.QueryAsync<RelatedPhilosopherRow>(
                    "SELECT p.id, p.slug, p.name, pi.influence_type, pi.description
                     FROM philosopher_influences pi
                     INNER JOIN philosophers p ON pi.influencer_id = p.id
                     WHERE pi.influenced_id = @PhilosopherId",
                    {| PhilosopherId = philosopherId |}
                )
            return rows |> Seq.toList
        }

    [<CLIMutable>]
    type NoteRow =
        { Id: string; Content: string; NoteType: string; SourceType: string
          SourceName: string; SourceUrl: string }

    let getNotesByPhilosopherId (philosopherId: string) =
        task {
            use conn = openConn ()
            let! rows =
                conn.QueryAsync<NoteRow>(
                    "SELECT id, content, note_type, source_type, source_name, source_url
                     FROM notes WHERE philosopher_id = @PhilosopherId",
                    {| PhilosopherId = philosopherId |}
                )
            return rows |> Seq.toList
        }

    // ── Works catalog ────────────────────────────────────────────────────

    [<CLIMutable>]
    type WorkListRow =
        { Id: string; Slug: string; Title: string; OriginalTitle: string
          WorkType: string; ComposedYear: System.Nullable<int>; ComposedYearEnd: System.Nullable<int>
          ComposedCertainty: string; OriginalLanguage: string; DescriptionShort: string
          PhilosopherId: string; PhilosopherName: string; PhilosopherSlug: string }

    let listWorks () =
        task {
            use conn = openConn ()
            let! rows =
                conn.QueryAsync<WorkListRow>(
                    "SELECT w.id, w.slug, w.title, w.original_title, w.work_type,
                            w.composed_year, w.composed_year_end, w.composed_certainty,
                            w.original_language, w.description_short,
                            w.philosopher_id, p.name AS philosopher_name, p.slug AS philosopher_slug
                     FROM works w
                     INNER JOIN philosophers p ON w.philosopher_id = p.id
                     ORDER BY p.name ASC, w.composed_year ASC NULLS LAST"
                )
            return rows |> Seq.toList
        }

    let getWorkBySlug (slug: string) =
        task {
            use conn = openConn ()
            let! rows =
                conn.QueryAsync<WorkListRow>(
                    "SELECT w.id, w.slug, w.title, w.original_title, w.work_type,
                            w.composed_year, w.composed_year_end, w.composed_certainty,
                            w.original_language, w.description_short,
                            w.philosopher_id, p.name AS philosopher_name, p.slug AS philosopher_slug
                     FROM works w
                     INNER JOIN philosophers p ON w.philosopher_id = p.id
                     WHERE w.slug = @Slug",
                    {| Slug = slug |}
                )
            return rows |> Seq.tryHead
        }

    let getNotesByWorkId (workId: string) =
        task {
            use conn = openConn ()
            let! rows =
                conn.QueryAsync<NoteRow>(
                    "SELECT id, content, note_type, source_type, source_name, source_url
                     FROM notes WHERE work_id = @WorkId",
                    {| WorkId = workId |}
                )
            return rows |> Seq.toList
        }

    // ── Schools ──────────────────────────────────────────────────────────

    let listSchools () =
        task {
            use conn = openConn ()
            let! rows =
                conn.QueryAsync<School>(
                    "SELECT id, slug, name, also_known_as, period_start_year, period_end_year,
                            period_certainty, description, created_at, updated_at
                     FROM schools ORDER BY period_start_year ASC NULLS LAST"
                )
            return rows |> Seq.toList
        }

    let getSchoolBySlug (slug: string) =
        task {
            use conn = openConn ()
            let! rows =
                conn.QueryAsync<School>(
                    "SELECT id, slug, name, also_known_as, period_start_year, period_end_year,
                            period_certainty, description, created_at, updated_at
                     FROM schools WHERE slug = @Slug",
                    {| Slug = slug |}
                )
            return rows |> Seq.tryHead
        }

    [<CLIMutable>]
    type SchoolMemberRow =
        { Id: string; Slug: string; Name: string; Nationality: string
          BornYear: System.Nullable<int>; BornCertainty: string
          DiedYear: System.Nullable<int>; DiedCertainty: string; Role: string }

    let getSchoolMembers (schoolId: string) =
        task {
            use conn = openConn ()
            let! rows =
                conn.QueryAsync<SchoolMemberRow>(
                    "SELECT p.id, p.slug, p.name, p.nationality,
                            p.born_year, p.born_certainty, p.died_year, p.died_certainty,
                            ps.role
                     FROM philosopher_schools ps
                     INNER JOIN philosophers p ON ps.philosopher_id = p.id
                     WHERE ps.school_id = @SchoolId
                     ORDER BY p.born_year ASC NULLS LAST",
                    {| SchoolId = schoolId |}
                )
            return rows |> Seq.toList
        }

    // ── Arguments ────────────────────────────────────────────────────────

    [<CLIMutable>]
    type ArgumentSummaryRow =
        { Id: string; ExtractionId: string; WorkId: string
          WorkSlug: string; WorkTitle: string
          Intent: string
          PrimaryFormalism: string; ClauseCount: int }

    let private summarySql =
        "SELECT a.id, a.extraction_id, a.work_id,
                w.slug AS work_slug, w.title AS work_title,
                a.intent,
                (SELECT f.formalism FROM argument_formalizations f
                 WHERE f.argument_id = a.id AND f.is_primary = 1 LIMIT 1) AS primary_formalism,
                (SELECT COUNT(*) FROM argument_clauses c WHERE c.argument_id = a.id) AS clause_count
         FROM arguments a
         LEFT JOIN works w ON a.work_id = w.id"

    let listArguments () =
        task {
            use conn = openConn ()
            let! rows =
                conn.QueryAsync<ArgumentSummaryRow>(
                    summarySql + " ORDER BY a.extraction_id ASC")
            return rows |> Seq.toList
        }

    let listArgumentsByWorkSlug (slug: string) =
        task {
            use conn = openConn ()
            let! rows =
                conn.QueryAsync<ArgumentSummaryRow>(
                    summarySql + " WHERE w.slug = @Slug ORDER BY a.extraction_id ASC",
                    {| Slug = slug |})
            return rows |> Seq.toList
        }

    [<CLIMutable>]
    type ArgumentHeaderRow =
        { Id: string; ExtractionId: string; WorkId: string
          WorkSlug: string; WorkTitle: string
          SourceFile: string
          SourceStartLine: System.Nullable<int>; SourceEndLine: System.Nullable<int>
          SourceExcerpt: string
          Intent: string; ExtractorNote: string }

    let getArgumentHeader (id: string) =
        task {
            use conn = openConn ()
            let! rows =
                conn.QueryAsync<ArgumentHeaderRow>(
                    "SELECT a.id, a.extraction_id, a.work_id,
                            w.slug AS work_slug, w.title AS work_title,
                            a.source_file, a.source_start_line, a.source_end_line, a.source_excerpt,
                            a.intent, a.extractor_note
                     FROM arguments a
                     LEFT JOIN works w ON a.work_id = w.id
                     WHERE a.id = @Id",
                    {| Id = id |})
            return rows |> Seq.tryHead
        }

    [<CLIMutable>]
    type ArgumentClauseQueryRow =
        { Id: string; Role: string; Position: int
          VerbalText: string; SourceExcerpt: string }

    let getArgumentClauses (argumentId: string) =
        task {
            use conn = openConn ()
            let! rows =
                conn.QueryAsync<ArgumentClauseQueryRow>(
                    "SELECT id, role, position, verbal_text, source_excerpt
                     FROM argument_clauses
                     WHERE argument_id = @Aid
                     ORDER BY position ASC",
                    {| Aid = argumentId |})
            return rows |> Seq.toList
        }

    [<CLIMutable>]
    type ArgumentFormalizationQueryRow =
        { Id: string; Formalism: string; IsPrimary: bool
          FitScore: System.Nullable<double>
          Reason: string; DistortionRisk: string; AstJson: string }

    let getArgumentFormalizations (argumentId: string) =
        task {
            use conn = openConn ()
            let! rows =
                conn.QueryAsync<ArgumentFormalizationQueryRow>(
                    "SELECT id, formalism, is_primary, fit_score, reason, distortion_risk, ast_json
                     FROM argument_formalizations
                     WHERE argument_id = @Aid
                     ORDER BY is_primary DESC, formalism ASC",
                    {| Aid = argumentId |})
            return rows |> Seq.toList
        }

    [<CLIMutable>]
    type ArgumentAssessmentQueryRow =
        { Formalism: string; FitScore: double
          Reason: string; DistortionRisk: string }

    let getArgumentAssessments (argumentId: string) =
        task {
            use conn = openConn ()
            let! rows =
                conn.QueryAsync<ArgumentAssessmentQueryRow>(
                    "SELECT formalism, fit_score, reason, distortion_risk
                     FROM argument_formalism_assessments
                     WHERE argument_id = @Aid
                     ORDER BY fit_score DESC",
                    {| Aid = argumentId |})
            return rows |> Seq.toList
        }

    let getArgumentReviewerNotes (argumentId: string) =
        task {
            use conn = openConn ()
            let! rows =
                conn.QueryAsync<string>(
                    "SELECT note FROM argument_reviewer_notes
                     WHERE argument_id = @Aid
                     ORDER BY position ASC",
                    {| Aid = argumentId |})
            return rows |> Seq.toList
        }

    [<CLIMutable>]
    type ArgumentAttributionQueryRow =
        { Id: string
          PhilosopherId: string; PhilosopherSlug: string; PhilosopherName: string
          WorkId: string; WorkSlug: string; WorkTitle: string
          FormalizationId: string
          Provenance: string; SourceText: string; Note: string }

    let getArgumentAttributions (argumentId: string) =
        task {
            use conn = openConn ()
            let! rows =
                conn.QueryAsync<ArgumentAttributionQueryRow>(
                    "SELECT a.id,
                            p.id AS philosopher_id, p.slug AS philosopher_slug, p.name AS philosopher_name,
                            a.work_id, w.slug AS work_slug, w.title AS work_title,
                            a.formalization_id, a.provenance, a.source_text, a.note
                     FROM argument_attributions a
                     INNER JOIN philosophers p ON a.philosopher_id = p.id
                     LEFT JOIN works w ON a.work_id = w.id
                     WHERE a.argument_id = @Aid
                     ORDER BY a.created_at ASC",
                    {| Aid = argumentId |})
            return rows |> Seq.toList
        }

    // ── Argument writes (CRUD) ─────────────────────────────────────────────
    // The DB is authoritative for arguments (see work-history/feat-argument-crud.md).
    // The seed importer stays additive (INSERT OR IGNORE), so these writes are
    // never clobbered by a re-seed. Child rows reuse the deterministic id scheme
    // from Db/Seed.fs and are replaced wholesale on update (delete + re-insert in
    // one transaction) rather than diffed.

    /// Canonical formalism set — mirrors claim_extractor FormalismKind and the
    /// web ALL_FORMALISMS. Used to reject unknown formalisms on write.
    let knownFormalisms =
        set [ "fol"; "nd"; "aristotelian"; "dialogical"; "boolean"; "frege"
              "medieval"; "eg"; "kripke"; "epistemic"; "intuitionistic"
              "temporal"; "ctl"; "indian"; "resolution" ]

    let argumentExists (id: string) =
        task {
            use conn = openConn ()
            let! n = conn.ExecuteScalarAsync<int>(
                        "SELECT COUNT(*) FROM arguments WHERE id = @Id", {| Id = id |})
            return n > 0
        }

    // Insert all child rows for an argument inside an open transaction. Returns
    // Error when an attribution names a philosopher/work slug that doesn't exist.
    let private insertArgumentChildren
        (conn: IDbConnection) (tx: IDbTransaction) (argId: string) (dto: WriteArgumentDto) : Result<unit, string> =
        let arr x = if isNull (box x) then [||] else x
        let exec (sql: string) (ps: obj) = conn.Execute(sql, ps, transaction = tx) |> ignore

        // clauses
        for c in arr dto.Clauses do
            exec "INSERT INTO argument_clauses (id, argument_id, role, position, verbal_text, source_excerpt)
                  VALUES (@Id, @Aid, @Role, @Pos, @Vt, @Sex)"
                 {| Id = $"{argId}:clause:{c.Position}"; Aid = argId; Role = c.Role
                    Pos = c.Position; Vt = c.VerbalText; Sex = c.SourceExcerpt |}

        // formalizations — build formalism→id map for attribution refs
        let formIds = System.Collections.Generic.Dictionary<string, string>()
        for f in arr dto.Formalizations do
            let label = if f.IsPrimary then "primary" else "alt"
            let fid = $"{argId}:form:{f.Formalism}:{label}"
            formIds[f.Formalism] <- fid
            let astJson = if isNull (box f.Ast) then "null" else f.Ast.ToJsonString()
            exec "INSERT INTO argument_formalizations
                    (id, argument_id, formalism, is_primary, fit_score, reason, distortion_risk, ast_json)
                  VALUES (@Id, @Aid, @Form, @IsP, @Fs, @R, @Dr, @Ast)"
                 {| Id = fid; Aid = argId; Form = f.Formalism
                    IsP = (if f.IsPrimary then 1 else 0)
                    Fs = f.FitScore; R = f.Reason; Dr = f.DistortionRisk; Ast = astJson |}

        // assessments
        for a in arr dto.Assessments do
            exec "INSERT INTO argument_formalism_assessments
                    (id, argument_id, formalism, fit_score, reason, distortion_risk)
                  VALUES (@Id, @Aid, @Form, @Fs, @R, @Dr)"
                 {| Id = $"{argId}:assess:{a.Formalism}"; Aid = argId; Form = a.Formalism
                    Fs = a.FitScore; R = a.Reason; Dr = a.DistortionRisk |}

        // reviewer notes
        arr dto.ReviewerNotes |> Array.iteri (fun i note ->
            exec "INSERT INTO argument_reviewer_notes (id, argument_id, position, note)
                  VALUES (@Id, @Aid, @Pos, @Note)"
                 {| Id = $"{argId}:note:{i}"; Aid = argId; Pos = i; Note = note |})

        // attributions — resolve philosopher (required) + work (optional) slugs
        let mutable err = None
        arr dto.Attributions |> Array.iteri (fun i at ->
            if err.IsNone then
                let philId =
                    conn.ExecuteScalar<string>(
                        "SELECT id FROM philosophers WHERE slug = @S", {| S = at.PhilosopherSlug |}, transaction = tx)
                if isNull philId then
                    err <- Some $"unknown philosopher slug '{at.PhilosopherSlug}'"
                else
                    let workId =
                        if String.IsNullOrWhiteSpace at.WorkSlug then null
                        else conn.ExecuteScalar<string>(
                                "SELECT id FROM works WHERE slug = @S", {| S = at.WorkSlug |}, transaction = tx)
                    if not (String.IsNullOrWhiteSpace at.WorkSlug) && isNull workId then
                        err <- Some $"unknown work slug '{at.WorkSlug}'"
                    else
                        let formalizationId =
                            if String.IsNullOrWhiteSpace at.FormalismRef then null
                            else match formIds.TryGetValue at.FormalismRef with
                                 | true, v -> v
                                 | _ -> null
                        exec "INSERT INTO argument_attributions
                                (id, argument_id, philosopher_id, work_id, formalization_id, provenance, source_text, note)
                              VALUES (@Id, @Aid, @Pid, @Wid, @Fid, @Prov, @Src, @Note)"
                             {| Id = $"{argId}:attr:{i}"; Aid = argId; Pid = philId; Wid = workId
                                Fid = formalizationId
                                Prov = (if String.IsNullOrWhiteSpace at.Provenance then "hand_written" else at.Provenance)
                                Src = at.SourceText; Note = at.Note |})
        match err with Some e -> Error e | None -> Ok ()

    let private resolveWorkId (conn: IDbConnection) (tx: IDbTransaction) (slug: string) : Result<string, string> =
        if String.IsNullOrWhiteSpace slug then Ok null
        else
            let id = conn.ExecuteScalar<string>("SELECT id FROM works WHERE slug = @S", {| S = slug |}, transaction = tx)
            if isNull id then Error $"unknown work slug '{slug}'" else Ok id

    /// Create a new user-authored argument. `id` is caller-generated; origin='user'.
    let createArgument (id: string) (dto: WriteArgumentDto) : System.Threading.Tasks.Task<Result<unit, string>> =
        task {
            use conn = openConn ()
            use tx = conn.BeginTransaction()
            match resolveWorkId conn tx dto.WorkSlug with
            | Error e -> tx.Rollback(); return Error e
            | Ok workId ->
                conn.Execute(
                    "INSERT INTO arguments
                        (id, extraction_id, origin, work_id, source_file, source_start_line, source_end_line,
                         source_excerpt, intent, extractor_note)
                     VALUES (@Id, @Eid, 'user', @Wid, @Sf, @Ssl, @Sel, @Sex, @Int, @En)",
                    {| Id = id; Eid = id; Wid = workId
                       Sf = dto.SourceFile; Ssl = dto.SourceStartLine; Sel = dto.SourceEndLine
                       Sex = dto.SourceExcerpt; Int = dto.Intent; En = dto.ExtractorNote |},
                    transaction = tx) |> ignore
                match insertArgumentChildren conn tx id dto with
                | Error e -> tx.Rollback(); return Error e
                | Ok () -> tx.Commit(); return Ok ()
        }

    /// Replace an existing argument's header + children in one transaction.
    /// origin is left unchanged (provenance of creation); updated_at is bumped.
    let replaceArgument (id: string) (dto: WriteArgumentDto) : System.Threading.Tasks.Task<Result<unit, string>> =
        task {
            use conn = openConn ()
            use tx = conn.BeginTransaction()
            match resolveWorkId conn tx dto.WorkSlug with
            | Error e -> tx.Rollback(); return Error e
            | Ok workId ->
                conn.Execute(
                    // updated_at is set from F# (dialect-neutral) rather than via
                    // datetime('now'), which is SQLite-only and breaks on Postgres.
                    "UPDATE arguments
                     SET work_id = @Wid, source_file = @Sf, source_start_line = @Ssl, source_end_line = @Sel,
                         source_excerpt = @Sex, intent = @Int, extractor_note = @En, updated_at = @Ua
                     WHERE id = @Id",
                    {| Id = id; Wid = workId
                       Sf = dto.SourceFile; Ssl = dto.SourceStartLine; Sel = dto.SourceEndLine
                       Sex = dto.SourceExcerpt; Int = dto.Intent; En = dto.ExtractorNote
                       Ua = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss") |},
                    transaction = tx) |> ignore
                // Replace children wholesale (delete + re-insert).
                for t in [ "argument_clauses"; "argument_formalizations"
                           "argument_formalism_assessments"; "argument_reviewer_notes"
                           "argument_attributions" ] do
                    conn.Execute($"DELETE FROM {t} WHERE argument_id = @Id", {| Id = id |}, transaction = tx) |> ignore
                match insertArgumentChildren conn tx id dto with
                | Error e -> tx.Rollback(); return Error e
                | Ok () -> tx.Commit(); return Ok ()
        }

    /// Delete an argument. Child rows cascade via FK ON DELETE CASCADE.
    /// Returns rows affected (0 ⇒ not found).
    let deleteArgument (id: string) =
        task {
            use conn = openConn ()
            return conn.Execute("DELETE FROM arguments WHERE id = @Id", {| Id = id |})
        }

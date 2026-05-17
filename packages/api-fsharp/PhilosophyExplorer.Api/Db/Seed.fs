namespace PhilosophyExplorer.Db

open System
open System.IO
open System.Data
open System.Text.Json
open Dapper

module Seed =

    [<CLIMutable>]
    type SchoolSeed =
        { Slug: string; Name: string; AlsoKnownAs: string
          PeriodStartYear: Nullable<int>; PeriodEndYear: Nullable<int>
          PeriodCertainty: string; Description: string }

    [<CLIMutable>]
    type PhilosopherSeed =
        { Slug: string; Name: string; AlsoKnownAs: string
          BornYear: Nullable<int>; BornYearEnd: Nullable<int>; BornCertainty: string
          DiedYear: Nullable<int>; DiedYearEnd: Nullable<int>; DiedCertainty: string
          Nationality: string; BioShort: string }

    [<CLIMutable>]
    type PhilosopherSchoolSeed =
        { PhilosopherSlug: string; SchoolSlug: string; Role: string }

    [<CLIMutable>]
    type InfluenceSeed =
        { InfluencerSlug: string; InfluencedSlug: string; InfluenceType: string; Description: string }

    [<CLIMutable>]
    type WorkSeed =
        { Slug: string; Title: string; OriginalTitle: string; PhilosopherSlug: string
          WorkType: string; ComposedYear: Nullable<int>; ComposedYearEnd: Nullable<int>
          ComposedCertainty: string; OriginalLanguage: string; DescriptionShort: string }

    [<CLIMutable>]
    type NoteSeed =
        { Content: string; NoteType: string
          PhilosopherSlug: string; SchoolSlug: string; WorkSlug: string
          SourceName: string; SourceUrl: string }

    // Argument seed shapes — produced by scripts/build-arguments-seed.mjs
    // from claim_extractor extractions. AST payloads stay as raw JSON strings.

    [<CLIMutable>]
    type ArgumentClauseSeed =
        { Role: string; Position: int
          VerbalText: string; SourceExcerpt: string }

    [<CLIMutable>]
    type ArgumentFormalizationSeed =
        { Formalism: string; IsPrimary: bool
          FitScore: Nullable<double>; Reason: string; DistortionRisk: string
          AstJson: string }

    [<CLIMutable>]
    type ArgumentAssessmentSeed =
        { Formalism: string; FitScore: double
          Reason: string; DistortionRisk: string }

    [<CLIMutable>]
    type ArgumentAttributionSeed =
        { PhilosopherSlug: string
          WorkSlug: string
          // FormalizationLabel: "primary" or "alt:<formalism>" — resolved to a
          // formalization_id at seed time using the same id scheme as the
          // formalizations themselves.
          FormalizationLabel: string
          Provenance: string
          SourceText: string
          Note: string }

    [<CLIMutable>]
    type ArgumentSeed =
        { Id: string; ExtractionId: string; WorkSlug: string
          SourceFile: string
          SourceStartLine: Nullable<int>; SourceEndLine: Nullable<int>
          SourceExcerpt: string; Intent: string; ExtractorNote: string
          Clauses: ArgumentClauseSeed array
          Formalizations: ArgumentFormalizationSeed array
          Assessments: ArgumentAssessmentSeed array
          ReviewerNotes: string array
          Attributions: ArgumentAttributionSeed array }

    let private jsonOpts =
        let opts = JsonSerializerOptions(PropertyNameCaseInsensitive = true)
        opts.PropertyNamingPolicy <- JsonNamingPolicy.CamelCase
        opts

    let private readJson<'T> (path: string) : 'T =
        let json = File.ReadAllText(path)
        JsonSerializer.Deserialize<'T>(json, jsonOpts)

    let private createTables (conn: IDbConnection) =
        let cmd = conn.CreateCommand()
        cmd.CommandText <- """
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
        """
        cmd.ExecuteNonQuery() |> ignore

    [<CLIMutable>]
    type SlugId = { Slug: string; Id: string }

    let run (seedDir: string) =
        printfn "Seeding database..."
        Queries.configureDapper ()
        use conn = DbFactory.createConnection ()
        conn.Open()

        if DbFactory.dialect = DbFactory.SQLite then
            createTables conn

        let defaultUserId = "00000000-0000-0000-0000-000000000001"
        conn.Execute(
            "INSERT OR IGNORE INTO users (id, name, email) VALUES (@Id, @Name, @Email)",
            {| Id = defaultUserId; Name = "Default User"; Email = "user@example.com" |}) |> ignore
        printfn "  + default user"

        let schools = readJson<SchoolSeed array>(Path.Combine(seedDir, "schools.json"))
        for s in schools do
            let id = Guid.NewGuid().ToString()
            conn.Execute(
                "INSERT OR IGNORE INTO schools (id, slug, name, also_known_as, period_start_year, period_end_year, period_certainty, description)
                 VALUES (@Id, @Slug, @Name, @Aka, @PsYear, @PeYear, @Cert, @Desc)",
                {| Id = id; Slug = s.Slug; Name = s.Name; Aka = s.AlsoKnownAs
                   PsYear = s.PeriodStartYear; PeYear = s.PeriodEndYear
                   Cert = s.PeriodCertainty; Desc = s.Description |}) |> ignore
        printfn $"  + schools ({schools.Length})"

        let philosophers = readJson<PhilosopherSeed array>(Path.Combine(seedDir, "philosophers.json"))
        for p in philosophers do
            let id = Guid.NewGuid().ToString()
            conn.Execute(
                "INSERT OR IGNORE INTO philosophers (id, slug, name, also_known_as, born_year, born_year_end, born_certainty, died_year, died_year_end, died_certainty, nationality, bio_short)
                 VALUES (@Id, @Slug, @Name, @Aka, @By, @Bye, @Bc, @Dy, @Dye, @Dc, @Nat, @Bio)",
                {| Id = id; Slug = p.Slug; Name = p.Name; Aka = p.AlsoKnownAs
                   By = p.BornYear; Bye = p.BornYearEnd; Bc = p.BornCertainty
                   Dy = p.DiedYear; Dye = p.DiedYearEnd; Dc = p.DiedCertainty
                   Nat = p.Nationality; Bio = p.BioShort |}) |> ignore
        printfn $"  + philosophers ({philosophers.Length})"

        let philMap =
            conn.Query<SlugId>("SELECT slug, id FROM philosophers")
            |> Seq.map (fun r -> r.Slug, r.Id) |> dict
        let schoolMap =
            conn.Query<SlugId>("SELECT slug, id FROM schools")
            |> Seq.map (fun r -> r.Slug, r.Id) |> dict

        let psData = readJson<PhilosopherSchoolSeed array>(Path.Combine(seedDir, "philosopher-schools.json"))
        for ps in psData do
            match philMap.TryGetValue(ps.PhilosopherSlug), schoolMap.TryGetValue(ps.SchoolSlug) with
            | (true, pid), (true, sid) ->
                let id = Guid.NewGuid().ToString()
                conn.Execute(
                    "INSERT OR IGNORE INTO philosopher_schools (id, philosopher_id, school_id, role) VALUES (@Id, @Pid, @Sid, @Role)",
                    {| Id = id; Pid = pid; Sid = sid; Role = ps.Role |}) |> ignore
            | _ -> eprintfn $"  ! unknown slug in ps: {ps.PhilosopherSlug}/{ps.SchoolSlug}"
        printfn $"  + philosopher-school ({psData.Length})"

        let infData = readJson<InfluenceSeed array>(Path.Combine(seedDir, "philosopher-influences.json"))
        for inf in infData do
            match philMap.TryGetValue(inf.InfluencerSlug), philMap.TryGetValue(inf.InfluencedSlug) with
            | (true, ierId), (true, iedId) ->
                let id = Guid.NewGuid().ToString()
                conn.Execute(
                    "INSERT OR IGNORE INTO philosopher_influences (id, influencer_id, influenced_id, influence_type, description) VALUES (@Id, @Ier, @Ied, @Typ, @Desc)",
                    {| Id = id; Ier = ierId; Ied = iedId; Typ = inf.InfluenceType; Desc = inf.Description |}) |> ignore
            | _ -> eprintfn $"  ! unknown slug in inf: {inf.InfluencerSlug}/{inf.InfluencedSlug}"
        printfn $"  + influences ({infData.Length})"

        let worksData = readJson<WorkSeed array>(Path.Combine(seedDir, "works.json"))
        for w in worksData do
            match philMap.TryGetValue(w.PhilosopherSlug) with
            | true, pid ->
                let id = Guid.NewGuid().ToString()
                conn.Execute(
                    "INSERT OR IGNORE INTO works (id, slug, title, original_title, philosopher_id, work_type, composed_year, composed_year_end, composed_certainty, original_language, description_short)
                     VALUES (@Id, @Slug, @Title, @OTitle, @Pid, @Wt, @Cy, @Cye, @Cc, @Lang, @Desc)",
                    {| Id = id; Slug = w.Slug; Title = w.Title; OTitle = w.OriginalTitle; Pid = pid
                       Wt = w.WorkType; Cy = w.ComposedYear; Cye = w.ComposedYearEnd
                       Cc = w.ComposedCertainty; Lang = w.OriginalLanguage; Desc = w.DescriptionShort |}) |> ignore
            | _ -> eprintfn $"  ! unknown philosopher for work: {w.PhilosopherSlug}"
        printfn $"  + works ({worksData.Length})"

        let notesData = readJson<NoteSeed array>(Path.Combine(seedDir, "notes.json"))
        let workMap =
            conn.Query<SlugId>("SELECT slug, id FROM works")
            |> Seq.map (fun r -> r.Slug, r.Id) |> dict

        for n in notesData do
            let philId = if String.IsNullOrEmpty n.PhilosopherSlug then null else match philMap.TryGetValue(n.PhilosopherSlug) with true, v -> v | _ -> null
            let schoolId = if String.IsNullOrEmpty n.SchoolSlug then null else match schoolMap.TryGetValue(n.SchoolSlug) with true, v -> v | _ -> null
            let workId = if String.IsNullOrEmpty n.WorkSlug then null else match workMap.TryGetValue(n.WorkSlug) with true, v -> v | _ -> null
            let id = Guid.NewGuid().ToString()
            conn.Execute(
                "INSERT INTO notes (id, content, note_type, source_type, source_name, source_url, philosopher_id, work_id, school_id)
                 VALUES (@Id, @Content, @NType, 'seed', @SName, @SUrl, @PhilId, @WorkId, @SchoolId)",
                {| Id = id; Content = n.Content; NType = n.NoteType; SName = n.SourceName
                   SUrl = n.SourceUrl; PhilId = philId; WorkId = workId; SchoolId = schoolId |}) |> ignore
        printfn $"  + notes ({notesData.Length})"

        // ── Arguments ────────────────────────────────────────────────────────
        // Optional — only loads if data/seed/arguments.json exists. Built by
        // scripts/build-arguments-seed.mjs from the claim_extractor extractions.
        let argsPath = Path.Combine(seedDir, "arguments.json")
        if File.Exists argsPath then
            let argsData = readJson<ArgumentSeed array>(argsPath)
            let mutable insertedArgs = 0
            for a in argsData do
                let workId =
                    if String.IsNullOrEmpty a.WorkSlug then null
                    else match workMap.TryGetValue(a.WorkSlug) with true, v -> v | _ -> null
                let inserted =
                    conn.Execute(
                        "INSERT OR IGNORE INTO arguments
                            (id, extraction_id, work_id, source_file, source_start_line, source_end_line,
                             source_excerpt, intent, extractor_note)
                         VALUES (@Id, @Eid, @Wid, @Sf, @Ssl, @Sel, @Sex, @Int, @En)",
                        {| Id = a.Id; Eid = a.ExtractionId; Wid = workId
                           Sf = a.SourceFile; Ssl = a.SourceStartLine; Sel = a.SourceEndLine
                           Sex = a.SourceExcerpt; Int = a.Intent; En = a.ExtractorNote |})
                if inserted = 0 then () // already present — skip children too, keep idempotent
                else
                    insertedArgs <- insertedArgs + 1
                    for c in a.Clauses do
                        let cid = $"{a.Id}:clause:{c.Position}"
                        conn.Execute(
                            "INSERT OR IGNORE INTO argument_clauses
                                (id, argument_id, role, position, verbal_text, source_excerpt)
                             VALUES (@Id, @Aid, @Role, @Pos, @Vt, @Sex)",
                            {| Id = cid; Aid = a.Id; Role = c.Role; Pos = c.Position
                               Vt = c.VerbalText; Sex = c.SourceExcerpt |}) |> ignore
                    for f in a.Formalizations do
                        let label = if f.IsPrimary then "primary" else "alt"
                        let fid = $"{a.Id}:form:{f.Formalism}:{label}"
                        conn.Execute(
                            "INSERT OR IGNORE INTO argument_formalizations
                                (id, argument_id, formalism, is_primary, fit_score, reason, distortion_risk, ast_json)
                             VALUES (@Id, @Aid, @Form, @IsP, @Fs, @R, @Dr, @Ast)",
                            {| Id = fid; Aid = a.Id; Form = f.Formalism
                               IsP = (if f.IsPrimary then 1 else 0)
                               Fs = f.FitScore; R = f.Reason; Dr = f.DistortionRisk
                               Ast = f.AstJson |}) |> ignore
                    for asmt in a.Assessments do
                        let aid = $"{a.Id}:assess:{asmt.Formalism}"
                        conn.Execute(
                            "INSERT OR IGNORE INTO argument_formalism_assessments
                                (id, argument_id, formalism, fit_score, reason, distortion_risk)
                             VALUES (@Id, @Aid, @Form, @Fs, @R, @Dr)",
                            {| Id = aid; Aid = a.Id; Form = asmt.Formalism
                               Fs = asmt.FitScore; R = asmt.Reason; Dr = asmt.DistortionRisk |}) |> ignore
                    a.ReviewerNotes |> Array.iteri (fun i note ->
                        let nid = $"{a.Id}:note:{i}"
                        conn.Execute(
                            "INSERT OR IGNORE INTO argument_reviewer_notes
                                (id, argument_id, position, note)
                             VALUES (@Id, @Aid, @Pos, @Note)",
                            {| Id = nid; Aid = a.Id; Pos = i; Note = note |}) |> ignore)
                    if not (isNull (box a.Attributions)) then
                        a.Attributions |> Array.iteri (fun i at ->
                            let philId =
                                match philMap.TryGetValue(at.PhilosopherSlug) with
                                | true, v -> v
                                | _ -> null
                            if isNull philId then
                                eprintfn $"  ! attribution skipped: unknown philosopher slug '{at.PhilosopherSlug}' for {a.Id}"
                            else
                                let workIdAt =
                                    if String.IsNullOrEmpty at.WorkSlug then null
                                    else match workMap.TryGetValue(at.WorkSlug) with
                                         | true, v -> v
                                         | _ -> null
                                let formalizationId =
                                    if String.IsNullOrEmpty at.FormalizationLabel then null
                                    elif at.FormalizationLabel = "primary" then
                                        // primary formalization id = "{argId}:form:{formalism}:primary"
                                        a.Formalizations
                                        |> Array.tryFind (fun f -> f.IsPrimary)
                                        |> Option.map (fun f -> $"{a.Id}:form:{f.Formalism}:primary")
                                        |> Option.defaultValue null
                                    else null
                                let aid = $"{a.Id}:attr:{i}"
                                conn.Execute(
                                    "INSERT OR IGNORE INTO argument_attributions
                                        (id, argument_id, philosopher_id, work_id, formalization_id, provenance, source_text, note)
                                     VALUES (@Id, @Aid, @Pid, @Wid, @Fid, @Prov, @Src, @Note)",
                                    {| Id = aid; Aid = a.Id; Pid = philId; Wid = workIdAt
                                       Fid = formalizationId; Prov = at.Provenance
                                       Src = at.SourceText; Note = at.Note |}) |> ignore)
            printfn $"  + arguments ({insertedArgs} new / {argsData.Length} total)"
        else
            printfn "  ~ arguments.json not present — skip (run npm run arguments:build first)"

        printfn "Done."

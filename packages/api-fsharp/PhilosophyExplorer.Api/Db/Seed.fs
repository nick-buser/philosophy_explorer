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
        """
        cmd.ExecuteNonQuery() |> ignore

    [<CLIMutable>]
    type SlugId = { Slug: string; Id: string }

    let run (seedDir: string) =
        printfn "Seeding database..."
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

        printfn "Done."

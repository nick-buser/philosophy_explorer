namespace PhilosophyExplorer.Db

open System.Data
open Dapper
open PhilosophyExplorer.Domain

/// Raw SQL queries using Dapper for both Postgres and SQLite.
/// Column names match the DB schema (snake_case); Dapper maps to PascalCase via DefaultTypeMap.
module Queries =

    // Configure Dapper to map snake_case columns to PascalCase properties
    do Dapper.DefaultTypeMap.MatchNamesWithUnderscores <- true

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

namespace PhilosophyExplorer.Routes

open System
open Microsoft.AspNetCore.Builder
open Microsoft.AspNetCore.Http
open PhilosophyExplorer.Domain
open PhilosophyExplorer.Db

module CatalogRoutes =

    let private nToOpt (n: Nullable<int>) = if n.HasValue then Some n.Value else None

    let private toWorkListDto (w: Queries.WorkListRow) : WorkListItemDto =
        { Id = w.Id; Slug = w.Slug; Title = w.Title
          OriginalTitle = Option.ofObj w.OriginalTitle
          WorkType = w.WorkType
          ComposedYear = nToOpt w.ComposedYear
          ComposedYearEnd = nToOpt w.ComposedYearEnd
          ComposedCertainty = w.ComposedCertainty
          OriginalLanguage = Option.ofObj w.OriginalLanguage
          DescriptionShort = Option.ofObj w.DescriptionShort
          PhilosopherId = w.PhilosopherId
          PhilosopherName = w.PhilosopherName
          PhilosopherSlug = w.PhilosopherSlug }

    let register (app: WebApplication) =
        // GET /api/works
        app.MapGet("/api/works", Func<IResult>(fun () ->
            task {
                let! works = Queries.listWorks ()
                let dtos = works |> List.map toWorkListDto
                return Results.Json(dtos, statusCode = 200)
            } |> _.Result
        )) |> ignore

        // GET /api/works/{slug}
        app.MapGet("/api/works/{slug}", Func<string, IResult>(fun slug ->
            task {
                let! work = Queries.getWorkBySlug slug
                match work with
                | None ->
                    return Results.Json({ ErrorResponseDto.Error = "Work not found" }, statusCode = 404)
                | Some w ->
                    let! notes = Queries.getNotesByWorkId w.Id
                    let dto: WorkDetailDto =
                        { Id = w.Id; Slug = w.Slug; Title = w.Title
                          OriginalTitle = Option.ofObj w.OriginalTitle
                          WorkType = w.WorkType
                          ComposedYear = nToOpt w.ComposedYear
                          ComposedYearEnd = nToOpt w.ComposedYearEnd
                          ComposedCertainty = w.ComposedCertainty
                          OriginalLanguage = Option.ofObj w.OriginalLanguage
                          DescriptionShort = Option.ofObj w.DescriptionShort
                          PhilosopherId = w.PhilosopherId
                          PhilosopherName = w.PhilosopherName
                          PhilosopherSlug = w.PhilosopherSlug
                          Notes =
                              notes |> List.map (fun n ->
                                  { NoteDto.Id = n.Id; Content = n.Content; NoteType = n.NoteType
                                    SourceType = n.SourceType; SourceName = Option.ofObj n.SourceName
                                    SourceUrl = Option.ofObj n.SourceUrl }) }
                    return Results.Json(dto, statusCode = 200)
            } |> _.Result
        )) |> ignore

        // GET /api/schools
        app.MapGet("/api/schools", Func<IResult>(fun () ->
            task {
                let! schools = Queries.listSchools ()
                let dtos =
                    schools |> List.map (fun s ->
                        { SchoolListItemDto.Id = s.Id; Slug = s.Slug; Name = s.Name
                          AlsoKnownAs = Option.ofObj s.AlsoKnownAs
                          PeriodStartYear = nToOpt s.PeriodStartYear
                          PeriodEndYear = nToOpt s.PeriodEndYear
                          PeriodCertainty = s.PeriodCertainty
                          Description = Option.ofObj s.Description })
                return Results.Json(dtos, statusCode = 200)
            } |> _.Result
        )) |> ignore

        // GET /api/schools/{slug}
        app.MapGet("/api/schools/{slug}", Func<string, IResult>(fun slug ->
            task {
                let! school = Queries.getSchoolBySlug slug
                match school with
                | None ->
                    return Results.Json({ ErrorResponseDto.Error = "School not found" }, statusCode = 404)
                | Some s ->
                    let! members = Queries.getSchoolMembers s.Id
                    let dto: SchoolDetailDto =
                        { Id = s.Id; Slug = s.Slug; Name = s.Name
                          AlsoKnownAs = Option.ofObj s.AlsoKnownAs
                          PeriodStartYear = nToOpt s.PeriodStartYear
                          PeriodEndYear = nToOpt s.PeriodEndYear
                          PeriodCertainty = s.PeriodCertainty
                          Description = Option.ofObj s.Description
                          Members =
                              members |> List.map (fun m ->
                                  { SchoolMemberDto.Id = m.Id; Slug = m.Slug; Name = m.Name
                                    Nationality = Option.ofObj m.Nationality
                                    BornYear = nToOpt m.BornYear
                                    BornCertainty = m.BornCertainty
                                    DiedYear = nToOpt m.DiedYear
                                    DiedCertainty = m.DiedCertainty
                                    Role = m.Role }) }
                    return Results.Json(dto, statusCode = 200)
            } |> _.Result
        )) |> ignore

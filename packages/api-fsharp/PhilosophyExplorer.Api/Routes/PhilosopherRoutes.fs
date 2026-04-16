namespace PhilosophyExplorer.Routes

open System
open Microsoft.AspNetCore.Builder
open Microsoft.AspNetCore.Http
open PhilosophyExplorer.Domain
open PhilosophyExplorer.Db

module PhilosopherRoutes =

    let private nToOpt (n: Nullable<int>) = if n.HasValue then Some n.Value else None

    let private toSummaryDto (p: Philosopher) : PhilosopherSummaryDto =
        { Id = p.Id
          Slug = p.Slug
          Name = p.Name
          AlsoKnownAs = Option.ofObj p.AlsoKnownAs
          BornYear = nToOpt p.BornYear
          BornCertainty = p.BornCertainty
          DiedYear = nToOpt p.DiedYear
          DiedCertainty = p.DiedCertainty
          Nationality = Option.ofObj p.Nationality
          BioShort = Option.ofObj p.BioShort }

    let register (app: WebApplication) =
        app.MapGet("/api/philosophers", Func<IResult>(fun () ->
            task {
                let! philosophers = Queries.listPhilosophers ()
                let dtos = philosophers |> List.map toSummaryDto
                return Results.Json(dtos, statusCode = 200)
            } |> _.Result
        )) |> ignore

        app.MapGet("/api/philosophers/{slug}", Func<string, IResult>(fun slug ->
            task {
                let! philosopher = Queries.getPhilosopherBySlug slug
                match philosopher with
                | None ->
                    return Results.Json({ ErrorResponseDto.Error = "Philosopher not found" }, statusCode = 404)
                | Some p ->
                    let! works = Queries.getWorksByPhilosopherId p.Id
                    let! schools = Queries.getSchoolMembershipsByPhilosopherId p.Id
                    let! outgoing = Queries.getOutgoingInfluences p.Id
                    let! incoming = Queries.getIncomingInfluences p.Id
                    let! notes = Queries.getNotesByPhilosopherId p.Id

                    let dto: PhilosopherDetailDto =
                        { Id = p.Id
                          Slug = p.Slug
                          Name = p.Name
                          AlsoKnownAs = Option.ofObj p.AlsoKnownAs
                          BornYear = nToOpt p.BornYear
                          BornCertainty = p.BornCertainty
                          DiedYear = nToOpt p.DiedYear
                          DiedCertainty = p.DiedCertainty
                          Nationality = Option.ofObj p.Nationality
                          BioShort = Option.ofObj p.BioShort
                          Works =
                              works |> List.map (fun w ->
                                  { WorkDto.Id = w.Id; Slug = w.Slug; Title = w.Title
                                    OriginalTitle = Option.ofObj w.OriginalTitle
                                    WorkType = w.WorkType
                                    ComposedYear = nToOpt w.ComposedYear
                                    ComposedYearEnd = nToOpt w.ComposedYearEnd
                                    ComposedCertainty = w.ComposedCertainty
                                    OriginalLanguage = Option.ofObj w.OriginalLanguage
                                    DescriptionShort = Option.ofObj w.DescriptionShort })
                          Schools =
                              schools |> List.map (fun s ->
                                  { SchoolMembershipDto.Id = s.Id; Slug = s.Slug; Name = s.Name; Role = s.Role })
                          Influences =
                              outgoing |> List.map (fun r ->
                                  { RelatedPhilosopherDto.Id = r.Id; Slug = r.Slug; Name = r.Name
                                    InfluenceType = r.InfluenceType; Description = Option.ofObj r.Description })
                          InfluencedBy =
                              incoming |> List.map (fun r ->
                                  { RelatedPhilosopherDto.Id = r.Id; Slug = r.Slug; Name = r.Name
                                    InfluenceType = r.InfluenceType; Description = Option.ofObj r.Description })
                          Notes =
                              notes |> List.map (fun n ->
                                  { NoteDto.Id = n.Id; Content = n.Content; NoteType = n.NoteType
                                    SourceType = n.SourceType; SourceName = Option.ofObj n.SourceName
                                    SourceUrl = Option.ofObj n.SourceUrl }) }

                    return Results.Json(dto, statusCode = 200)
            } |> _.Result
        )) |> ignore

namespace PhilosophyExplorer.Routes

open System
open System.Text.Json.Nodes
open Microsoft.AspNetCore.Builder
open Microsoft.AspNetCore.Http
open PhilosophyExplorer.Domain
open PhilosophyExplorer.Db
open PhilosophyExplorer.Telemetry

module ArgumentRoutes =

    let private countLookup (kind: string) =
        Diagnostics.ArgumentLookups.Add(1L, Diagnostics.tag "kind" kind)

    let private nToOpt (n: Nullable<int>) = if n.HasValue then Some n.Value else None
    let private ndToOpt (n: Nullable<double>) = if n.HasValue then Some n.Value else None

    let private toSummaryDto (r: Queries.ArgumentSummaryRow) : ArgumentSummaryDto =
        { Id = r.Id
          ExtractionId = r.ExtractionId
          WorkId = Option.ofObj r.WorkId
          WorkSlug = Option.ofObj r.WorkSlug
          WorkTitle = Option.ofObj r.WorkTitle
          Intent = r.Intent
          PrimaryFormalism = Option.ofObj r.PrimaryFormalism |> Option.defaultValue "unknown"
          ClauseCount = r.ClauseCount }

    let private toClauseDto (r: Queries.ArgumentClauseQueryRow) : ArgumentClauseDto =
        { Id = r.Id
          Role = r.Role
          Position = r.Position
          VerbalText = Option.ofObj r.VerbalText
          SourceExcerpt = Option.ofObj r.SourceExcerpt }

    let private toFormalizationDto (r: Queries.ArgumentFormalizationQueryRow) : ArgumentFormalizationDto =
        // ast_json is stored verbatim from the extraction — parse to a JsonNode
        // so it serializes as real JSON, not a quoted string.
        { Id = r.Id
          Formalism = r.Formalism
          IsPrimary = r.IsPrimary
          FitScore = ndToOpt r.FitScore
          Reason = Option.ofObj r.Reason
          DistortionRisk = Option.ofObj r.DistortionRisk
          Ast = JsonNode.Parse(r.AstJson) }

    let private toAssessmentDto (r: Queries.ArgumentAssessmentQueryRow) : ArgumentAssessmentDto =
        { Formalism = r.Formalism
          FitScore = r.FitScore
          Reason = r.Reason
          DistortionRisk = Option.ofObj r.DistortionRisk }

    let private toAttributionDto (r: Queries.ArgumentAttributionQueryRow) : ArgumentAttributionDto =
        { Id = r.Id
          PhilosopherId = r.PhilosopherId
          PhilosopherSlug = r.PhilosopherSlug
          PhilosopherName = r.PhilosopherName
          WorkId = Option.ofObj r.WorkId
          WorkSlug = Option.ofObj r.WorkSlug
          WorkTitle = Option.ofObj r.WorkTitle
          FormalizationId = Option.ofObj r.FormalizationId
          Provenance = r.Provenance
          SourceText = Option.ofObj r.SourceText
          Note = Option.ofObj r.Note }

    // Assemble the full detail DTO for one argument id (shared by GET, POST, PUT).
    let private buildDetail (id: string) : System.Threading.Tasks.Task<ArgumentDetailDto option> =
        task {
            let! header = Queries.getArgumentHeader id
            match header with
            | None -> return None
            | Some h ->
                let! clauses = Queries.getArgumentClauses h.Id
                let! formalizations = Queries.getArgumentFormalizations h.Id
                let! assessments = Queries.getArgumentAssessments h.Id
                let! notes = Queries.getArgumentReviewerNotes h.Id
                let! attributions = Queries.getArgumentAttributions h.Id
                return Some
                    { Id = h.Id
                      ExtractionId = h.ExtractionId
                      WorkId = Option.ofObj h.WorkId
                      WorkSlug = Option.ofObj h.WorkSlug
                      WorkTitle = Option.ofObj h.WorkTitle
                      Source =
                          { File = Option.ofObj h.SourceFile
                            StartLine = nToOpt h.SourceStartLine
                            EndLine = nToOpt h.SourceEndLine
                            Excerpt = Option.ofObj h.SourceExcerpt }
                      Intent = h.Intent
                      ExtractorNote = Option.ofObj h.ExtractorNote
                      Clauses = clauses |> List.map toClauseDto
                      Formalizations = formalizations |> List.map toFormalizationDto
                      Assessments = assessments |> List.map toAssessmentDto
                      ReviewerNotes = notes
                      Attributions = attributions |> List.map toAttributionDto }
        }

    // Pure validation of a write payload. Returns the first problem, or None.
    let private validateWrite (dto: WriteArgumentDto) : string option =
        let forms = if isNull (box dto.Formalizations) then [||] else dto.Formalizations
        if String.IsNullOrWhiteSpace dto.Intent then Some "intent is required"
        elif forms.Length = 0 then Some "at least one formalization is required"
        elif forms |> Array.exists (fun f -> not (Queries.knownFormalisms.Contains f.Formalism)) then
            Some "unknown formalism (must be one of the 15 known systems)"
        elif forms |> Array.exists (fun f -> isNull (box f.Ast)) then
            Some "each formalization requires an ast"
        elif (forms |> Array.filter (fun f -> f.IsPrimary) |> Array.length) <> 1 then
            Some "exactly one formalization must be marked primary"
        else None

    let private badRequest (msg: string) = Results.Json({ ErrorResponseDto.Error = msg }, statusCode = 400)
    let private notFound () = Results.Json({ ErrorResponseDto.Error = "Argument not found" }, statusCode = 404)

    let register (app: WebApplication) =
        // GET /api/arguments  (optional ?workSlug= filter)
        app.MapGet("/api/arguments", Func<HttpContext, IResult>(fun ctx ->
            task {
                countLookup "list"
                let workSlug =
                    match ctx.Request.Query.TryGetValue("workSlug") with
                    | true, v when not (String.IsNullOrWhiteSpace(v.ToString())) -> Some (v.ToString())
                    | _ -> None
                let! rows =
                    match workSlug with
                    | Some s -> Queries.listArgumentsByWorkSlug s
                    | None -> Queries.listArguments ()
                return Results.Json(rows |> List.map toSummaryDto, statusCode = 200)
            } |> _.Result
        )) |> ignore

        // GET /api/arguments/{id} — catch-all route: argument ids carry the
        // extraction_id verbatim, which contains slashes (author/work/slug).
        app.MapGet("/api/arguments/{*id}", Func<string, IResult>(fun id ->
            task {
                countLookup "detail"
                let! detail = buildDetail id
                match detail with
                | Some d -> return Results.Json(d, statusCode = 200)
                | None -> return notFound ()
            } |> _.Result
        )) |> ignore

        // POST /api/arguments — create a user-authored argument (origin='user').
        app.MapPost("/api/arguments", Func<WriteArgumentDto, IResult>(fun dto ->
            task {
                countLookup "create"
                match validateWrite dto with
                | Some e -> return badRequest e
                | None ->
                    let id = Guid.NewGuid().ToString()
                    match! Queries.createArgument id dto with
                    | Error e -> return badRequest e
                    | Ok () ->
                        let! detail = buildDetail id
                        match detail with
                        | Some d -> return Results.Json(d, statusCode = 201)
                        | None -> return Results.Json({ ErrorResponseDto.Error = "created but failed to load" }, statusCode = 500)
            } |> _.Result
        )) |> ignore

        // PUT /api/arguments/{id} — replace an existing argument wholesale.
        app.MapPut("/api/arguments/{*id}", Func<string, WriteArgumentDto, IResult>(fun id dto ->
            task {
                countLookup "update"
                let! exists = Queries.argumentExists id
                if not exists then return notFound ()
                else
                    match validateWrite dto with
                    | Some e -> return badRequest e
                    | None ->
                        match! Queries.replaceArgument id dto with
                        | Error e -> return badRequest e
                        | Ok () ->
                            let! detail = buildDetail id
                            match detail with
                            | Some d -> return Results.Json(d, statusCode = 200)
                            | None -> return Results.Json({ ErrorResponseDto.Error = "updated but failed to load" }, statusCode = 500)
            } |> _.Result
        )) |> ignore

        // DELETE /api/arguments/{id} — child rows cascade via FK.
        app.MapDelete("/api/arguments/{*id}", Func<string, IResult>(fun id ->
            task {
                countLookup "delete"
                let! n = Queries.deleteArgument id
                if n = 0 then return notFound ()
                else return Results.StatusCode(204)
            } |> _.Result
        )) |> ignore

        // GET /api/works/{slug}/arguments
        app.MapGet("/api/works/{slug}/arguments", Func<string, IResult>(fun slug ->
            task {
                countLookup "by-work"
                let! rows = Queries.listArgumentsByWorkSlug slug
                return Results.Json(rows |> List.map toSummaryDto, statusCode = 200)
            } |> _.Result
        )) |> ignore

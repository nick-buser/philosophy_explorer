namespace PhilosophyExplorer.Routes

open System
open Microsoft.AspNetCore.Builder
open Microsoft.AspNetCore.Http
open PhilosophyExplorer.Domain
open PhilosophyExplorer.Graph
open PhilosophyExplorer.Telemetry

module GraphRoutes =

    let private countTraversal (endpoint: string) =
        Diagnostics.GraphTraversals.Add(1L, Diagnostics.tag "endpoint" endpoint)

    let private toNodeDto (n: GraphNode) : GraphNodeDto =
        { Key = n.Key; Label = n.Label
          Attributes = n.Attributes |> Map.map (fun _ v -> v) }

    let private toEdgeDto (e: GraphEdge) : GraphEdgeDto =
        { Key = e.Key; Source = e.Source; Target = e.Target; Type = e.Type
          Attributes = e.Attributes |> Map.map (fun _ v -> v) }

    let private toSubgraphResponse (sg: SerializedSubgraph) rootKey depth : SubgraphResponseDto =
        { Graph =
              { Nodes = sg.Nodes |> List.map toNodeDto
                Edges = sg.Edges |> List.map toEdgeDto }
          Meta =
              { NodeCount = sg.Nodes.Length
                EdgeCount = sg.Edges.Length
                RootKey = rootKey
                Depth = depth } }

    let private parseDirection (d: string) =
        match d with
        | "in" -> In
        | "out" -> Out
        | _ -> Both

    let private parseEdgeTypes (raw: string) =
        if String.IsNullOrEmpty raw then None
        else raw.Split(',') |> Array.filter (fun t -> EdgeTypes.All |> Array.contains t) |> Set.ofArray |> Some

    let register (graphService: MemoryGraphService) (app: WebApplication) =

        // GET /api/graph/stats
        app.MapGet("/api/graph/stats", Func<IResult>(fun () ->
            let stats = graphService.Stats()
            Results.Json({ GraphStatsDto.NodeCount = stats.NodeCount; EdgeCount = stats.EdgeCount }, statusCode = 200)
        )) |> ignore

        // GET /api/graph/node/{key}
        app.MapGet("/api/graph/node/{key}", Func<string, IResult>(fun key ->
            match graphService.GetNode(key) with
            | None -> Results.Json({ ErrorResponseDto.Error = "Node not found" }, statusCode = 404)
            | Some n -> Results.Json(toNodeDto n, statusCode = 200)
        )) |> ignore

        // GET /api/graph/neighbors/{key}
        app.MapGet("/api/graph/neighbors/{key}", Func<string, HttpContext, IResult>(fun key ctx ->
            countTraversal "neighbors"
            let depthStr = ctx.Request.Query.["depth"] |> Seq.tryHead |> Option.defaultValue "1"
            let depth = match Int32.TryParse(depthStr) with true, d -> max 1 (min 6 d) | _ -> 1
            let dirStr = ctx.Request.Query.["direction"] |> Seq.tryHead |> Option.defaultValue "both"
            let edgeTypesStr = ctx.Request.Query.["edgeTypes"] |> Seq.tryHead |> Option.defaultValue ""

            match graphService.GetNode(key) with
            | None -> Results.Json({ ErrorResponseDto.Error = "Root node not found" }, statusCode = 404)
            | Some _ ->
                let sg = graphService.GetSubgraph(key, depth, parseDirection dirStr, ?edgeTypes = parseEdgeTypes edgeTypesStr)
                Results.Json(toSubgraphResponse sg (Some key) (Some depth), statusCode = 200)
        )) |> ignore

        // GET /api/graph/path
        app.MapGet("/api/graph/path", Func<HttpContext, IResult>(fun ctx ->
            countTraversal "path"
            let fromKey = ctx.Request.Query.["from"] |> Seq.tryHead |> Option.defaultValue ""
            let toKey = ctx.Request.Query.["to"] |> Seq.tryHead |> Option.defaultValue ""
            let edgeTypesStr = ctx.Request.Query.["edgeTypes"] |> Seq.tryHead |> Option.defaultValue ""
            let maxDepthStr = ctx.Request.Query.["maxDepth"] |> Seq.tryHead |> Option.defaultValue "6"
            let maxDepth = match Int32.TryParse(maxDepthStr) with true, d -> max 1 (min 10 d) | _ -> 6

            let path = graphService.ShortestPath(fromKey, toKey, ?edgeTypes = parseEdgeTypes edgeTypesStr, maxDepth = maxDepth)
            match path with
            | None -> Results.Json({ PathResponseDto.Path = None }, statusCode = 200)
            | Some p ->
                Results.Json(
                    { PathResponseDto.Path =
                          Some { Nodes = p.Nodes |> List.map toNodeDto
                                 Edges = p.Edges |> List.map toEdgeDto
                                 Length = p.Length } },
                    statusCode = 200)
        )) |> ignore

        // GET /api/graph/influence/{slug}
        app.MapGet("/api/graph/influence/{slug}", Func<string, HttpContext, IResult>(fun slug ctx ->
            countTraversal "influence"
            let depthStr = ctx.Request.Query.["depth"] |> Seq.tryHead |> Option.defaultValue "1"
            let depth = match Int32.TryParse(depthStr) with true, d -> max 1 (min 4 d) | _ -> 1
            let sg = graphService.GetInfluenceGraph(slug, depth)
            Results.Json(toSubgraphResponse sg (Some $"philosopher:{slug}") (Some depth), statusCode = 200)
        )) |> ignore

        // GET /api/graph/school/{slug}
        app.MapGet("/api/graph/school/{slug}", Func<string, IResult>(fun slug ->
            countTraversal "school"
            let sg = graphService.GetSchoolGraph(slug)
            Results.Json(toSubgraphResponse sg (Some $"school:{slug}") None, statusCode = 200)
        )) |> ignore

        // GET /api/graph/curriculum/{slug}
        app.MapGet("/api/graph/curriculum/{slug}", Func<string, IResult>(fun slug ->
            countTraversal "curriculum"
            let sg = graphService.GetCurriculumGraph(slug)
            Results.Json(toSubgraphResponse sg (Some $"curriculum:{slug}") None, statusCode = 200)
        )) |> ignore

        // GET /api/graph/influence-network
        app.MapGet("/api/graph/influence-network", Func<IResult>(fun () ->
            countTraversal "influence-network"
            let sg = graphService.GetFullInfluenceNetwork()
            Results.Json(toSubgraphResponse sg None None, statusCode = 200)
        )) |> ignore

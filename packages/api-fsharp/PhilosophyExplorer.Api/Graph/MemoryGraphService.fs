namespace PhilosophyExplorer.Graph

open System
open System.Collections.Generic
open System.IO
open System.Text.Json

/// In-memory graph service backed by adjacency lists, loaded from graph-data.json.
/// F# equivalent of packages/api/src/graph/memory-graph.ts (replaces graphology).
type MemoryGraphService(dataPath: string) =

    let nodes = Dictionary<string, GraphNode>()
    let outEdges = Dictionary<string, ResizeArray<GraphEdge>>()
    let inEdges = Dictionary<string, ResizeArray<GraphEdge>>()

    let ensureEdgeLists key =
        if not (outEdges.ContainsKey key) then outEdges.[key] <- ResizeArray()
        if not (inEdges.ContainsKey key) then inEdges.[key] <- ResizeArray()

    let jsonElementToMap (elem: JsonElement option) : Map<string, obj> =
        match elem with
        | None -> Map.empty
        | Some el when el.ValueKind <> JsonValueKind.Object -> Map.empty
        | Some el ->
            el.EnumerateObject()
            |> Seq.map (fun prop ->
                let value: obj =
                    match prop.Value.ValueKind with
                    | JsonValueKind.String -> prop.Value.GetString() :> obj
                    | JsonValueKind.Number ->
                        if prop.Value.TryGetInt32() |> fst then
                            prop.Value.GetInt32() :> obj
                        else
                            prop.Value.GetDouble() :> obj
                    | JsonValueKind.True -> true :> obj
                    | JsonValueKind.False -> false :> obj
                    | JsonValueKind.Null -> null
                    | _ -> prop.Value.GetRawText() :> obj
                prop.Name, value)
            |> Map.ofSeq

    do
        if File.Exists(dataPath) then
            let json = File.ReadAllText(dataPath)
            let data = JsonSerializer.Deserialize<GraphologyExport>(json)

            for n in data.Nodes do
                let attrs = jsonElementToMap n.Attributes
                let label = attrs |> Map.tryFind "label" |> Option.map string |> Option.defaultValue ""
                nodes.[n.Key] <- { Key = n.Key; Label = label; Attributes = attrs }
                ensureEdgeLists n.Key

            for e in data.Edges do
                let attrs = jsonElementToMap e.Attributes
                let edgeType = attrs |> Map.tryFind "type" |> Option.map string |> Option.defaultValue ""
                let key = if String.IsNullOrEmpty e.Key then $"{e.Source}->{e.Target}:{edgeType}" else e.Key
                let edge = { Key = key; Source = e.Source; Target = e.Target; Type = edgeType; Attributes = attrs }
                ensureEdgeLists e.Source
                ensureEdgeLists e.Target
                outEdges.[e.Source].Add(edge)
                inEdges.[e.Target].Add(edge)
        else
            eprintfn $"[graph] No graph-data.json found at {dataPath}. Starting with empty graph."

    member _.NodeCount = nodes.Count
    member _.EdgeCount = outEdges.Values |> Seq.sumBy (fun es -> es.Count)

    member _.Stats() = {| NodeCount = nodes.Count; EdgeCount = outEdges.Values |> Seq.sumBy (fun es -> es.Count) |}

    member _.GetNode(key: string) =
        match nodes.TryGetValue(key) with
        | true, n -> Some n
        | _ -> None

    member _.FindNodes(label: string, ?filter: Map<string, obj>) =
        let f = defaultArg filter Map.empty
        nodes.Values
        |> Seq.filter (fun n ->
            n.Label = label &&
            f |> Map.forall (fun k v -> n.Attributes |> Map.tryFind k |> Option.map (fun a -> a = v) |> Option.defaultValue false))
        |> Seq.toList

    member _.GetEdges(nodeKey: string, ?direction: TraversalDirection, ?edgeType: string) =
        let dir = defaultArg direction Both
        let result = ResizeArray()
        let filterType (e: GraphEdge) =
            match edgeType with
            | Some t -> e.Type = t
            | None -> true

        if (dir = Out || dir = Both) then
            match outEdges.TryGetValue(nodeKey) with
            | true, es -> es |> Seq.filter filterType |> result.AddRange
            | _ -> ()

        if (dir = In || dir = Both) then
            match inEdges.TryGetValue(nodeKey) with
            | true, es -> es |> Seq.filter filterType |> result.AddRange
            | _ -> ()

        result |> Seq.toList

    member this.GetSubgraph(rootKey: string, ?depth: int, ?direction: TraversalDirection, ?edgeTypes: string Set) =
        if not (nodes.ContainsKey rootKey) then SerializedSubgraph.Empty
        else
            let maxDepth = defaultArg depth 2
            let dir = defaultArg direction Both
            let nodeSet = HashSet<string>()
            let edgeSet = HashSet<string>()
            let queue = Queue<struct(string * int)>()
            nodeSet.Add(rootKey) |> ignore
            queue.Enqueue(struct(rootKey, 0))

            while queue.Count > 0 do
                let struct(current, d) = queue.Dequeue()
                if d < maxDepth then
                    let collectEdge (e: GraphEdge) =
                        match edgeTypes with
                        | Some et when not (et.Contains e.Type) -> ()
                        | _ ->
                            edgeSet.Add(e.Key) |> ignore
                            let neighbor = if e.Source = current then e.Target else e.Source
                            if nodeSet.Add(neighbor) then
                                queue.Enqueue(struct(neighbor, d + 1))

                    if dir = Out || dir = Both then
                        match outEdges.TryGetValue(current) with
                        | true, es -> es |> Seq.iter collectEdge
                        | _ -> ()

                    if dir = In || dir = Both then
                        match inEdges.TryGetValue(current) with
                        | true, es -> es |> Seq.iter collectEdge
                        | _ -> ()

            this.Materialize(nodeSet, edgeSet)

    member this.ShortestPath(fromKey: string, toKey: string, ?edgeTypes: string Set, ?maxDepth: int) =
        if not (nodes.ContainsKey fromKey) || not (nodes.ContainsKey toKey) then None
        else
            let limit = defaultArg maxDepth 6
            let visited = Dictionary<string, string option>()
            let queue = Queue<string>()
            visited.[fromKey] <- None
            queue.Enqueue(fromKey)
            let mutable found = false

            while queue.Count > 0 && not found do
                let current = queue.Dequeue()
                if current = toKey then
                    found <- true
                else
                    let edges = this.GetEdges(current, Both)
                    for e in edges do
                        match edgeTypes with
                        | Some et when not (et.Contains e.Type) -> ()
                        | _ ->
                            let neighbor = if e.Source = current then e.Target else e.Source
                            if not (visited.ContainsKey neighbor) then
                                visited.[neighbor] <- Some current
                                queue.Enqueue(neighbor)

            if not found then None
            else
                let path = ResizeArray<string>()
                let mutable cur = toKey
                while visited.ContainsKey cur do
                    path.Add(cur)
                    match visited.[cur] with
                    | Some prev -> cur <- prev
                    | None -> cur <- ""
                path.Reverse()
                let pathList = path |> Seq.toList

                if pathList.Length - 1 > limit then None
                else
                    let pathNodes = pathList |> List.choose (fun k -> this.GetNode k)
                    let pathEdges =
                        pathList
                        |> List.pairwise
                        |> List.choose (fun (a, b) ->
                            let edges = this.GetEdges(a, Out)
                            edges |> List.tryFind (fun e -> e.Target = b)
                            |> Option.orElse (
                                let inE = this.GetEdges(b, Out)
                                inE |> List.tryFind (fun e -> e.Target = a)))
                    Some { Nodes = pathNodes; Edges = pathEdges; Length = pathList.Length - 1 }

    // Domain projections

    member this.GetInfluenceGraph(philosopherSlug: string, ?depth: int) =
        let d = defaultArg depth 1
        let key = NodeKey.make "philosopher" philosopherSlug
        this.GetSubgraph(key, d, Both, Set.ofList [ EdgeTypes.Influenced ])

    member this.GetSchoolGraph(schoolSlug: string) =
        let key = NodeKey.make "school" schoolSlug
        if not (nodes.ContainsKey key) then SerializedSubgraph.Empty
        else
            let memberKeys = HashSet<string>()
            match inEdges.TryGetValue(key) with
            | true, es ->
                for e in es do
                    if e.Type = EdgeTypes.MemberOf then
                        memberKeys.Add(e.Source) |> ignore
            | _ -> ()

            let nodeSet = HashSet<string>(memberKeys)
            nodeSet.Add(key) |> ignore
            let edgeSet = HashSet<string>()

            match inEdges.TryGetValue(key) with
            | true, es ->
                for e in es do
                    if e.Type = EdgeTypes.MemberOf then edgeSet.Add(e.Key) |> ignore
            | _ -> ()

            for mk in memberKeys do
                match outEdges.TryGetValue(mk) with
                | true, es ->
                    for e in es do
                        if e.Type = EdgeTypes.Influenced && memberKeys.Contains(e.Target) then
                            edgeSet.Add(e.Key) |> ignore
                | _ -> ()

            this.Materialize(nodeSet, edgeSet)

    member this.GetCurriculumGraph(curriculumSlug: string) =
        let prefix = $"curriculumitem:{curriculumSlug}:"
        let nodeSet = HashSet<string>()
        let edgeSet = HashSet<string>()

        for kvp in nodes do
            if kvp.Key.StartsWith(prefix) then
                nodeSet.Add(kvp.Key) |> ignore

        for nk in nodeSet |> Seq.toArray do
            match outEdges.TryGetValue(nk) with
            | true, es ->
                for e in es do
                    if e.Type = EdgeTypes.PrereqOf && nodeSet.Contains(e.Target) then
                        edgeSet.Add(e.Key) |> ignore
                    elif e.Type = EdgeTypes.ReferencesWork || e.Type = EdgeTypes.ReferencesPhilosopher then
                        edgeSet.Add(e.Key) |> ignore
                        nodeSet.Add(e.Target) |> ignore
            | _ -> ()

        this.Materialize(nodeSet, edgeSet)

    member _.GetFullInfluenceNetwork() =
        let graphNodes =
            nodes.Values
            |> Seq.filter (fun n -> n.Label = NodeLabels.Philosopher)
            |> Seq.toList
        let graphEdges =
            outEdges.Values
            |> Seq.collect id
            |> Seq.filter (fun e -> e.Type = EdgeTypes.Influenced)
            |> Seq.distinctBy (fun e -> e.Key)
            |> Seq.toList
        { Nodes = graphNodes; Edges = graphEdges }

    member private _.Materialize(nodeSet: HashSet<string>, edgeSet: HashSet<string>) =
        let resultNodes =
            nodeSet
            |> Seq.choose (fun k -> match nodes.TryGetValue(k) with true, n -> Some n | _ -> None)
            |> Seq.toList
        let resultEdges =
            let allEdges =
                outEdges.Values
                |> Seq.collect id
                |> Seq.filter (fun e -> edgeSet.Contains(e.Key))
                |> Seq.distinctBy (fun e -> e.Key)
                |> Seq.toList
            allEdges
        { Nodes = resultNodes; Edges = resultEdges }

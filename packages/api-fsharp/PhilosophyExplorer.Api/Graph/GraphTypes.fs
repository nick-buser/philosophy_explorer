namespace PhilosophyExplorer.Graph

open System.Text.Json
open System.Text.Json.Serialization

/// Graph domain types mirroring packages/api/src/graph/types.ts

[<RequireQualifiedAccess>]
module NodeLabels =
    let Philosopher = "Philosopher"
    let Work = "Work"
    let School = "School"
    let CurriculumItem = "CurriculumItem"
    let All = [| Philosopher; Work; School; CurriculumItem |]

[<RequireQualifiedAccess>]
module EdgeTypes =
    let Influenced = "INFLUENCED"
    let MemberOf = "MEMBER_OF"
    let Authored = "AUTHORED"
    let PrereqOf = "PREREQ_OF"
    let ReferencesWork = "REFERENCES_WORK"
    let ReferencesPhilosopher = "REFERENCES_PHILOSOPHER"
    let All = [| Influenced; MemberOf; Authored; PrereqOf; ReferencesWork; ReferencesPhilosopher |]

type TraversalDirection = In | Out | Both

type GraphNode =
    { Key: string
      Label: string
      Attributes: Map<string, obj> }

type GraphEdge =
    { Key: string
      Source: string
      Target: string
      Type: string
      Attributes: Map<string, obj> }

type GraphPath =
    { Nodes: GraphNode list
      Edges: GraphEdge list
      Length: int }

type SerializedSubgraph =
    { Nodes: GraphNode list
      Edges: GraphEdge list }

    static member Empty = { Nodes = []; Edges = [] }

module NodeKey =
    let make (label: string) (slug: string) = $"{label.ToLowerInvariant()}:{slug}"
    let parse (key: string) =
        let idx = key.IndexOf(':')
        if idx = -1 then failwith $"Invalid node key: {key}"
        key.[..idx-1], key.[idx+1..]

/// The shape of graphology's exported JSON (what graph-data.json contains)
[<CLIMutable>]
type GraphologyNode =
    { [<JsonPropertyName("key")>] Key: string
      [<JsonPropertyName("attributes")>] Attributes: JsonElement option }

[<CLIMutable>]
type GraphologyEdge =
    { [<JsonPropertyName("key")>] Key: string
      [<JsonPropertyName("source")>] Source: string
      [<JsonPropertyName("target")>] Target: string
      [<JsonPropertyName("attributes")>] Attributes: JsonElement option }

[<CLIMutable>]
type GraphologyExport =
    { [<JsonPropertyName("attributes")>] Attributes: JsonElement option
      [<JsonPropertyName("options")>] Options: JsonElement option
      [<JsonPropertyName("nodes")>] Nodes: GraphologyNode array
      [<JsonPropertyName("edges")>] Edges: GraphologyEdge array }

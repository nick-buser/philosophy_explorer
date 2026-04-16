module PhilosophyExplorer.Tests.GraphServiceTests

open System.IO
open Xunit
open PhilosophyExplorer.Graph

let private graphDataPath =
    Path.Combine(__SOURCE_DIRECTORY__, "..", "..", "..", "data", "graph-data.json")
    |> Path.GetFullPath

let private svc = MemoryGraphService(graphDataPath)

[<Fact>]
let ``Graph loads with expected node and edge counts`` () =
    Assert.True(svc.NodeCount >= 270, $"Expected >= 270 nodes, got {svc.NodeCount}")
    Assert.True(svc.EdgeCount >= 380, $"Expected >= 380 edges, got {svc.EdgeCount}")

[<Fact>]
let ``GetNode returns a philosopher node`` () =
    let node = svc.GetNode("philosopher:plato")
    Assert.True(node.IsSome, "philosopher:plato should exist")
    Assert.Equal("Philosopher", node.Value.Label)
    Assert.Equal("Plato", node.Value.Attributes.["name"] :?> string)

[<Fact>]
let ``GetNode returns None for missing key`` () =
    let node = svc.GetNode("philosopher:nonexistent")
    Assert.True(node.IsNone)

[<Fact>]
let ``FindNodes returns all philosophers`` () =
    let nodes = svc.FindNodes(NodeLabels.Philosopher)
    Assert.True(nodes.Length >= 80, $"Expected >= 80 philosophers, got {nodes.Length}")

[<Fact>]
let ``GetInfluenceGraph returns subgraph for Kant`` () =
    let sg = svc.GetInfluenceGraph("immanuel-kant", 1)
    Assert.True(sg.Nodes.Length > 0, "Should have nodes")
    Assert.True(sg.Edges.Length > 0, "Should have edges")
    let hasKant = sg.Nodes |> List.exists (fun n -> n.Key = "philosopher:immanuel-kant")
    Assert.True(hasKant, "Subgraph should include Kant")

[<Fact>]
let ``GetSchoolGraph returns stoicism subgraph`` () =
    let sg = svc.GetSchoolGraph("stoicism")
    Assert.True(sg.Nodes.Length >= 2, "Should have school + at least 1 member")
    let hasSchool = sg.Nodes |> List.exists (fun n -> n.Key = "school:stoicism")
    Assert.True(hasSchool, "Should include school node")

[<Fact>]
let ``ShortestPath finds path between Plato and Kant`` () =
    let path = svc.ShortestPath("philosopher:plato", "philosopher:immanuel-kant")
    Assert.True(path.IsSome, "Path should exist")
    Assert.True(path.Value.Length > 0, "Path length should be > 0")

[<Fact>]
let ``GetFullInfluenceNetwork returns all influence edges`` () =
    let sg = svc.GetFullInfluenceNetwork()
    Assert.True(sg.Nodes.Length >= 80, "Should have many philosopher nodes")
    Assert.True(sg.Edges.Length >= 70, "Should have many influence edges")
    for e in sg.Edges do
        Assert.Equal(EdgeTypes.Influenced, e.Type)

[<Fact>]
let ``Stats returns correct counts`` () =
    let stats = svc.Stats()
    Assert.Equal(svc.NodeCount, stats.NodeCount)
    Assert.Equal(svc.EdgeCount, stats.EdgeCount)

[<Fact>]
let ``GetCurriculumGraph returns curriculum subgraph`` () =
    let sg = svc.GetCurriculumGraph("ancient-greek-foundations")
    Assert.True(sg.Nodes.Length > 0, "Should have curriculum item nodes")

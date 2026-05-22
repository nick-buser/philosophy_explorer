module PhilosophyExplorer.Tests.NdTypesTests

open System.Text.Json
open Xunit
open PhilosophyExplorer.Logic.Nd

// A FitchProof of `P → P` in the exact wire shape the TS prover emits
// (packages/web/src/logic/nd-types.ts). The `pred` nodes still carry the
// `args: []` that the F# DTO drops, so this fixture also pins the
// extra-field tolerance the /api/verify request path depends on.
let private pImpliesP =
    """
    {
      "lines": [
        { "lineNo": 1, "depth": 1, "formula": { "kind": "pred", "name": "P", "args": [] }, "rule": "assumption", "cites": [] },
        { "lineNo": 2, "depth": 1, "formula": { "kind": "pred", "name": "P", "args": [] }, "rule": "reit", "cites": [1] },
        { "lineNo": 3, "depth": 0,
          "formula": { "kind": "implies",
                       "left": { "kind": "pred", "name": "P", "args": [] },
                       "right": { "kind": "pred", "name": "P", "args": [] } },
          "rule": "impI", "cites": [[1, 2]] }
      ],
      "conclusionLine": 3
    }
    """

[<Fact>]
let ``deserializes a TS-shaped FitchProof`` () =
    let proof = JsonSerializer.Deserialize<FitchProof>(pImpliesP, NdJson.options)
    Assert.Equal(3, proof.ConclusionLine)
    Assert.Equal(3, List.length proof.Lines)

    let line1 = proof.Lines |> List.item 0
    Assert.Equal(Rule.Assumption, line1.Rule)
    Assert.Equal(1, line1.Depth)
    Assert.Equal<Cite list>([], line1.Cites)
    Assert.Equal<FolFormula>(Pred "P", line1.Formula)

    let line2 = proof.Lines |> List.item 1
    Assert.Equal(Rule.Reit, line2.Rule)
    Assert.Equal<Cite list>([ CiteLine 1 ], line2.Cites)

    let line3 = proof.Lines |> List.item 2
    Assert.Equal(Rule.ImpI, line3.Rule)
    Assert.Equal(0, line3.Depth)
    Assert.Equal<Cite list>([ CiteRange(1, 2) ], line3.Cites)
    Assert.Equal<FolFormula>(Implies(Pred "P", Pred "P"), line3.Formula)

[<Fact>]
let ``a FitchProof round-trips through JSON unchanged`` () =
    let proof = JsonSerializer.Deserialize<FitchProof>(pImpliesP, NdJson.options)
    let reserialized = JsonSerializer.Serialize(proof, NdJson.options)
    let roundTripped = JsonSerializer.Deserialize<FitchProof>(reserialized, NdJson.options)
    Assert.Equal<FitchProof>(proof, roundTripped)

[<Fact>]
let ``FolFormula serializes with an internal kind discriminator`` () =
    let json = JsonSerializer.Serialize(And(Pred "P", Not Bot), NdJson.options)
    use doc = JsonDocument.Parse(json)
    let root = doc.RootElement
    Assert.Equal("and", root.GetProperty("kind").GetString())
    Assert.Equal("pred", root.GetProperty("left").GetProperty("kind").GetString())
    Assert.Equal("P", root.GetProperty("left").GetProperty("name").GetString())
    Assert.Equal("not", root.GetProperty("right").GetProperty("kind").GetString())
    Assert.Equal("bot", root.GetProperty("right").GetProperty("body").GetProperty("kind").GetString())

[<Fact>]
let ``Cite serializes as a bare number or a two-element array`` () =
    Assert.Equal("5", JsonSerializer.Serialize(CiteLine 5, NdJson.options))
    Assert.Equal("[3,7]", JsonSerializer.Serialize(CiteRange(3, 7), NdJson.options))

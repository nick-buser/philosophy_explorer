module PhilosophyExplorer.Tests.ArgumentTests

open System
open System.IO
open System.Text.Json.Nodes
open Xunit
open PhilosophyExplorer.Db
open PhilosophyExplorer.Domain

// Seed a throwaway SQLite database and point DATABASE_URL at it *before*
// DbFactory (which reads the env var once at its own module init) is touched.
// A `lazy` (not a bare module-level `do`) because xunit invokes [<Fact>]
// methods by reflection, which does not reliably trigger this module's static
// initializer — so every test forces `ensureSeeded ()` as its first line.

let private testDbPath =
    Path.Combine(Path.GetTempPath(), $"phil-args-test-{Guid.NewGuid()}.db")

let private seedDir =
    Path.Combine(__SOURCE_DIRECTORY__, "..", "..", "..", "data", "seed")
    |> Path.GetFullPath

let private setup =
    lazy (
        Environment.SetEnvironmentVariable("DATABASE_URL", $"file:{testDbPath}")
        Queries.configureDapper ()
        Seed.run seedDir
    )

let private ensureSeeded () = setup.Force()

let private wait (t: System.Threading.Tasks.Task<'T>) = t.Result

[<Fact>]
let ``listArguments returns the seeded arguments`` () =
    ensureSeeded ()
    let args = Queries.listArguments () |> wait
    Assert.True(args.Length >= 5, $"expected >= 5 arguments, got {args.Length}")

[<Fact>]
let ``getArgumentHeader resolves the work for an NE argument`` () =
    ensureSeeded ()
    let h =
        Queries.getArgumentHeader "aristotle/nicomachean-ethics/002-good-of-man-function-argument"
        |> wait
    Assert.True(h.IsSome, "argument should exist")
    Assert.Equal("nicomachean-ethics", h.Value.WorkSlug)

[<Fact>]
let ``getArgumentHeader returns None for a missing id`` () =
    ensureSeeded ()
    let h = Queries.getArgumentHeader "does/not/exist" |> wait
    Assert.True(h.IsNone)

[<Fact>]
let ``an nd argument has one clause per premise plus a conclusion`` () =
    ensureSeeded ()
    let clauses =
        Queries.getArgumentClauses "aristotle/nicomachean-ethics/002-good-of-man-function-argument"
        |> wait
    // good-of-man has 3 premises + 1 conclusion
    Assert.Equal(4, clauses.Length)
    Assert.Equal("conclusion", (List.last clauses).Role)
    Assert.Equal(3, clauses |> List.filter (fun c -> c.Role = "premise") |> List.length)

[<Fact>]
let ``a formalization carries parseable ast json`` () =
    ensureSeeded ()
    let fs =
        Queries.getArgumentFormalizations "aristotle/nicomachean-ethics/001-arts-aim-at-good"
        |> wait
    Assert.Single(fs) |> ignore
    let f = List.head fs
    Assert.Equal("fol", f.Formalism)
    Assert.True(f.IsPrimary)
    let node = JsonNode.Parse(f.AstJson)
    Assert.NotNull(node)
    // fol payload is { formula: <FolFormula> }
    Assert.NotNull(node.["formula"])

[<Fact>]
let ``a Meno argument has no resolved work (Meno is not in the works seed)`` () =
    ensureSeeded ()
    let h = Queries.getArgumentHeader "plato/meno/001-virtue-same-in-all" |> wait
    Assert.True(h.IsSome)
    Assert.True(isNull h.Value.WorkSlug, "Meno is absent from works.json, so work_id stays null")

[<Fact>]
let ``secondary assessments and reviewer notes are seeded`` () =
    ensureSeeded ()
    let assessments =
        Queries.getArgumentAssessments "plato/meno/001-virtue-same-in-all" |> wait
    let notes =
        Queries.getArgumentReviewerNotes "plato/meno/001-virtue-same-in-all" |> wait
    Assert.NotEmpty(assessments)
    Assert.NotEmpty(notes)

// ── CRUD writes ────────────────────────────────────────────────────────────

let private fol (pred: string) =
    JsonNode.Parse($"""{{"formula":{{"kind":"pred","name":"{pred}","args":[]}}}}""")

let private sampleDto (intent: string) : WriteArgumentDto =
    { WorkSlug = "nicomachean-ethics"
      SourceFile = "t.txt"
      SourceStartLine = Nullable 1
      SourceEndLine = Nullable 2
      SourceExcerpt = "excerpt"
      Intent = intent
      ExtractorNote = null
      Clauses = [| { Role = "claim"; Position = 0; VerbalText = "the claim"; SourceExcerpt = null } |]
      Formalizations =
        [| { Formalism = "fol"; IsPrimary = true; FitScore = Nullable()
             Reason = null; DistortionRisk = null; Ast = fol "P" } |]
      Assessments = [| { Formalism = "nd"; FitScore = 0.3; Reason = "could derive"; DistortionRisk = null } |]
      ReviewerNotes = [| "note one"; "note two" |]
      Attributions =
        [| { PhilosopherSlug = "aristotle"; WorkSlug = "nicomachean-ethics"
             FormalismRef = "fol"; Provenance = "hand_written"; SourceText = "src"; Note = null } |] }

[<Fact>]
let ``createArgument persists the full graph and reads back`` () =
    ensureSeeded ()
    let id = Guid.NewGuid().ToString()
    let res = Queries.createArgument id (sampleDto "created arg") |> wait
    Assert.True((match res with Ok () -> true | Error _ -> false), $"create failed: {res}")

    let h = Queries.getArgumentHeader id |> wait
    Assert.True(h.IsSome)
    Assert.Equal("created arg", h.Value.Intent)
    Assert.Equal("nicomachean-ethics", h.Value.WorkSlug)

    let clauses = Queries.getArgumentClauses id |> wait
    Assert.Single(clauses) |> ignore
    let forms = Queries.getArgumentFormalizations id |> wait
    Assert.Single(forms) |> ignore
    Assert.Equal("fol", (List.head forms).Formalism)
    let attrs = Queries.getArgumentAttributions id |> wait
    Assert.Single(attrs) |> ignore
    // attribution resolved the philosopher and linked the primary formalization
    Assert.Equal("aristotle", (List.head attrs).PhilosopherSlug)
    Assert.False(isNull (List.head attrs).FormalizationId)

[<Fact>]
let ``createArgument rejects an unknown philosopher slug and rolls back`` () =
    ensureSeeded ()
    let id = Guid.NewGuid().ToString()
    let dto =
        { sampleDto "bad attribution" with
            Attributions =
                [| { PhilosopherSlug = "nobody-here"; WorkSlug = null; FormalismRef = null
                     Provenance = "auto"; SourceText = null; Note = null } |] }
    let res = Queries.createArgument id dto |> wait
    Assert.True((match res with Error _ -> true | Ok () -> false), "should reject unknown philosopher")
    // rolled back — the argument row must not exist
    Assert.False(Queries.argumentExists id |> wait)

[<Fact>]
let ``replaceArgument swaps the children wholesale`` () =
    ensureSeeded ()
    let id = Guid.NewGuid().ToString()
    Queries.createArgument id (sampleDto "before edit") |> wait |> ignore

    let edited =
        { sampleDto "after edit" with
            Assessments = [||]          // dropped on replace
            ReviewerNotes = [| "single note" |] }
    let res = Queries.replaceArgument id edited |> wait
    Assert.True((match res with Ok () -> true | Error _ -> false))

    let h = Queries.getArgumentHeader id |> wait
    Assert.Equal("after edit", h.Value.Intent)
    Assert.Empty(Queries.getArgumentAssessments id |> wait)
    Assert.Single(Queries.getArgumentReviewerNotes id |> wait) |> ignore

[<Fact>]
let ``deleteArgument removes the row and cascades to children`` () =
    ensureSeeded ()
    let id = Guid.NewGuid().ToString()
    Queries.createArgument id (sampleDto "to delete") |> wait |> ignore

    let n = Queries.deleteArgument id |> wait
    Assert.True(n > 0)
    Assert.False(Queries.argumentExists id |> wait)
    Assert.Empty(Queries.getArgumentClauses id |> wait)
    Assert.Empty(Queries.getArgumentFormalizations id |> wait)
    Assert.Empty(Queries.getArgumentAttributions id |> wait)

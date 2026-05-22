namespace PhilosophyExplorer.Logic.Nd

open System
open System.Text.Json
open System.Text.Json.Serialization

// Natural-deduction proof DTOs — the F# authority for the POST /api/verify
// contract and the typed proof the Lean emitter folds over (Milestone 1).
//
// These mirror the hand-authored TypeScript in
// packages/web/src/logic/fol-types.ts and nd-types.ts. The wire JSON is kept
// byte-compatible with what the TS prover already emits, so a FitchProof
// built in NaturalDeductionLab round-trips into F# unchanged — NdTypesTests
// pins that. The full TS-stack re-point onto these codegen'd types is a
// separate refac/ ticket (see .tickets/feat-logic-lab-lean-nd.md, decision 3).

/// One natural-deduction inference rule. Mirrors the `Rule` string-literal
/// union in nd-types.ts; the wire form is the identical lowerCamel string,
/// encoded with JsonStringEnumConverter — the Domain/Types.fs enum convention.
[<JsonConverter(typeof<JsonStringEnumConverter>)>]
type Rule =
    | [<JsonStringEnumMemberName("premise")>] Premise = 0
    | [<JsonStringEnumMemberName("assumption")>] Assumption = 1
    | [<JsonStringEnumMemberName("reit")>] Reit = 2
    | [<JsonStringEnumMemberName("andI")>] AndI = 3
    | [<JsonStringEnumMemberName("andEL")>] AndEL = 4
    | [<JsonStringEnumMemberName("andER")>] AndER = 5
    | [<JsonStringEnumMemberName("orIL")>] OrIL = 6
    | [<JsonStringEnumMemberName("orIR")>] OrIR = 7
    | [<JsonStringEnumMemberName("orE")>] OrE = 8
    | [<JsonStringEnumMemberName("impI")>] ImpI = 9
    | [<JsonStringEnumMemberName("impE")>] ImpE = 10
    | [<JsonStringEnumMemberName("iffI")>] IffI = 11
    | [<JsonStringEnumMemberName("iffEL")>] IffEL = 12
    | [<JsonStringEnumMemberName("iffER")>] IffER = 13
    | [<JsonStringEnumMemberName("notI")>] NotI = 14
    | [<JsonStringEnumMemberName("notE")>] NotE = 15
    | [<JsonStringEnumMemberName("botE")>] BotE = 16
    | [<JsonStringEnumMemberName("raa")>] Raa = 17

/// A propositional formula. The first-order constructs of fol-types.ts
/// (`pred` with term arguments, `eq`, `forall`, `exists`) are out of scope:
/// the ND Lab is propositional, so this is exactly the eight-constructor
/// fragment the Lean NDFormula embedding mirrors. An atomic proposition is
/// `Pred name` — the TS `pred` node, whose always-empty `args` array is
/// ignored on read and never emitted.
type FolFormula =
    | Top
    | Bot
    | Pred of name: string
    | Not of body: FolFormula
    | And of left: FolFormula * right: FolFormula
    | Or of left: FolFormula * right: FolFormula
    | Implies of left: FolFormula * right: FolFormula
    | Iff of left: FolFormula * right: FolFormula

/// A line citation: a single line, or the inclusive [start, end] range
/// naming a discharged subproof. Mirrors the TS `Cite = number |
/// [number, number]` — an untagged shape, hence the hand-written converter.
type Cite =
    | CiteLine of line: int
    | CiteRange of startLine: int * endLine: int

/// One numbered line of a Fitch-style proof. `Depth` is the subproof
/// nesting level; `Cites` are the lines/ranges the rule discharges.
type FitchLine =
    { [<JsonPropertyName("lineNo")>] LineNo: int
      [<JsonPropertyName("depth")>] Depth: int
      [<JsonPropertyName("formula")>] Formula: FolFormula
      [<JsonPropertyName("rule")>] Rule: Rule
      [<JsonPropertyName("cites")>] Cites: Cite list }

/// A complete Fitch proof: the numbered lines plus the line that carries
/// the proved conclusion.
type FitchProof =
    { [<JsonPropertyName("lines")>] Lines: FitchLine list
      [<JsonPropertyName("conclusionLine")>] ConclusionLine: int }

/// FolFormula ⇄ the internally-tagged TS shape `{ "kind": ..., ... }`.
/// Hand-written rather than left to JsonFSharpConverter: the project's
/// converter is registered external-tag (`{ "And": ... }`), but FolFormula
/// has to match nd-types.ts exactly. Reading tolerates — and ignores — the
/// `args: []` the TS `pred` node carries.
type FolFormulaJsonConverter() =
    inherit JsonConverter<FolFormula>()

    override _.Read(reader: byref<Utf8JsonReader>, _typeToConvert: Type, options: JsonSerializerOptions) : FolFormula =
        use doc = JsonDocument.ParseValue(&reader)
        let root = doc.RootElement
        let kind =
            match root.TryGetProperty("kind") with
            | true, k -> k.GetString()
            | _ -> raise (JsonException("FolFormula object is missing a `kind` discriminator"))
        let sub (name: string) =
            JsonSerializer.Deserialize<FolFormula>(root.GetProperty(name), options)
        match kind with
        | "top" -> Top
        | "bot" -> Bot
        | "pred" -> Pred(root.GetProperty("name").GetString())
        | "not" -> Not(sub "body")
        | "and" -> And(sub "left", sub "right")
        | "or" -> Or(sub "left", sub "right")
        | "implies" -> Implies(sub "left", sub "right")
        | "iff" -> Iff(sub "left", sub "right")
        | other -> raise (JsonException($"unknown FolFormula kind: `{other}`"))

    override _.Write(writer: Utf8JsonWriter, value: FolFormula, options: JsonSerializerOptions) =
        writer.WriteStartObject()
        let sub (name: string) (f: FolFormula) =
            writer.WritePropertyName(name)
            JsonSerializer.Serialize(writer, f, options)
        match value with
        | Top -> writer.WriteString("kind", "top")
        | Bot -> writer.WriteString("kind", "bot")
        | Pred name ->
            writer.WriteString("kind", "pred")
            writer.WriteString("name", name)
        | Not body ->
            writer.WriteString("kind", "not")
            sub "body" body
        | And(l, r) ->
            writer.WriteString("kind", "and")
            sub "left" l
            sub "right" r
        | Or(l, r) ->
            writer.WriteString("kind", "or")
            sub "left" l
            sub "right" r
        | Implies(l, r) ->
            writer.WriteString("kind", "implies")
            sub "left" l
            sub "right" r
        | Iff(l, r) ->
            writer.WriteString("kind", "iff")
            sub "left" l
            sub "right" r
        writer.WriteEndObject()

/// Cite ⇄ the TS `number | [number, number]`: a bare JSON number for a
/// single line, a two-element array for a subproof range.
type CiteJsonConverter() =
    inherit JsonConverter<Cite>()

    override _.Read(reader: byref<Utf8JsonReader>, _typeToConvert: Type, _options: JsonSerializerOptions) : Cite =
        match reader.TokenType with
        | JsonTokenType.Number -> CiteLine(reader.GetInt32())
        | JsonTokenType.StartArray ->
            reader.Read() |> ignore
            let startLine = reader.GetInt32()
            reader.Read() |> ignore
            let endLine = reader.GetInt32()
            reader.Read() |> ignore // consume the closing ]
            CiteRange(startLine, endLine)
        | other -> raise (JsonException($"Cite must be a number or a [start, end] array, got {other}"))

    override _.Write(writer: Utf8JsonWriter, value: Cite, _options: JsonSerializerOptions) =
        match value with
        | CiteLine line -> writer.WriteNumberValue(line)
        | CiteRange(startLine, endLine) ->
            writer.WriteStartArray()
            writer.WriteNumberValue(startLine)
            writer.WriteNumberValue(endLine)
            writer.WriteEndArray()

/// The JsonSerializerOptions shared by POST /api/verify and the round-trip
/// test. The bare-number/array Cite and `kind`-tagged FolFormula converters
/// sit ahead of JsonFSharpConverter, which then carries the records and
/// lists; Rule resolves through its own type-level JsonStringEnumConverter.
module NdJson =

    let options : JsonSerializerOptions =
        let o = JsonSerializerOptions(PropertyNamingPolicy = JsonNamingPolicy.CamelCase)
        o.DefaultIgnoreCondition <- JsonIgnoreCondition.WhenWritingNull
        o.Converters.Add(FolFormulaJsonConverter())
        o.Converters.Add(CiteJsonConverter())
        o.Converters.Add(JsonFSharpConverter())
        o

namespace PhilosophyExplorer.Domain

open System
open System.Text.Json.Serialization

// Mirrors packages/api/src/db/schema/shared.ts enum types exactly

[<JsonConverter(typeof<JsonStringEnumConverter>)>]
type WorkType =
    | [<JsonStringEnumMemberName("treatise")>] Treatise = 0
    | [<JsonStringEnumMemberName("dialogue")>] Dialogue = 1
    | [<JsonStringEnumMemberName("essay")>] Essay = 2
    | [<JsonStringEnumMemberName("letter")>] Letter = 3
    | [<JsonStringEnumMemberName("fragment")>] Fragment = 4
    | [<JsonStringEnumMemberName("commentary")>] Commentary = 5
    | [<JsonStringEnumMemberName("poem")>] Poem = 6
    | [<JsonStringEnumMemberName("speech")>] Speech = 7
    | [<JsonStringEnumMemberName("collection")>] Collection = 8
    | [<JsonStringEnumMemberName("other")>] Other = 9

[<JsonConverter(typeof<JsonStringEnumConverter>)>]
type DateCertainty =
    | [<JsonStringEnumMemberName("exact")>] Exact = 0
    | [<JsonStringEnumMemberName("circa")>] Circa = 1
    | [<JsonStringEnumMemberName("range")>] Range = 2
    | [<JsonStringEnumMemberName("flourished")>] Flourished = 3
    | [<JsonStringEnumMemberName("unknown")>] Unknown = 4

[<JsonConverter(typeof<JsonStringEnumConverter>)>]
type SchoolRole =
    | [<JsonStringEnumMemberName("founder")>] Founder = 0
    | [<JsonStringEnumMemberName("member")>] Member = 1
    | [<JsonStringEnumMemberName("student")>] Student = 2
    | [<JsonStringEnumMemberName("critic")>] Critic = 3
    | [<JsonStringEnumMemberName("associated")>] Associated = 4

[<JsonConverter(typeof<JsonStringEnumConverter>)>]
type InfluenceType =
    | [<JsonStringEnumMemberName("direct")>] Direct = 0
    | [<JsonStringEnumMemberName("indirect")>] Indirect = 1
    | [<JsonStringEnumMemberName("critical")>] Critical = 2
    | [<JsonStringEnumMemberName("revival")>] Revival = 3

[<JsonConverter(typeof<JsonStringEnumConverter>)>]
type NoteType =
    | [<JsonStringEnumMemberName("summary")>] Summary = 0
    | [<JsonStringEnumMemberName("interpretation")>] Interpretation = 1
    | [<JsonStringEnumMemberName("quote")>] Quote = 2
    | [<JsonStringEnumMemberName("context")>] Context = 3
    | [<JsonStringEnumMemberName("bibliography")>] Bibliography = 4
    | [<JsonStringEnumMemberName("other")>] Other = 5

[<JsonConverter(typeof<JsonStringEnumConverter>)>]
type NoteSource =
    | [<JsonStringEnumMemberName("manual")>] Manual = 0
    | [<JsonStringEnumMemberName("api")>] Api = 1
    | [<JsonStringEnumMemberName("seed")>] Seed = 2

// DB entity types — mirror the Postgres schema tables

// DB entity types — use string for IDs since SQLite stores UUIDs as TEXT
// and Dapper can't auto-cast TEXT to Guid. string works for both dialects.

[<CLIMutable>]
type School =
    { Id: string
      Slug: string
      Name: string
      AlsoKnownAs: string
      PeriodStartYear: Nullable<int>
      PeriodEndYear: Nullable<int>
      PeriodCertainty: string
      Description: string
      CreatedAt: string
      UpdatedAt: string }

[<CLIMutable>]
type Philosopher =
    { Id: string
      Slug: string
      Name: string
      AlsoKnownAs: string
      BornYear: Nullable<int>
      BornYearEnd: Nullable<int>
      BornCertainty: string
      DiedYear: Nullable<int>
      DiedYearEnd: Nullable<int>
      DiedCertainty: string
      Nationality: string
      BioShort: string
      CreatedAt: string
      UpdatedAt: string }

[<CLIMutable>]
type PhilosopherSchool =
    { Id: string
      PhilosopherId: string
      SchoolId: string
      Role: string
      CreatedAt: string }

[<CLIMutable>]
type PhilosopherInfluence =
    { Id: string
      InfluencerId: string
      InfluencedId: string
      InfluenceType: string
      Description: string
      CreatedAt: string }

[<CLIMutable>]
type Work =
    { Id: string
      Slug: string
      Title: string
      OriginalTitle: string
      PhilosopherId: string
      WorkType: string
      ComposedYear: Nullable<int>
      ComposedYearEnd: Nullable<int>
      ComposedCertainty: string
      OriginalLanguage: string
      DescriptionShort: string
      CreatedAt: string
      UpdatedAt: string }

[<CLIMutable>]
type Note =
    { Id: string
      Content: string
      NoteType: string
      SourceType: string
      SourceName: string
      SourceUrl: string
      PhilosopherId: string
      WorkId: string
      SchoolId: string
      CreatedAt: string
      UpdatedAt: string }

[<CLIMutable>]
type User =
    { Id: string
      Name: string
      Email: string
      CreatedAt: string }

// Argument persistence — see work-history/feat-argument-persistence.md.
// An Argument lifts above any single formalism: a verbal clause sequence
// (premises + conclusion) plus one or more Formalizations that re-encode
// the structure formally. AST payloads are stored as raw JSON to keep the
// F# side independent of the per-formalism shapes (web side parses with
// the existing TS types).

[<CLIMutable>]
type ArgumentRow =
    { Id: string
      ExtractionId: string
      WorkId: string
      SourceFile: string
      SourceStartLine: Nullable<int>
      SourceEndLine: Nullable<int>
      SourceExcerpt: string
      Intent: string
      ExtractorNote: string
      CreatedAt: string
      UpdatedAt: string }

[<CLIMutable>]
type ArgumentClauseRow =
    { Id: string
      ArgumentId: string
      Role: string
      Position: int
      VerbalText: string
      SourceExcerpt: string
      CreatedAt: string }

[<CLIMutable>]
type ArgumentFormalizationRow =
    { Id: string
      ArgumentId: string
      Formalism: string
      IsPrimary: bool
      FitScore: Nullable<double>
      Reason: string
      DistortionRisk: string
      AstJson: string
      CreatedAt: string }

[<CLIMutable>]
type ArgumentAssessmentRow =
    { Id: string
      ArgumentId: string
      Formalism: string
      FitScore: double
      Reason: string
      DistortionRisk: string
      CreatedAt: string }

[<CLIMutable>]
type ArgumentReviewerNoteRow =
    { Id: string
      ArgumentId: string
      Position: int
      Note: string
      CreatedAt: string }

// Attribution: who (philosopher) made this argument, where (work, may differ
// from arguments.work_id if the same argument is cited across works), under
// which formalization (optional), and how the record was produced (provenance).
// One argument can have many attribution rows.
[<CLIMutable>]
type ArgumentAttributionRow =
    { Id: string
      ArgumentId: string
      PhilosopherId: string
      WorkId: string
      FormalizationId: string
      Provenance: string
      SourceText: string
      Note: string
      CreatedAt: string }

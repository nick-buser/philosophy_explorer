namespace PhilosophyExplorer.Domain

open System.Text.Json.Nodes
open System.Text.Json.Serialization

/// API response DTOs — these define the wire format and must stay in sync
/// with the TypeScript client types generated from the OpenAPI spec.

type PhilosopherSummaryDto =
    { [<JsonPropertyName("id")>] Id: string
      [<JsonPropertyName("slug")>] Slug: string
      [<JsonPropertyName("name")>] Name: string
      [<JsonPropertyName("alsoKnownAs")>] AlsoKnownAs: string option
      [<JsonPropertyName("bornYear")>] BornYear: int option
      [<JsonPropertyName("bornCertainty")>] BornCertainty: string
      [<JsonPropertyName("diedYear")>] DiedYear: int option
      [<JsonPropertyName("diedCertainty")>] DiedCertainty: string
      [<JsonPropertyName("nationality")>] Nationality: string option
      [<JsonPropertyName("bioShort")>] BioShort: string option }

type WorkDto =
    { [<JsonPropertyName("id")>] Id: string
      [<JsonPropertyName("slug")>] Slug: string
      [<JsonPropertyName("title")>] Title: string
      [<JsonPropertyName("originalTitle")>] OriginalTitle: string option
      [<JsonPropertyName("workType")>] WorkType: string
      [<JsonPropertyName("composedYear")>] ComposedYear: int option
      [<JsonPropertyName("composedYearEnd")>] ComposedYearEnd: int option
      [<JsonPropertyName("composedCertainty")>] ComposedCertainty: string
      [<JsonPropertyName("originalLanguage")>] OriginalLanguage: string option
      [<JsonPropertyName("descriptionShort")>] DescriptionShort: string option }

type SchoolMembershipDto =
    { [<JsonPropertyName("id")>] Id: string
      [<JsonPropertyName("slug")>] Slug: string
      [<JsonPropertyName("name")>] Name: string
      [<JsonPropertyName("role")>] Role: string }

type RelatedPhilosopherDto =
    { [<JsonPropertyName("id")>] Id: string
      [<JsonPropertyName("slug")>] Slug: string
      [<JsonPropertyName("name")>] Name: string
      [<JsonPropertyName("influenceType")>] InfluenceType: string
      [<JsonPropertyName("description")>] Description: string option }

type NoteDto =
    { [<JsonPropertyName("id")>] Id: string
      [<JsonPropertyName("content")>] Content: string
      [<JsonPropertyName("noteType")>] NoteType: string
      [<JsonPropertyName("sourceType")>] SourceType: string
      [<JsonPropertyName("sourceName")>] SourceName: string option
      [<JsonPropertyName("sourceUrl")>] SourceUrl: string option }

type PhilosopherDetailDto =
    { [<JsonPropertyName("id")>] Id: string
      [<JsonPropertyName("slug")>] Slug: string
      [<JsonPropertyName("name")>] Name: string
      [<JsonPropertyName("alsoKnownAs")>] AlsoKnownAs: string option
      [<JsonPropertyName("bornYear")>] BornYear: int option
      [<JsonPropertyName("bornCertainty")>] BornCertainty: string
      [<JsonPropertyName("diedYear")>] DiedYear: int option
      [<JsonPropertyName("diedCertainty")>] DiedCertainty: string
      [<JsonPropertyName("nationality")>] Nationality: string option
      [<JsonPropertyName("bioShort")>] BioShort: string option
      [<JsonPropertyName("works")>] Works: WorkDto list
      [<JsonPropertyName("schools")>] Schools: SchoolMembershipDto list
      [<JsonPropertyName("influences")>] Influences: RelatedPhilosopherDto list
      [<JsonPropertyName("influencedBy")>] InfluencedBy: RelatedPhilosopherDto list
      [<JsonPropertyName("notes")>] Notes: NoteDto list }

type WorkListItemDto =
    { [<JsonPropertyName("id")>] Id: string
      [<JsonPropertyName("slug")>] Slug: string
      [<JsonPropertyName("title")>] Title: string
      [<JsonPropertyName("originalTitle")>] OriginalTitle: string option
      [<JsonPropertyName("workType")>] WorkType: string
      [<JsonPropertyName("composedYear")>] ComposedYear: int option
      [<JsonPropertyName("composedYearEnd")>] ComposedYearEnd: int option
      [<JsonPropertyName("composedCertainty")>] ComposedCertainty: string
      [<JsonPropertyName("originalLanguage")>] OriginalLanguage: string option
      [<JsonPropertyName("descriptionShort")>] DescriptionShort: string option
      [<JsonPropertyName("philosopherId")>] PhilosopherId: string
      [<JsonPropertyName("philosopherName")>] PhilosopherName: string
      [<JsonPropertyName("philosopherSlug")>] PhilosopherSlug: string }

type WorkDetailDto =
    { [<JsonPropertyName("id")>] Id: string
      [<JsonPropertyName("slug")>] Slug: string
      [<JsonPropertyName("title")>] Title: string
      [<JsonPropertyName("originalTitle")>] OriginalTitle: string option
      [<JsonPropertyName("workType")>] WorkType: string
      [<JsonPropertyName("composedYear")>] ComposedYear: int option
      [<JsonPropertyName("composedYearEnd")>] ComposedYearEnd: int option
      [<JsonPropertyName("composedCertainty")>] ComposedCertainty: string
      [<JsonPropertyName("originalLanguage")>] OriginalLanguage: string option
      [<JsonPropertyName("descriptionShort")>] DescriptionShort: string option
      [<JsonPropertyName("philosopherId")>] PhilosopherId: string
      [<JsonPropertyName("philosopherName")>] PhilosopherName: string
      [<JsonPropertyName("philosopherSlug")>] PhilosopherSlug: string
      [<JsonPropertyName("notes")>] Notes: NoteDto list }

type SchoolListItemDto =
    { [<JsonPropertyName("id")>] Id: string
      [<JsonPropertyName("slug")>] Slug: string
      [<JsonPropertyName("name")>] Name: string
      [<JsonPropertyName("alsoKnownAs")>] AlsoKnownAs: string option
      [<JsonPropertyName("periodStartYear")>] PeriodStartYear: int option
      [<JsonPropertyName("periodEndYear")>] PeriodEndYear: int option
      [<JsonPropertyName("periodCertainty")>] PeriodCertainty: string
      [<JsonPropertyName("description")>] Description: string option }

type SchoolMemberDto =
    { [<JsonPropertyName("id")>] Id: string
      [<JsonPropertyName("slug")>] Slug: string
      [<JsonPropertyName("name")>] Name: string
      [<JsonPropertyName("nationality")>] Nationality: string option
      [<JsonPropertyName("bornYear")>] BornYear: int option
      [<JsonPropertyName("bornCertainty")>] BornCertainty: string
      [<JsonPropertyName("diedYear")>] DiedYear: int option
      [<JsonPropertyName("diedCertainty")>] DiedCertainty: string
      [<JsonPropertyName("role")>] Role: string }

type SchoolDetailDto =
    { [<JsonPropertyName("id")>] Id: string
      [<JsonPropertyName("slug")>] Slug: string
      [<JsonPropertyName("name")>] Name: string
      [<JsonPropertyName("alsoKnownAs")>] AlsoKnownAs: string option
      [<JsonPropertyName("periodStartYear")>] PeriodStartYear: int option
      [<JsonPropertyName("periodEndYear")>] PeriodEndYear: int option
      [<JsonPropertyName("periodCertainty")>] PeriodCertainty: string
      [<JsonPropertyName("description")>] Description: string option
      [<JsonPropertyName("members")>] Members: SchoolMemberDto list }

// Graph DTOs — mirror packages/api/src/graph/types.ts

type GraphNodeDto =
    { [<JsonPropertyName("key")>] Key: string
      [<JsonPropertyName("label")>] Label: string
      [<JsonPropertyName("attributes")>] Attributes: Map<string, obj> }

type GraphEdgeDto =
    { [<JsonPropertyName("key")>] Key: string
      [<JsonPropertyName("source")>] Source: string
      [<JsonPropertyName("target")>] Target: string
      [<JsonPropertyName("type")>] Type: string
      [<JsonPropertyName("attributes")>] Attributes: Map<string, obj> }

type SerializedSubgraphDto =
    { [<JsonPropertyName("nodes")>] Nodes: GraphNodeDto list
      [<JsonPropertyName("edges")>] Edges: GraphEdgeDto list }

type SubgraphMetaDto =
    { [<JsonPropertyName("nodeCount")>] NodeCount: int
      [<JsonPropertyName("edgeCount")>] EdgeCount: int
      [<JsonPropertyName("rootKey")>] RootKey: string option
      [<JsonPropertyName("depth")>] Depth: int option }

type SubgraphResponseDto =
    { [<JsonPropertyName("graph")>] Graph: SerializedSubgraphDto
      [<JsonPropertyName("meta")>] Meta: SubgraphMetaDto }

type GraphPathDto =
    { [<JsonPropertyName("nodes")>] Nodes: GraphNodeDto list
      [<JsonPropertyName("edges")>] Edges: GraphEdgeDto list
      [<JsonPropertyName("length")>] Length: int }

type PathResponseDto =
    { [<JsonPropertyName("path")>] Path: GraphPathDto option }

type GraphStatsDto =
    { [<JsonPropertyName("nodeCount")>] NodeCount: int
      [<JsonPropertyName("edgeCount")>] EdgeCount: int }

type HealthResponseDto =
    { [<JsonPropertyName("status")>] Status: string
      [<JsonPropertyName("db")>] Db: string
      [<JsonPropertyName("env")>] Env: HealthEnvDto }

and HealthEnvDto =
    { [<JsonPropertyName("DATABASE_URL")>] DatabaseUrl: bool
      [<JsonPropertyName("ALLOWED_ORIGINS")>] AllowedOrigins: bool }

type HealthErrorResponseDto =
    { [<JsonPropertyName("status")>] Status: string
      [<JsonPropertyName("error")>] Error: string
      [<JsonPropertyName("env")>] Env: HealthEnvDto }

type ErrorResponseDto =
    { [<JsonPropertyName("error")>] Error: string }

// Argument DTOs. The `ast` field on a formalization is opaque to the F# side
// (JsonNode) — the web client narrows it via the `formalism` discriminator and
// parses it with the existing TS logic types. This keeps the wire schema
// stable as new formalisms are added without dragging every AST through
// Swashbuckle.

type ArgumentClauseDto =
    { [<JsonPropertyName("id")>] Id: string
      [<JsonPropertyName("role")>] Role: string
      [<JsonPropertyName("position")>] Position: int
      [<JsonPropertyName("verbalText")>] VerbalText: string option
      [<JsonPropertyName("sourceExcerpt")>] SourceExcerpt: string option }

type ArgumentFormalizationDto =
    { [<JsonPropertyName("id")>] Id: string
      [<JsonPropertyName("formalism")>] Formalism: string
      [<JsonPropertyName("isPrimary")>] IsPrimary: bool
      [<JsonPropertyName("fitScore")>] FitScore: float option
      [<JsonPropertyName("reason")>] Reason: string option
      [<JsonPropertyName("distortionRisk")>] DistortionRisk: string option
      [<JsonPropertyName("ast")>] Ast: JsonNode }

type ArgumentAssessmentDto =
    { [<JsonPropertyName("formalism")>] Formalism: string
      [<JsonPropertyName("fitScore")>] FitScore: float
      [<JsonPropertyName("reason")>] Reason: string
      [<JsonPropertyName("distortionRisk")>] DistortionRisk: string option }

type ArgumentSourceSpanDto =
    { [<JsonPropertyName("file")>] File: string option
      [<JsonPropertyName("startLine")>] StartLine: int option
      [<JsonPropertyName("endLine")>] EndLine: int option
      [<JsonPropertyName("excerpt")>] Excerpt: string option }

type ArgumentSummaryDto =
    { [<JsonPropertyName("id")>] Id: string
      [<JsonPropertyName("extractionId")>] ExtractionId: string
      [<JsonPropertyName("workId")>] WorkId: string option
      [<JsonPropertyName("workSlug")>] WorkSlug: string option
      [<JsonPropertyName("workTitle")>] WorkTitle: string option
      [<JsonPropertyName("intent")>] Intent: string
      [<JsonPropertyName("primaryFormalism")>] PrimaryFormalism: string
      [<JsonPropertyName("clauseCount")>] ClauseCount: int }

type ArgumentAttributionDto =
    { [<JsonPropertyName("id")>] Id: string
      [<JsonPropertyName("philosopherId")>] PhilosopherId: string
      [<JsonPropertyName("philosopherSlug")>] PhilosopherSlug: string
      [<JsonPropertyName("philosopherName")>] PhilosopherName: string
      [<JsonPropertyName("workId")>] WorkId: string option
      [<JsonPropertyName("workSlug")>] WorkSlug: string option
      [<JsonPropertyName("workTitle")>] WorkTitle: string option
      [<JsonPropertyName("formalizationId")>] FormalizationId: string option
      [<JsonPropertyName("provenance")>] Provenance: string
      [<JsonPropertyName("sourceText")>] SourceText: string option
      [<JsonPropertyName("note")>] Note: string option }

type ArgumentDetailDto =
    { [<JsonPropertyName("id")>] Id: string
      [<JsonPropertyName("extractionId")>] ExtractionId: string
      [<JsonPropertyName("workId")>] WorkId: string option
      [<JsonPropertyName("workSlug")>] WorkSlug: string option
      [<JsonPropertyName("workTitle")>] WorkTitle: string option
      [<JsonPropertyName("source")>] Source: ArgumentSourceSpanDto
      [<JsonPropertyName("intent")>] Intent: string
      [<JsonPropertyName("extractorNote")>] ExtractorNote: string option
      [<JsonPropertyName("clauses")>] Clauses: ArgumentClauseDto list
      [<JsonPropertyName("formalizations")>] Formalizations: ArgumentFormalizationDto list
      [<JsonPropertyName("assessments")>] Assessments: ArgumentAssessmentDto list
      [<JsonPropertyName("reviewerNotes")>] ReviewerNotes: string list
      [<JsonPropertyName("attributions")>] Attributions: ArgumentAttributionDto list }

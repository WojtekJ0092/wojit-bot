// ---------------------------------------------------------------------------
// API type definitions — mirrors the backend contract in docs/backend architicture.md
// ---------------------------------------------------------------------------

// ---- Filters & Taxonomy ---------------------------------------------------

export interface Filters {
  country: string[];
  school_type: string[];
  cohort_year: number[];
}

export interface Taxonomy {
  country: string[];
  school_type: string[];
  cohort_year: number[];
}

// ---- Search ---------------------------------------------------------------

export interface SearchParams {
  query: string;
  country?: string;
  school_type?: string;
  cohort_year?: number;
  top_k?: number;
  cursor?: string | null;
}

export interface SearchChunk {
  chunk_id: string;
  snippet: string;
  ts_start: string;
  ts_end: string;
  score: number;
}

export interface SearchResponse {
  total_matches: number;
  distinct_interviews: number;
  items: SearchChunk[];
  cursor: string | null;
}

// ---- Answer ---------------------------------------------------------------

export interface AnswerRequest {
  query: string;
  filters: Filters;
  stream: boolean;
}

export interface Citation {
  chunk_id: string;
  ts_start: string;
  ts_end: string;
}

export interface AnswerResponse {
  blurred: boolean;
  disclaimer: string | null;
  answer: string;
  citations: Citation[];
  evidence_count: number;
  distinct_interviews: number;
  confidence: number;
}

// ---- SSE Events -----------------------------------------------------------

export interface SSEDeltaEvent {
  type: "delta";
  text: string;
}

export interface SSEStatsEvent {
  type: "stats";
  confidence: number;
  evidence_count: number;
  distinct_interviews: number;
}

export interface SSEAlignmentEvent {
  type: "alignment";
  canonical_question: string;
}

export interface SSEEndEvent {
  type: "end";
  answer: string;
  citations: Citation[];
  confidence: number;
  evidence_count: number;
  distinct_interviews: number;
}

export type SSEEvent =
  | SSEDeltaEvent
  | SSEStatsEvent
  | SSEAlignmentEvent
  | SSEEndEvent;

// ---- Errors ---------------------------------------------------------------

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    request_id: string;
  };
}

export type ApiErrorCode =
  | "unauthorised"
  | "rate_limited"
  | "invalid_filters"
  | "cohort_too_small"
  | "insufficient_evidence"
  | "consent_required"
  | "interview_redacted"
  | "visibility_denied"
  | "server_error";

// ---- Version / compatibility -----------------------------------------------

export interface VersionHeaders {
  apiVersion: string;
  schemaHash: string;
}

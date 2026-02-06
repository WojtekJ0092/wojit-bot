// ---------------------------------------------------------------------------
// Typed wrappers around the three public endpoints
// Falls back to local JSON fixtures when VITE_USE_FIXTURES=true
// ---------------------------------------------------------------------------

import { apiGet, apiPost } from "./client";
import type {
  AnswerRequest,
  AnswerResponse,
  Filters,
  SearchParams,
  SearchResponse,
  Taxonomy,
} from "./types";

// ---- Fixture imports (tree-shaken in production when not used) -------------
import taxonomyFixture from "@/fixtures/taxonomy.json";
import searchFixture from "@/fixtures/search.json";
import answerFixture from "@/fixtures/answer.json";

const USE_FIXTURES = import.meta.env.VITE_USE_FIXTURES === "true";

/** Simulate network latency in fixture mode. */
function fakeDelay(ms = 400): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** GET /api/search */
export async function fetchSearch(
  params: SearchParams,
  signal?: AbortSignal,
): Promise<SearchResponse> {
  if (USE_FIXTURES) {
    await fakeDelay();
    signal?.throwIfAborted();
    return searchFixture as SearchResponse;
  }
  return apiGet<SearchResponse>(
    "/api/search",
    {
      query: params.query,
      country: params.country,
      school_type: params.school_type,
      cohort_year: params.cohort_year,
      top_k: params.top_k,
      cursor: params.cursor,
    },
    signal,
  );
}

/** POST /api/answer (non-streaming) */
export async function fetchAnswer(
  query: string,
  filters: Filters,
  signal?: AbortSignal,
): Promise<AnswerResponse> {
  if (USE_FIXTURES) {
    await fakeDelay(800);
    signal?.throwIfAborted();
    return answerFixture as AnswerResponse;
  }
  const body: AnswerRequest = { query, filters, stream: false };
  return apiPost<AnswerResponse>("/api/answer", body, signal);
}

/** GET /api/meta/taxonomy — returns live facet values */
export async function fetchTaxonomy(
  signal?: AbortSignal,
): Promise<Taxonomy> {
  if (USE_FIXTURES) {
    await fakeDelay(200);
    signal?.throwIfAborted();
    return taxonomyFixture as Taxonomy;
  }
  return apiGet<Taxonomy>("/api/meta/taxonomy", undefined, signal);
}

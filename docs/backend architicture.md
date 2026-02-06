LTL Commit Chatbot Backend Guide
Place this file in your repository (for example: BACKEND.md).
It describes everything your frontend needs in order to connect to the public chat API.
1. Authentication
Scheme: HTTP Bearer
Header: Authorization: Bearer <token>
Token types:
public: read-only; can access /api/search, /api/answer, /api/meta/*.
student/teacher/admin: additional internal features; not required for public chatbot builds.
Retry rules:
If you receive 401 unauthorised, prompt the user for a new token and retry once.
Visibility rules:
Public tokens cannot see consent-protected segments, redaction details, or flags.
If visibility is restricted, the server will return a blurred answer or a consent/visibility error.
Do not attempt to bypass or modify these rules on the frontend.
2. Core Endpoints (public chatbots use only these)
GET /api/search
Query parameters:
query, country, school_type, cohort_year, top_k, cursor
Returns candidate chunks for preview and “Show sources”.
POST /api/answer
Body:
{
  "query": "string",
  "filters": {
    "country": [],
    "school_type": [],
    "cohort_year": []
  },
  "stream": false
}
Returns a grounded synthesis with citations, or a blurred summary if the cohort is too small.
Example: Search
/api/search?query=homework%20projects&country=PL&school_type=private&cohort_year=3&top_k=30
Response:
{
  "total_matches": 27,
  "distinct_interviews": 12,
  "items": [
    {
      "chunk_id": "c_8f12",
      "snippet": "Projects feel meaningful; homework repeats...",
      "ts_start": "00:08:17",
      "ts_end": "00:09:05",
      "score": 0.83
    }
  ],
  "cursor": null
}
Example: Answer (normal)
{
  "blurred": false,
  "disclaimer": null,
  "answer": "Across Polish private Year 3 interviews, students say projects feel more purposeful than routine homework...",
  "citations": [
    { "chunk_id": "c_8f12", "ts_start": "00:08:17", "ts_end": "00:09:05" },
    { "chunk_id": "c_a9de", "ts_start": "00:04:09", "ts_end": "00:04:55" }
  ],
  "evidence_count": 27,
  "distinct_interviews": 12,
  "confidence": 0.78
}
Example: Answer (blur mode)
Returned when filters create a cohort below the anonymity threshold.
{
  "blurred": true,
  "disclaimer": "Few responses meet your filters; summary blends nearby data to protect anonymity.",
  "answer": "Students generally emphasise purpose over routine tasks. Where projects are present, homework is viewed as less necessary.",
  "citations": [],
  "evidence_count": 3,
  "distinct_interviews": 3,
  "confidence": 0.52
}
3. Filters and Taxonomy
Facets available:
country (ISO-2)
school_type (public, private, technical, military, SEN, home, christian, etc.)
cohort_year (1–4)
Rules:
Multiple values per facet are allowed.
Empty filters mean “global”.
Do not invent facet values.
Always request the live taxonomy from:
GET /api/meta/taxonomy
Returns the authoritative lists of facet values your frontend must use.
4. Streaming (optional)
POST /api/answer with "stream": true returns Server-Sent Events (SSE).
Event types:
delta (partial text)
stats (confidence, counts)
alignment (canonical-question trace; optional to use)
end (final full answer + citations)
Your frontend must:
Accumulate delta events into the answer box.
Replace the entire text with the final output on end.
Cancel in-flight SSE connections when filters or queries change.
If SSE is too complex, set "stream": false.
5. Error Handling
All errors follow this shape:
{
  "error": {
    "code": "string",
    "message": "human readable",
    "request_id": "uuid"
  }
}
Common codes:
unauthorised
rate_limited
invalid_filters
cohort_too_small
insufficient_evidence
consent_required
interview_redacted
visibility_denied
server_error
Frontend rules:
Show the server’s message verbatim.
For cohort_too_small, surface the backend’s disclaimer.
For insufficient_evidence, suggest broadening filters.
6. Privacy and Display Rules
Citations UI must:
Never display actual interview_id or segment_id.
Use pseudonyms if provided; otherwise synthesise e.g. PL-PVT-Y3-07.
Display time ranges (ts_start, ts_end) and snippet previews.
Provide a collapsible “Show sources” drawer.
If any personal data appears:
Treat as a backend bug.
Display a generic error.
7. Rate Limits and Retries
Backend may send:
Retry-After header
X-RateLimit-Remaining
X-RateLimit-Reset
Rules:
On 429, show a gentle “Please wait” and retry once.
Debounce searches (300 ms or more).
Cancel previous requests when filters change.
8. Versioning and Compatibility
The OpenAPI contract is at /api/openapi.json.
Responses include:
X-API-Version: v1
X-Schema-Hash: <hash>
Your build should:
Type-check against /api/openapi.json at dev time.
Warn the user to refresh if version or schema hash changes.
9. CORS and Origins
Backend enforces an origin whitelist.
Provide your dev origin, e.g. http://localhost:5173.
Public endpoints do not require cookies.
Use bearer tokens only.
10. Telemetry (Optional)
You may send:
Client ID (non-identifying)
X-Request-ID (UUID)
The server will echo them back.
Useful for: debugging latency, knowing whether blur mode triggered.
11. Performance Targets (Frontend)
Cached responses: under 2 seconds.
Cold responses: 5–7 seconds.
Streaming builds should show partial text in under 900 ms.
Virtualise the citations panel; do not render everything at once.
12. Build Checklist (Students)
Add an .env file:
VITE_API_BASE=https://your-api
VITE_PUBLIC_TOKEN=...
Implement:
Auth header
Filter multi-selects (using real taxonomy)
Answer view for normal vs blurred answers
“Show sources” drawer
Error rendering using the standard schema
Optional SSE streaming mode
13. Test Harness (Recommended)
Use static JSON fixtures so your UI can be developed without the real API.
Fixtures should include:
Successful search
Successful answer
Blur-mode answer
cohort_too_small
consent_required
SSE fixture (optional)
Switch VITE_API_BASE to the real API when ready.
14. Security Notes
Treat tokens as secrets; never commit them.
Public tokens cannot show consent flows, internal metadata, or flags.
Do not surface or log personal data.
Enforce HTTPS in production.
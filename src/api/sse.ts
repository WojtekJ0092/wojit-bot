// ---------------------------------------------------------------------------
// SSE streaming helper — parses Server-Sent Events from a fetch Response
// ---------------------------------------------------------------------------

import { apiPostStream } from "./client";
import type { AnswerRequest, Filters, SSEEvent } from "./types";

export interface SSECallbacks {
  onDelta: (text: string) => void;
  onStats: (stats: { confidence: number; evidence_count: number; distinct_interviews: number }) => void;
  onAlignment?: (canonical: string) => void;
  onEnd: (final: SSEEvent & { type: "end" }) => void;
  onError: (err: unknown) => void;
}

/**
 * Stream an answer from POST /api/answer with `stream: true`.
 *
 * Returns an AbortController so the caller can cancel the connection
 * (e.g. when filters or query change).
 */
export function streamAnswer(
  query: string,
  filters: Filters,
  callbacks: SSECallbacks,
): AbortController {
  const controller = new AbortController();
  const body: AnswerRequest = { query, filters, stream: true };

  const { response } = apiPostStream("/api/answer", body, controller.signal);

  response
    .then(async (res) => {
      if (!res.ok || !res.body) {
        const errBody = await res.json();
        callbacks.onError(errBody);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (!json) continue;

          try {
            const event = JSON.parse(json) as SSEEvent;
            switch (event.type) {
              case "delta":
                callbacks.onDelta(event.text);
                break;
              case "stats":
                callbacks.onStats(event);
                break;
              case "alignment":
                callbacks.onAlignment?.(event.canonical_question);
                break;
              case "end":
                callbacks.onEnd(event);
                break;
            }
          } catch {
            // Ignore malformed lines
          }
        }
      }
    })
    .catch((err) => {
      if ((err as Error).name !== "AbortError") {
        callbacks.onError(err);
      }
    });

  return controller;
}

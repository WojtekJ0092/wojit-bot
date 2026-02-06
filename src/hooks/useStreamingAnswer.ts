// ---------------------------------------------------------------------------
// useStreamingAnswer — SSE streaming answer hook
// ---------------------------------------------------------------------------

import { useCallback, useRef, useState } from "react";
import { streamAnswer } from "@/api";
import type { AnswerResponse, Filters, SSEEvent } from "@/api";

interface UseStreamingAnswerResult {
  /** Partial text accumulated so far from delta events. */
  partialText: string;
  /** Final complete response (set when the "end" event arrives). */
  data: AnswerResponse | null;
  loading: boolean;
  error: string | null;
  /** Begin streaming an answer. Cancels any previous stream. */
  ask: (query: string, filters: Filters) => void;
  /** Abort the current stream and clear state. */
  cancel: () => void;
}

export function useStreamingAnswer(): UseStreamingAnswerResult {
  const [partialText, setPartialText] = useState("");
  const [data, setData] = useState<AnswerResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const ask = useCallback((query: string, filters: Filters) => {
    // Cancel any in-flight stream
    controllerRef.current?.abort();

    setPartialText("");
    setData(null);
    setError(null);
    setLoading(true);

    const controller = streamAnswer(query, filters, {
      onDelta(text) {
        setPartialText((prev) => prev + text);
      },
      onStats() {
        // Stats can be shown in the UI if needed
      },
      onEnd(final: SSEEvent & { type: "end" }) {
        setData({
          blurred: false,
          disclaimer: null,
          answer: final.answer,
          citations: final.citations,
          evidence_count: final.evidence_count,
          distinct_interviews: final.distinct_interviews,
          confidence: final.confidence,
        });
        setPartialText("");
        setLoading(false);
      },
      onError(err) {
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      },
    });

    controllerRef.current = controller;
  }, []);

  const cancel = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setLoading(false);
  }, []);

  return { partialText, data, loading, error, ask, cancel };
}

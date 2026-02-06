// ---------------------------------------------------------------------------
// useAnswer — request a grounded answer (non-streaming)
// ---------------------------------------------------------------------------

import { useCallback, useRef, useState } from "react";
import { fetchAnswer, ApiError } from "@/api";
import type { AnswerResponse, Filters } from "@/api";

interface UseAnswerResult {
  data: AnswerResponse | null;
  loading: boolean;
  error: string | null;
  errorCode: string | null;
  ask: (query: string, filters: Filters) => void;
  reset: () => void;
}

export function useAnswer(): UseAnswerResult {
  const [data, setData] = useState<AnswerResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const ask = useCallback((query: string, filters: Filters) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError(null);
    setErrorCode(null);
    setData(null);

    fetchAnswer(query, filters, controller.signal)
      .then(setData)
      .catch((err) => {
        if ((err as Error).name === "AbortError") return;
        if (err instanceof ApiError) {
          setError(err.message);
          setErrorCode(err.code);
        } else {
          setError("An unexpected error occurred.");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const reset = useCallback(() => {
    controllerRef.current?.abort();
    setData(null);
    setError(null);
    setErrorCode(null);
    setLoading(false);
  }, []);

  return { data, loading, error, errorCode, ask, reset };
}

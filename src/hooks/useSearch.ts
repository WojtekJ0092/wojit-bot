// ---------------------------------------------------------------------------
// useSearch — debounced search hook
// ---------------------------------------------------------------------------

import { useEffect, useRef, useState } from "react";
import { fetchSearch, ApiError } from "@/api";
import type { SearchResponse, SearchParams } from "@/api";

interface UseSearchResult {
  data: SearchResponse | null;
  loading: boolean;
  error: string | null;
}

const DEBOUNCE_MS = 300;

export function useSearch(params: SearchParams | null): UseSearchResult {
  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!params || !params.query.trim()) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    // Cancel previous in-flight request
    controllerRef.current?.abort();

    const timeout = setTimeout(() => {
      const controller = new AbortController();
      controllerRef.current = controller;
      setLoading(true);
      setError(null);

      fetchSearch(params, controller.signal)
        .then(setData)
        .catch((err) => {
          if ((err as Error).name === "AbortError") return;
          if (err instanceof ApiError) {
            setError(err.message);
          } else {
            setError("An unexpected error occurred.");
          }
        })
        .finally(() => setLoading(false));
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timeout);
      controllerRef.current?.abort();
    };
  }, [
    params?.query,
    params?.country,
    params?.school_type,
    params?.cohort_year,
    params?.top_k,
    params?.cursor,
  ]);

  return { data, loading, error };
}

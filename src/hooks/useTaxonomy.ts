// ---------------------------------------------------------------------------
// useTaxonomy — fetches the live taxonomy once and caches it
// ---------------------------------------------------------------------------

import { useEffect, useState } from "react";
import { fetchTaxonomy } from "@/api";
import type { Taxonomy } from "@/api";

interface UseTaxonomyResult {
  taxonomy: Taxonomy | null;
  loading: boolean;
  error: string | null;
}

export function useTaxonomy(): UseTaxonomyResult {
  const [taxonomy, setTaxonomy] = useState<Taxonomy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetchTaxonomy(controller.signal)
      .then(setTaxonomy)
      .catch((err) => {
        if ((err as Error).name !== "AbortError") {
          setError((err as Error).message);
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  return { taxonomy, loading, error };
}

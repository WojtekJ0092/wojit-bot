// ---------------------------------------------------------------------------
// App — main application component
// ---------------------------------------------------------------------------

import { useCallback, useState } from "react";
import type { Filters } from "@/api";
import { useTaxonomy, useAnswer } from "@/hooks";
import {
  Layout,
  FilterBar,
  ChatInput,
  AnswerView,
  SourcesDrawer,
  ErrorBanner,
  CursorTrail,
  WaterBackground,
} from "@/components";

const EMPTY_FILTERS: Filters = {
  country: [],
  school_type: [],
  cohort_year: [],
};

export default function App() {
  const { taxonomy, loading: taxLoading, error: taxError } = useTaxonomy();
  const { data, loading, error, errorCode, ask, reset } = useAnswer();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  const handleAsk = useCallback(
    (query: string) => {
      reset();
      ask(query, filters);
    },
    [ask, reset, filters],
  );

  return (
    <>
      <WaterBackground />
      <CursorTrail />
      <Layout>
      {/* Taxonomy load error */}
      {taxError && <ErrorBanner message={taxError} />}

      {/* Filter bar */}
      <FilterBar
        taxonomy={taxonomy}
        filters={filters}
        onChange={setFilters}
        disabled={taxLoading}
      />

      {/* Chat input */}
      <ChatInput onSubmit={handleAsk} disabled={loading} />

      {/* API error */}
      <ErrorBanner message={error} code={errorCode} onDismiss={reset} />

      {/* Answer */}
      <AnswerView data={data} loading={loading} />

      {/* Sources drawer */}
      {data && <SourcesDrawer citations={data.citations} />}
      </Layout>
    </>
  );
}

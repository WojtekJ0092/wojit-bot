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
  SettingsPanel,
  NewsPanel,
  NukeEgg,
} from "@/components";
import type { SpeedMode } from "@/components/SettingsPanel";
import type { ToneMode } from "@/components/SettingsPanel";

const EMPTY_FILTERS: Filters = {
  country: [],
  school_type: [],
  cohort_year: [],
};

export default function App() {
  const { taxonomy, loading: taxLoading, error: taxError } = useTaxonomy();
  const { data, loading, error, errorCode, ask, reset } = useAnswer();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [speed, setSpeed] = useState<SpeedMode>("normal");
  const [tone, setTone] = useState<ToneMode>("technical");

  const handleAsk = useCallback(
    (query: string) => {
      reset();
      const toneHint =
        tone === "friendly"
          ? "[Answer in a warm, friendly, empathetic conversational tone] "
          : "[Answer in a precise, technical, data-driven tone] ";
      ask(toneHint + query, filters);
    },
    [ask, reset, filters, tone],
  );

  return (
    <>
      <div className="intro-float" style={{ animationDelay: "1.1s" }}>
        <SettingsPanel onSpeedChange={setSpeed} onToneChange={setTone} />
      </div>
      <NewsPanel />
      <CursorTrail />
      <NukeEgg />
      <Layout>
      {/* Taxonomy load error */}
      {taxError && <ErrorBanner message={taxError} />}

      {/* Filter bar */}
      <div className="intro-float" style={{ animationDelay: "0.6s", position: "relative", zIndex: 20 }}>
        <FilterBar
          taxonomy={taxonomy}
          filters={filters}
          onChange={setFilters}
          disabled={taxLoading}
        />
      </div>

      {/* Chat input */}
      <div className="intro-float" style={{ animationDelay: "0.85s", position: "relative", zIndex: 1 }}>
        <ChatInput onSubmit={handleAsk} disabled={loading} />
      </div>

      {/* API error */}
      <ErrorBanner message={error} code={errorCode} onDismiss={reset} />

      {/* Answer */}
      <AnswerView data={data} loading={loading} speed={speed} tone={tone} />

      {/* Sources drawer */}
      {data && <SourcesDrawer citations={data.citations} />}
      </Layout>
    </>
  );
}

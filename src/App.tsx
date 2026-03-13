// ---------------------------------------------------------------------------
// App — main application component
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useState } from "react";
import type { AnswerResponse, Filters } from "@/api";
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

const STARTER_PROMPTS = [
  "Summarize Year 1 student concerns in 5 bullets.",
  "Compare public vs private school interview themes.",
  "What changed most between cohort years 1 and 4?",
  "Give me key trends with confidence and evidence count.",
];

const LAST_PROMPT_KEY = "wojit:last-starter-prompt";

interface HistoryItem {
  id: number;
  data: AnswerResponse;
}

export default function App() {
  const { taxonomy, loading: taxLoading, error: taxError } = useTaxonomy();
  const { data, loading, error, errorCode, ask, reset } = useAnswer();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [speed, setSpeed] = useState<SpeedMode>("normal");
  const [tone, setTone] = useState<ToneMode>("technical");
  const [lastStarterPrompt, setLastStarterPrompt] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const saved = window.localStorage.getItem(LAST_PROMPT_KEY);
    if (saved) {
      setLastStarterPrompt(saved);
    }
  }, []);

  useEffect(() => {
    if (!data) return;
    setHistory((prev) => [...prev, { id: Date.now() + Math.random(), data }]);
  }, [data]);

  useEffect(() => {
    const main = document.querySelector<HTMLElement>(".layout__main");
    if (!main) return;
    // Keep the newest reply visible so the app feels responsive.
    main.scrollTo({ top: main.scrollHeight, behavior: "smooth" });
  }, [history.length, loading]);

  useEffect(() => {
    function handleGlobalShortcuts(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const typing =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target?.isContentEditable;

      if (e.key === "/" && !typing) {
        e.preventDefault();
        const input = document.querySelector<HTMLInputElement>("#chat-input-field");
        input?.focus();
      }

      if (e.key === "Escape") {
        document.dispatchEvent(new CustomEvent("app:close-overlays"));
      }
    }

    document.addEventListener("keydown", handleGlobalShortcuts);
    return () => document.removeEventListener("keydown", handleGlobalShortcuts);
  }, []);

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

  const handleStarterPrompt = useCallback(
    (prompt: string) => {
      setLastStarterPrompt(prompt);
      window.localStorage.setItem(LAST_PROMPT_KEY, prompt);
      handleAsk(prompt);
    },
    [handleAsk],
  );

  const latestAnswer = data ?? history[history.length - 1]?.data ?? null;

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
        <div className="starter-prompts" aria-label="Starter prompts">
          {STARTER_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className={`starter-prompts__chip ${lastStarterPrompt === prompt ? "starter-prompts__chip--active" : ""}`}
              disabled={loading}
              onClick={() => handleStarterPrompt(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* API error */}
      <ErrorBanner message={error} code={errorCode} onDismiss={reset} />

      {/* Answer history + current loading state */}
      {history.map((item) => (
        <AnswerView
          key={item.id}
          data={item.data}
          speed={speed}
          tone={tone}
        />
      ))}
      {loading && <AnswerView data={null} loading speed={speed} tone={tone} />}

      {/* Sources drawer */}
      {latestAnswer && <SourcesDrawer citations={latestAnswer.citations} />}
      </Layout>
    </>
  );
}

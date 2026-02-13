// ---------------------------------------------------------------------------
// AnswerView — renders normal and blurred answers with confidence badge
// ---------------------------------------------------------------------------

import type { AnswerResponse } from "@/api";
import { useTypewriter } from "@/hooks";
import type { SpeedMode } from "./SettingsPanel";

const SPEED_CONFIG: Record<SpeedMode, { charsPerTick: number; interval: number }> = {
  kubica: { charsPerTick: 1000, interval: 1 },
  fast:   { charsPerTick: 3, interval: 10 },
  normal: { charsPerTick: 1, interval: 25 },
  slow:   { charsPerTick: 1, interval: 55 },
};

interface AnswerViewProps {
  data: AnswerResponse | null;
  /** Partial streaming text (displayed while SSE is in progress). */
  partialText?: string;
  loading?: boolean;
  speed?: SpeedMode;
}

export function AnswerView({ data, partialText, loading, speed = "normal" }: AnswerViewProps) {
  const isKubica = speed === "kubica";
  const cfg = SPEED_CONFIG[speed];
  const { displayedText, isTyping } = useTypewriter(
    isKubica ? null : (data?.answer ?? null),
    { charsPerTick: cfg.charsPerTick, interval: cfg.interval },
  );

  // Kubica mode: full text instantly, no typewriter
  const finalText = isKubica ? (data?.answer ?? "") : displayedText;
  const stillTyping = isKubica ? false : isTyping;

  if (loading && !partialText) {
    return <div className="answer-view answer-view--loading">Thinking…</div>;
  }

  // While streaming, show the partial text
  if (partialText) {
    return (
      <div className="answer-view answer-view--streaming">
        <p className="answer-view__text">{partialText}</p>
      </div>
    );
  }

  if (!data) return null;

  // Split displayed text into individual characters for animation
  const chars = finalText.split("");

  return (
    <div
      className={`answer-view ${data.blurred ? "answer-view--blurred" : ""}`}
    >
      {data.blurred && data.disclaimer && (
        <div className="answer-view__disclaimer" role="alert">
          {data.disclaimer}
        </div>
      )}

      <p className={`answer-view__text ${isKubica ? "" : "answer-view__text--diving"}`}>
        {isKubica
          ? finalText
          : chars.map((char, i) => (
              <span
                key={i}
                className="dive-char"
                style={{ animationDelay: `${i * 12}ms` }}
              >
                {char === " " ? "\u00A0" : char}
              </span>
            ))}
        {stillTyping && <span className="typing-cursor">|</span>}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AnswerView — renders normal and blurred answers with confidence badge
// ---------------------------------------------------------------------------

import { useCallback, useState } from "react";
import type { AnswerResponse } from "@/api";
import { useTypewriter } from "@/hooks";
import type { SpeedMode } from "./SettingsPanel";
import type { ToneMode } from "./SettingsPanel";

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
  tone?: ToneMode;
}

export function AnswerView({ data, partialText, loading, speed = "normal", tone = "technical" }: AnswerViewProps) {
  const [copied, setCopied] = useState(false);
  const isKubica = speed === "kubica";
  const cfg = SPEED_CONFIG[speed];
  const { displayedText, isTyping } = useTypewriter(
    isKubica ? null : (data?.answer ?? null),
    { charsPerTick: cfg.charsPerTick, interval: cfg.interval },
  );

  const handleCopy = useCallback(() => {
    if (!data?.answer) return;
    navigator.clipboard.writeText(data.answer).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [data?.answer]);

  // Kubica mode: full text instantly, no typewriter
  const finalText = isKubica ? (data?.answer ?? "") : displayedText;
  const stillTyping = isKubica ? false : isTyping;

  if (loading && !partialText) {
    return (
      <div className={`answer-view answer-view--loading answer-view--${tone}`}>
        {tone === "friendly" ? "Hmm, let me think" : "Analysing data"}
        <span className="thinking-dots">
          <span className="thinking-dots__dot" />
          <span className="thinking-dots__dot" />
          <span className="thinking-dots__dot" />
        </span>
      </div>
    );
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
      className={`answer-view answer-view--${tone} ${data.blurred ? "answer-view--blurred" : ""}`}
    >
      {/* Tone badge */}
      <span className={`answer-view__tone-badge answer-view__tone-badge--${tone}`}>
        {tone === "technical" ? "🔬 Technical" : "💬 Friendly"}
      </span>

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

      {!stillTyping && data.answer && (
        <button
          className="answer-view__copy"
          onClick={handleCopy}
          title="Copy answer"
        >
          {copied ? "✓ Copied" : "📋 Copy"}
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// AnswerView — renders normal and blurred answers with confidence badge
// ---------------------------------------------------------------------------

import type { AnswerResponse } from "@/api";

interface AnswerViewProps {
  data: AnswerResponse | null;
  /** Partial streaming text (displayed while SSE is in progress). */
  partialText?: string;
  loading?: boolean;
}

export function AnswerView({ data, partialText, loading }: AnswerViewProps) {
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

  return (
    <div
      className={`answer-view ${data.blurred ? "answer-view--blurred" : ""}`}
    >
      {data.blurred && data.disclaimer && (
        <div className="answer-view__disclaimer" role="alert">
          {data.disclaimer}
        </div>
      )}

      <p className="answer-view__text">{data.answer}</p>

      <div className="answer-view__meta">
        <span>Confidence: {(data.confidence * 100).toFixed(0)}%</span>
        <span>Evidence: {data.evidence_count}</span>
        <span>Interviews: {data.distinct_interviews}</span>
      </div>
    </div>
  );
}

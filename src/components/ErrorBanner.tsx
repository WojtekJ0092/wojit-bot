// ---------------------------------------------------------------------------
// ErrorBanner — renders API errors following the standard error schema
// ---------------------------------------------------------------------------

interface ErrorBannerProps {
  message: string | null;
  code?: string | null;
  onDismiss?: () => void;
}

export function ErrorBanner({ message, code, onDismiss }: ErrorBannerProps) {
  if (!message) return null;

  // Provide guidance for specific error codes (§5 of the backend spec)
  let hint: string | null = null;
  if (code === "insufficient_evidence") {
    hint = "Try broadening your filters to include more data.";
  }

  return (
    <div className="error-banner" role="alert">
      <p className="error-banner__message">{message}</p>
      {hint && <p className="error-banner__hint">{hint}</p>}
      {onDismiss && (
        <button className="error-banner__close" onClick={onDismiss} aria-label="Dismiss">
          ×
        </button>
      )}
    </div>
  );
}

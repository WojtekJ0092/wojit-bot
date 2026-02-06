// ---------------------------------------------------------------------------
// ChatInput — query input with submit
// ---------------------------------------------------------------------------

import { type FormEvent, useState } from "react";

interface ChatInputProps {
  onSubmit: (query: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSubmit,
  disabled,
  placeholder = "Ask about student interviews…",
}: ChatInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  return (
    <form className="chat-input" onSubmit={handleSubmit}>
      <input
        className="chat-input__field"
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        aria-label="Type your question"
      />
      <button
        className="chat-input__submit"
        type="submit"
        disabled={disabled || !value.trim()}
      >
        Ask
      </button>
    </form>
  );
}

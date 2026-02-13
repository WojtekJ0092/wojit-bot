// ---------------------------------------------------------------------------
// useTypewriter — animates text appearing character-by-character
// ---------------------------------------------------------------------------

import { useEffect, useRef, useState } from "react";

interface UseTypewriterOptions {
  /** Characters per frame tick (default: 2) */
  charsPerTick?: number;
  /** Milliseconds between ticks (default: 20) */
  interval?: number;
}

interface UseTypewriterResult {
  /** The portion of text revealed so far */
  displayedText: string;
  /** Whether the animation is still in progress */
  isTyping: boolean;
}

export function useTypewriter(
  fullText: string | null,
  options: UseTypewriterOptions = {},
): UseTypewriterResult {
  const { charsPerTick = 2, interval = 20 } = options;
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const indexRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const textRef = useRef<string | null>(null);

  useEffect(() => {
    // If the source text changed, restart
    if (fullText !== textRef.current) {
      textRef.current = fullText;
      indexRef.current = 0;
      setDisplayedText("");

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (!fullText) {
        setIsTyping(false);
        return;
      }

      setIsTyping(true);

      timerRef.current = window.setInterval(() => {
        indexRef.current = Math.min(
          indexRef.current + charsPerTick,
          fullText.length,
        );
        setDisplayedText(fullText.slice(0, indexRef.current));

        if (indexRef.current >= fullText.length) {
          setIsTyping(false);
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
        }
      }, interval);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [fullText, charsPerTick, interval]);

  return { displayedText, isTyping };
}

// ---------------------------------------------------------------------------
// Debounce utility (used internally; hooks implement their own debounce too)
// ---------------------------------------------------------------------------

/**
 * Returns a debounced version of `fn` that delays invocation until
 * `ms` milliseconds have passed since the last call.
 */
export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  ms: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

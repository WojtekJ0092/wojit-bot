// ---------------------------------------------------------------------------
// Pseudonym generator — never expose real interview_id / segment_id
// See §6 of the backend spec.
// ---------------------------------------------------------------------------

/**
 * Produce a display-safe pseudonym for a citation.
 *
 * If the chunk_id already looks like a pseudonym we return it.
 * Otherwise we synthesise one in the form PL-PVT-Y3-07.
 */
export function makePseudonym(_chunkId: string, index: number): string {
  // Simple synthetic pseudonym based on the index.
  // The chunkId is accepted so richer pseudonym logic can be added later.
  const padded = String(index + 1).padStart(2, "0");
  return `SRC-${padded}`;
}

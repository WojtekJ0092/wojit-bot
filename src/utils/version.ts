// ---------------------------------------------------------------------------
// Version checker — warn users if the API contract has changed
// See §8 of the backend spec.
// ---------------------------------------------------------------------------

import { getLastVersionHeaders } from "@/api";
import type { VersionHeaders } from "@/api";

let _initial: VersionHeaders | null = null;

/**
 * Call after every API response to check if the schema has changed.
 * Returns true if the user should refresh the page.
 */
export function hasVersionDrifted(): boolean {
  const current = getLastVersionHeaders();
  if (!current) return false;

  if (!_initial) {
    _initial = { ...current };
    return false;
  }

  return (
    _initial.apiVersion !== current.apiVersion ||
    _initial.schemaHash !== current.schemaHash
  );
}

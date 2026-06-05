export interface SingerValidationError {
  /** Dot path to the offending value (e.g. "variants.0.id"). */
  path: string;
  /** Stable machine code; adapters map it to a message. */
  code: string;
  /** Extra context for formatting (index, id, tag, …). */
  params?: Record<string, unknown>;
}

export interface SingerValidationContext {
  existingIds?: Set<string>;
  tagWhitelist?: Set<string>;
}

/** Validate a (possibly partial) Singer. Empty array means valid. */
export function validateSinger(
  singer: unknown,
  ctx?: SingerValidationContext
): SingerValidationError[];

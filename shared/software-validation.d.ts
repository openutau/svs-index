export interface SoftwareValidationError {
  /** Dot path to the offending value (e.g. "versions.0.mirrors.0.hash"). */
  path: string;
  /** Stable machine code; adapters map it to a message. */
  code: string;
  /** Extra context for formatting (id, …). */
  params?: Record<string, unknown>;
}

export interface SoftwareValidationContext {
  existingIds?: Set<string>;
}

/** Validate a (possibly partial) Software entry. Empty array means valid. */
export function validateSoftware(
  software: unknown,
  ctx?: SoftwareValidationContext
): SoftwareValidationError[];

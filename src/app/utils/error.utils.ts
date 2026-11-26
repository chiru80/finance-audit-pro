/**
 * Extracts a human-readable error message from Error instances, Supabase PostgrestError
 * plain objects ({ message, details, hint, code }), or unknown thrown values.
 */
export function extractErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) {
    return err.message;
  }
  if (err && typeof err === 'object') {
    const e = err as { message?: string; details?: string; hint?: string; error_message?: string };
    const parts = [e.message || e.error_message, e.details, e.hint].filter(
      (part): part is string => typeof part === 'string' && part.trim().length > 0,
    );
    if (parts.length > 0) {
      return parts.join(' — ');
    }
  }
  if (typeof err === 'string' && err.trim().length > 0) {
    return err;
  }
  return fallback;
}

/**
 * Converts any thrown Supabase/unknown error into a standard Error instance
 * preserving PostgrestError message, details, and hint.
 */
export function toAppError(err: unknown, fallback: string): Error {
  if (err instanceof Error) return err;
  return new Error(extractErrorMessage(err, fallback));
}

/**
 * Extract a human-readable error message from an Axios API error.
 *
 * API error shape:
 *   { success: false, error: { detail: string, error_code: string, errors: [{loc, msg, ...}] } }
 *
 * Priority:
 *  1. Field-level validation messages from error.errors[].msg
 *  2. error.detail (when not the generic "Validation error" string)
 *  3. err.message (axios network error)
 *  4. Provided fallback
 */
export function getApiError(err: unknown, fallback = "An unexpected error occurred"): string {
  const apiErr = (err as any)?.response?.data?.error;

  if (apiErr) {
    const fieldErrors: any[] = apiErr.errors ?? [];
    if (fieldErrors.length > 0) {
      return fieldErrors
        .map((e: any) => {
          const field = Array.isArray(e.loc) ? e.loc[e.loc.length - 1] : null;
          const msg: string = e.msg ?? "";
          // Strip pydantic prefix like "value is not a valid email address: "
          const cleanMsg = msg.replace(/^value is not a valid \w+ address:\s*/i, "");
          return field && field !== "body" ? `${field}: ${cleanMsg}` : cleanMsg;
        })
        .join("; ");
    }

    const detail: string = apiErr.detail ?? "";
    if (detail && detail.toLowerCase() !== "validation error") {
      return detail;
    }
  }

  return (err as any)?.message ?? fallback;
}

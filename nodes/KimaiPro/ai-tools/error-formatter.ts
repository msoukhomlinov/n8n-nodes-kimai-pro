// nodes/KimaiPro/ai-tools/error-formatter.ts

export const ERROR_TYPES = {
    API_ERROR: 'API_ERROR',
    ENTITY_NOT_FOUND: 'ENTITY_NOT_FOUND',
    NO_RESULTS_FOUND: 'NO_RESULTS_FOUND',
    MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
    MISSING_ENTITY_ID: 'MISSING_ENTITY_ID',
    INVALID_OPERATION: 'INVALID_OPERATION',
    WRITE_OPERATION_BLOCKED: 'WRITE_OPERATION_BLOCKED',
    PERMISSION_DENIED: 'PERMISSION_DENIED',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    CONCURRENCY_CONFLICT: 'CONCURRENCY_CONFLICT',
    INVALID_PICKLIST_VALUE: 'INVALID_PICKLIST_VALUE',
    INVALID_FIELDS: 'INVALID_FIELDS',
    INVALID_WRITE_FIELDS: 'INVALID_WRITE_FIELDS',
    INVALID_FILTER_CONSTRAINT: 'INVALID_FILTER_CONSTRAINT',
    MISSING_REQUIRED_FIELDS: 'MISSING_REQUIRED_FIELDS',
    WRITE_RESOLUTION_INCOMPLETE: 'WRITE_RESOLUTION_INCOMPLETE',
    INVALID_INPUT: 'INVALID_INPUT',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    RATE_LIMITED: 'RATE_LIMITED',
} as const;

export interface FlatErrorResponse {
    nextAction: string;
    actionRequired?: boolean;
    error: true;
    errorType: string;
    resource: string;
    operation: string;
    summary: string;
    mustRetryAfter?: string[];
    retryAfterSeconds?: number;
    correlationId?: string;
}

// Error types where the two-channel actionable signal (flag + summary prefix) applies.
// Other types are informational only — the LLM can decide the next step from context.
const ACTIONABLE_PREFIX_TYPES = new Set<string>([
    ERROR_TYPES.INVALID_PICKLIST_VALUE,
    ERROR_TYPES.INVALID_FIELDS,
    ERROR_TYPES.INVALID_WRITE_FIELDS,
    ERROR_TYPES.MISSING_REQUIRED_FIELDS,
    ERROR_TYPES.ENTITY_NOT_FOUND,
    ERROR_TYPES.INVALID_FILTER_CONSTRAINT,
]);

/**
 * Build a flat error response. Context fields (filtersUsed, missingFields, etc.) are spread
 * at root level — no nesting under a generic `context` key.
 *
 * @warning contextFields keys must not collide with declared root fields (error, errorType,
 * resource, operation, summary, nextAction, correlationId). Colliding keys silently overwrite
 * the declared values at runtime.
 */
export function wrapError(
    resource: string,
    operation: string,
    errorType: string,
    summary: string,
    nextAction: string,
    contextFields?: Record<string, unknown>,
    mustRetryAfter?: string[],
): FlatErrorResponse {
    const isActionable = Boolean(nextAction) && ACTIONABLE_PREFIX_TYPES.has(errorType);
    const finalSummary = isActionable
        ? `REQUIRED NEXT STEP: ${nextAction} — ${summary}`
        : summary;

    return {
        nextAction,
        ...(isActionable ? { actionRequired: true } : {}),
        error: true,
        errorType,
        resource,
        operation: `${resource}.${operation}`,
        summary: finalSummary,
        ...(mustRetryAfter && mustRetryAfter.length > 0 ? { mustRetryAfter } : {}),
        ...(contextFields ?? {}),
    } as FlatErrorResponse;
}

// --- Thin wrappers (stable call-site signatures for the common error shapes) ---

export function formatIdError(resource: string, operation: string): FlatErrorResponse {
    return wrapError(
        resource, operation, ERROR_TYPES.MISSING_ENTITY_ID,
        `A numeric entity ID is required for ${resource}.${operation}.`,
        `Provide a numeric ID. If unknown, call kimaiPro_${resource} with operation 'getAll' and the 'search' or 'term' parameter to locate the correct record first.`,
    );
}

export function formatFilterConstraintError(
    resource: string,
    operation: string,
    message: string,
    nextAction: string,
): FlatErrorResponse {
    return wrapError(resource, operation, ERROR_TYPES.INVALID_FILTER_CONSTRAINT, message, nextAction);
}

export function formatRateLimitError(
    resource: string,
    operation: string,
    retryAfterSeconds?: number,
): FlatErrorResponse {
    // Sanitise: only propagate a finite positive integer; 0/negative/NaN would instruct "retry immediately"
    const safeSeconds = Number.isFinite(retryAfterSeconds) && (retryAfterSeconds as number) > 0
        ? retryAfterSeconds
        : undefined;
    const waitHint = safeSeconds !== undefined ? ` Retry after ${safeSeconds}s.` : '';
    const base = wrapError(
        resource, operation, ERROR_TYPES.RATE_LIMITED,
        `API rate limit hit.${waitHint}`,
        'Stop retrying. Tell the user the rate limit has been reached. Ask them to reduce workflow frequency or wait before retrying.',
    );
    return safeSeconds !== undefined ? { ...base, retryAfterSeconds: safeSeconds } : base;
}

export function formatApiError(
    message: string,
    resource: string,
    operation: string,
): FlatErrorResponse {
    const lower = message.toLowerCase();

    if (lower.includes('rate limit') || lower.includes('too many requests')) {
        // Only extract retry hint from genuine "retry after N seconds" phrasing.
        const secondsMatch = message.match(/retry.{1,20}?(\d+)\s*s(?:ec|econds?)?/i);
        return formatRateLimitError(resource, operation, secondsMatch ? Number.parseInt(secondsMatch[1], 10) : undefined);
    }
    if (lower.includes('lock') || lower.includes('concurrent') || lower.includes('deadlock')) {
        return wrapError(resource, operation, ERROR_TYPES.CONCURRENCY_CONFLICT, message,
            'Retry with a short backoff and serialise requests for this resource to reduce lock contention.');
    }
    if (lower.includes('forbidden') || lower.includes('unauthor') || lower.includes('permission') || lower.includes('access denied')) {
        return wrapError(resource, operation, ERROR_TYPES.PERMISSION_DENIED, message,
            'Verify API credentials and permissions, then retry.');
    }
    if (lower.includes('picklist') || lower.includes('invalid value')) {
        return wrapError(resource, operation, ERROR_TYPES.INVALID_PICKLIST_VALUE, message,
            `Call kimaiPro_${resource} with operation 'getAll' to find valid values, then retry with a valid value.`);
    }
    if (lower.includes('required') || lower.includes('missing') || lower.includes('blank')) {
        return wrapError(resource, operation, ERROR_TYPES.MISSING_REQUIRED_FIELDS, message,
            'Check the field values and ensure all required fields are provided, then retry.');
    }
    if (lower.includes('not found') || lower.includes('does not exist') || lower.includes('404')) {
        return wrapError(resource, operation, ERROR_TYPES.ENTITY_NOT_FOUND, message,
            `Call kimaiPro_${resource} with operation 'getAll' and the 'term' parameter to find the record by text, then retry with the numeric ID.`);
    }
    if (lower.includes('validation') || lower.includes('invalid') || lower.includes('unprocessable')) {
        return wrapError(resource, operation, ERROR_TYPES.VALIDATION_ERROR, message,
            'Check the field values and types, then retry with corrected parameters.');
    }

    return wrapError(resource, operation, ERROR_TYPES.API_ERROR, message,
        'Verify parameter names and values, then retry.');
}

export function formatNotFoundError(resource: string, operation: string, id: number | string): FlatErrorResponse {
    return wrapError(
        resource, operation, ERROR_TYPES.ENTITY_NOT_FOUND,
        `No ${resource} record found with ID ${id}.`,
        `If the user supplied this ID explicitly, report that no record exists with that ID. Only call getAll if you have other identifying attributes (name, date range, etc.) to search on.`,
    );
}

export function formatNoResultsFound(
    resource: string,
    operation: string,
    filtersUsed: Record<string, unknown>,
): FlatErrorResponse {
    return wrapError(
        resource, operation, ERROR_TYPES.NO_RESULTS_FOUND,
        `No ${resource} records matched the provided filters.`,
        `Broaden or change filter parameters and retry. Use kimaiPro_${resource} with operation 'getAll'.`,
        { filtersUsed },
    );
}

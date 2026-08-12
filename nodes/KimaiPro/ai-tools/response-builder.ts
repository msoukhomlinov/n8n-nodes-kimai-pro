// nodes/KimaiPro/ai-tools/response-builder.ts

export interface ToolResponseContext {
    resolutions?: LabelResolution[];
    resolutionWarnings?: string[];
    pendingConfirmations?: PendingLabelConfirmation[];
    [key: string]: unknown;
}

export interface LabelResolution {
    field: string;
    from: string | number;
    to: string | number;
    method: 'picklist' | 'reference';
}

export interface PendingLabelConfirmation {
    field: string;
    label: string;
    candidates: Array<{ id: string | number; displayName: string }>;
    fieldType: 'picklist' | 'reference';
}

export interface ResolvedLabel {
    field: string;
    from: string | number;
    to: string | number;
}

export function toResolvedLabels(resolutions?: LabelResolution[]): ResolvedLabel[] {
    return (resolutions ?? []).map(({ field, from, to }) => ({ field, from, to }));
}

export function attachCorrelation(json: string, id: string | undefined): string {
    if (!id) return json;
    try {
        const parsed = JSON.parse(json) as Record<string, unknown>;
        return JSON.stringify({ correlationId: id, ...parsed });
    } catch {
        return json;
    }
}

// --- List pagination / continuation ---

export interface ListPaginationState {
    hasMore: boolean;
    nextOffset?: number;
    totalAvailable?: number;
    notes?: string[];
    continuation?: ListContinuationPointer | null;
    isTruncated?: boolean;
    truncationReason?: string;
    serverCap: number;
    clientCap: number;
}

export interface ListContinuationPointer {
    hasMore: boolean;
    nextOffset?: number;
}

/** Decide hasMore/nextOffset/truncationReason for a getAll-style list response. */
export function computeListContinuation(
    recordsReturned: number,
    requestedLimit: number,
    maxQueryLimit: number = 1000,
    serverCap: number = 100,
    clientCap: number = 100,
): { continuation: ListContinuationPointer | null; isTruncated: boolean; truncationReason?: string } {
    const isTruncated = recordsReturned >= requestedLimit;
    let continuation: ListContinuationPointer | null = null;
    let truncationReason: string | undefined;

    if (isTruncated) {
        truncationReason = `Results capped at ${requestedLimit}. Use filters to narrow or increase 'limit' (max 100).`;
    }

    return { continuation, isTruncated, truncationReason };
}

// --- Identity string (internal) ---
function buildIdentityString(entity: Record<string, unknown>): string {
    const nameField = Object.entries(entity).find(
        ([k, v]) => /Name$|Title$|Subject$|username/i.test(k) && typeof v === 'string' && v.trim() !== '',
    );
    const id = entity.id;
    if (nameField && id !== undefined) return `${nameField[1]} (ID: ${id})`;
    if (nameField) return String(nameField[1]);
    if (id !== undefined) return `(ID: ${id})`;
    return '';
}

// --- Flat success response builders ---

export function buildListResponse(
    resource: string,
    operation: string,
    records: Record<string, unknown>[],
    pagination?: Partial<ListPaginationState>,
    context: ToolResponseContext = {},
): Record<string, unknown> {
    const count = records.length;
    const hasMore = pagination?.hasMore ?? false;
    const isTruncated = pagination?.isTruncated ?? false;
    const totalKnown = pagination?.totalAvailable !== undefined;
    const total = totalKnown ? (pagination?.totalAvailable as number) : count;
    const isIncomplete = hasMore || (totalKnown ? total > count : isTruncated);
    const completenessVerdict: 'complete' | 'incomplete' = isIncomplete ? 'incomplete' : 'complete';

    const summary = isIncomplete
        ? `Found ${count}${totalKnown ? ` of ${total}` : ''} ${resource} records — more available. ${
            pagination?.nextOffset !== undefined ? `Use nextOffset: ${pagination.nextOffset} or narrower filters.` : 'Narrow filters to see the rest.'
          }`
        : `Found ${count} ${resource} records — complete set, no further calls needed.`;

    const response: Record<string, unknown> = {
        summary,
        resource,
        operation: `${resource}.${operation}`,
        records,
        returnedCount: count,
        hasMore,
        continuation: pagination?.continuation ?? null,
        isTruncated,
        completenessVerdict,
        truncationReason: pagination?.truncationReason ?? null,
        serverCap: pagination?.serverCap ?? 100,
        clientCap: pagination?.clientCap ?? 100,
        resolvedLabels: toResolvedLabels(context.resolutions),
        pendingConfirmations: context.pendingConfirmations ?? [],
        warnings: context.resolutionWarnings ?? [],
    };
    if (pagination?.nextOffset !== undefined && completenessVerdict === 'incomplete') {
        response.nextOffset = pagination.nextOffset;
    }
    if (totalKnown) response.totalAvailable = pagination?.totalAvailable;
    if (pagination?.notes?.length) response.notes = pagination.notes;
    return response;
}

/** Flat response for single-record reads: get and similar. */
export function buildItemResponse(
    resource: string,
    operation: string,
    record: Record<string, unknown>,
    options: { verb?: string } = {},
    context: ToolResponseContext = {},
): Record<string, unknown> {
    const verb = options.verb ?? 'Retrieved';
    const identity = buildIdentityString(record);
    return {
        summary: identity ? `${verb} ${resource} ${identity}.` : `${verb} ${resource} (ID: ${record.id ?? 'unknown'}).`,
        resource,
        operation: `${resource}.${operation}`,
        record,
        resolvedLabels: toResolvedLabels(context.resolutions),
        pendingConfirmations: context.pendingConfirmations ?? [],
        warnings: context.resolutionWarnings ?? [],
    };
}

/** Flat response for create / update (and similar single-entity mutations). */
export function buildMutationResponse(
    resource: string,
    operation: string,
    id: number | string,
    record?: Record<string, unknown>,
    context: ToolResponseContext = {},
): Record<string, unknown> {
    const opVerb = operation === 'create' ? 'Created' : operation === 'update' ? 'Updated' : `${operation.charAt(0).toUpperCase()}${operation.slice(1)}d`;
    const identity = record ? buildIdentityString(record) : '';
    const response: Record<string, unknown> = {
        summary: identity ? `${opVerb} ${resource} ${identity} successfully.` : `${opVerb} ${resource} (ID: ${id}) successfully.`,
        resource,
        operation: `${resource}.${operation}`,
        id,
        resolvedLabels: toResolvedLabels(context.resolutions),
        pendingConfirmations: context.pendingConfirmations ?? [],
        warnings: context.resolutionWarnings ?? [],
    };
    if (record) response.record = record;
    return response;
}

/** Flat response for delete (no entity returned). */
export function buildDeleteResponse(
    resource: string,
    operation: string,
    id: number | string,
    context: ToolResponseContext = {},
): Record<string, unknown> {
    return {
        summary: `Deleted ${resource} (ID: ${id}) successfully.`,
        resource,
        operation: `${resource}.${operation}`,
        id,
        resolvedLabels: toResolvedLabels(context.resolutions),
        pendingConfirmations: context.pendingConfirmations ?? [],
        warnings: context.resolutionWarnings ?? [],
    };
}

/** Flat response for a bare count operation. */
export function buildCountResponse(
    resource: string,
    operation: string,
    matchCount: number,
): Record<string, unknown> {
    return {
        summary: `${matchCount} ${resource} records match the filter.`,
        resource,
        operation: `${resource}.${operation}`,
        matchCount,
        warnings: [],
    };
}

/** Flat response for compound operations. */
export function buildCompoundResponse(
    resource: string,
    operation: string,
    compoundData: {
        outcome: string;
        id?: number | string;
        record?: Record<string, unknown>;
    },
    context: ToolResponseContext = {},
): Record<string, unknown> {
    const { outcome, id, record } = compoundData;
    const canonicalId = id;
    let summary: string;
    if (outcome === 'created') {
        summary = `${resource} created (ID: ${canonicalId}).`;
    } else if (outcome === 'skipped') {
        summary = `${resource} already exists (skipped). Existing ID: ${canonicalId}.`;
    } else if (outcome === 'updated') {
        summary = `${resource} updated (ID: ${canonicalId}).`;
    } else {
        summary = `${resource} outcome: ${outcome}${canonicalId !== undefined ? ` (ID: ${canonicalId})` : ''}.`;
    }
    const response: Record<string, unknown> = {
        summary,
        resource,
        operation: `${resource}.${operation}`,
        outcome,
        resolvedLabels: toResolvedLabels(context.resolutions),
        pendingConfirmations: context.pendingConfirmations ?? [],
        warnings: context.resolutionWarnings ?? [],
    };
    if (canonicalId !== undefined) response.id = canonicalId;
    if (record) response.record = record;
    return response;
}

/** Flat response for binary download operations (e.g., invoice PDF). */
export function buildDownloadResponse(
    resource: string,
    operation: string,
    id: number | string,
    filename: string,
): Record<string, unknown> {
    return {
        summary: `Downloaded ${resource} PDF (ID: ${id}) as "${filename}".`,
        resource,
        operation: `${resource}.${operation}`,
        id,
        filename,
        warnings: [],
    };
}

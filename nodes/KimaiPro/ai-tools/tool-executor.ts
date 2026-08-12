// nodes/KimaiPro/ai-tools/tool-executor.ts
import type { IExecuteFunctions } from 'n8n-workflow';
import { wrapError, ERROR_TYPES, formatIdError, formatNotFoundError, formatNoResultsFound, formatApiError } from './error-formatter';
import { buildListResponse, buildItemResponse, buildMutationResponse, buildDeleteResponse, buildDownloadResponse } from './response-builder';
import { RESOURCE_OPS } from './schema-generator';
import { KimaiSdk } from '../sdk-wrapper';

// Sole owning location for the framework-metadata field set
export const N8N_METADATA_FIELDS = new Set([
    'sessionId', 'action', 'chatInput', 'root', 'tool', 'toolName', 'toolCallId', 'operation',
]);

export const N8N_METADATA_PREFIXES = ['Prompt__'];

const NUMERIC_FIELDS = new Set<string>(['id', 'rateId', 'commentId', 'tokenId', 'userId',
    'customerId', 'projectId', 'activityId', 'page', 'size', 'limit']);

// Write operations classification
export const WRITE_OPERATIONS = new Set([
    'create', 'update', 'updateMeta', 'addRate', 'deleteRate', 'addComment', 'deleteComment',
    'togglePin', 'addTeam', 'stop', 'restart', 'duplicate', 'toggleExport',
    'updatePreferences', 'deleteApiToken', 'addMember', 'removeMember',
    'grantCustomer', 'revokeCustomer', 'grantProject', 'revokeProject',
    'grantActivity', 'revokeActivity', 'updateCustomFields', 'addToApprove',
]);

export const DESTRUCTIVE_OPERATIONS = new Set([
    'activity.delete', 'activity.deleteRate',
    'customer.delete', 'customer.deleteRate', 'customer.deleteComment',
    'project.delete', 'project.deleteRate', 'project.deleteComment',
    'timesheet.delete',
    'user.deleteApiToken',
    'tag.delete',
    'team.delete', 'team.removeMember', 'team.revokeCustomer', 'team.revokeProject', 'team.revokeActivity',
]);

// Enrichment cache for batch lookups
interface EnrichmentCache {
    customers: Map<number, Record<string, unknown>>;
    projects: Map<number, Record<string, unknown>>;
    activities: Map<number, Record<string, unknown>>;
    users: Map<number, Record<string, unknown>>;
    tags: Map<number, Record<string, unknown>>;
}

// Create SDK from credentials
async function createSdk(context: IExecuteFunctions): Promise<KimaiSdk> {
    const credentials = await context.getCredentials('kimaiProApi') as { apiUrl: string; apiToken: string };
    return new KimaiSdk({
        apiUrl: credentials.apiUrl as string,
        apiToken: credentials.apiToken as string,
    });
}

// Parse ID safely
function parseId(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
        const num = Number(value);
        if (Number.isFinite(num) && num > 0) return num;
    }
    return null;
}

// Build enrichment cache from SDK
async function buildEnrichmentCache(sdk: KimaiSdk): Promise<EnrichmentCache> {
    const cache: EnrichmentCache = {
        customers: new Map(),
        projects: new Map(),
        activities: new Map(),
        users: new Map(),
        tags: new Map(),
    };

    try {
        const [customers, projects, activities, users, tags] = await Promise.all([
            sdk.customersList({}).catch(() => []),
            sdk.projectsList({}).catch(() => []),
            sdk.activitiesList({}).catch(() => []),
            sdk.usersList({}).catch(() => []),
            sdk.tagsList({}).catch(() => []),
        ]);

        for (const c of customers as Record<string, unknown>[]) cache.customers.set(c.id as number, c);
        for (const p of projects as Record<string, unknown>[]) cache.projects.set(p.id as number, p);
        for (const a of activities as Record<string, unknown>[]) cache.activities.set(a.id as number, a);
        for (const u of users as Record<string, unknown>[]) cache.users.set(u.id as number, u);
        for (const t of tags as Record<string, unknown>[]) cache.tags.set(t.id as number, t);
    } catch {
        // Graceful degradation - cache stays empty
    }

    return cache;
}

// Helper: safely extract numeric ID from various input shapes
function extractId(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'object' && value !== null && 'id' in value) {
        const id = (value as Record<string, unknown>).id;
        if (typeof id === 'number' && Number.isFinite(id)) return id;
    }
    return null;
}

// Enrich a single record with related names
function enrichRecord(record: Record<string, unknown>, cache: EnrichmentCache): Record<string, unknown> {
    if (!record || typeof record !== 'object') return record;
    const enriched = { ...record };

    // Enrich customer reference
    const custId = extractId(enriched.customer);
    if (custId !== null) {
        const cust = cache.customers.get(custId);
        if (cust) enriched.customerName = cust.name;
    }

    // Enrich project reference
    const projId = extractId(enriched.project);
    if (projId !== null) {
        const proj = cache.projects.get(projId);
        if (proj) {
            enriched.projectName = proj.name;
            const projCustId = extractId(proj.customer);
            if (projCustId !== null) {
                const cust = cache.customers.get(projCustId);
                if (cust) enriched.customerName = cust.name;
            }
        }
    }

    // Enrich activity reference
    const actId = extractId(enriched.activity);
    if (actId !== null) {
        const act = cache.activities.get(actId);
        if (act) {
            enriched.activityName = act.name;
            const actProjId = extractId(act.project);
            if (actProjId !== null) {
                const proj = cache.projects.get(actProjId);
                if (proj) enriched.projectName = proj.name;
            }
        }
    }

    // Enrich user reference
    const userId = extractId(enriched.user);
    if (userId !== null) {
        const usr = cache.users.get(userId);
        if (usr) enriched.userName = usr.username;
    }

    // Enrich supervisor reference
    const supId = extractId(enriched.supervisor);
    if (supId !== null) {
        const sup = cache.users.get(supId);
        if (sup) enriched.supervisorName = sup.username;
    }

    // Enrich tags array
    if (Array.isArray(enriched.tags)) {
        enriched.tags = enriched.tags.map((tag: unknown) => {
            if (typeof tag === 'object' && tag !== null) {
                const tagId = extractId(tag);
                if (tagId !== null) {
                    const cachedTag = cache.tags.get(tagId);
                    if (cachedTag) return { ...(tag as Record<string, unknown>), name: cachedTag.name };
                }
            }
            return tag;
        });
    }

    // Enrich team members
    if (Array.isArray(enriched.members)) {
        enriched.members = enriched.members.map((member: unknown) => {
            if (typeof member === 'object' && member !== null && 'user' in member) {
                const memberId = extractId((member as Record<string, unknown>).user);
                if (memberId !== null) {
                    const usr = cache.users.get(memberId);
                    if (usr) {
                        return { ...(member as Record<string, unknown>), userName: usr.username };
                    }
                }
            }
            return member;
        });
    }

    return enriched;
}

// Enrich an array of records
function enrichRecords(records: Record<string, unknown>[], cache: EnrichmentCache): Record<string, unknown>[] {
    return records.map(r => enrichRecord(r, cache));
}

// Strip metadata and normalise params
function cleanParams(rawParams: Record<string, unknown>): Record<string, unknown> {
    const params: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(rawParams)) {
        if (N8N_METADATA_FIELDS.has(key)) continue;
        if (N8N_METADATA_PREFIXES.some((p) => key.startsWith(p))) continue;
        params[key] = value;
    }

    // Normalise explicit null → undefined
    for (const key of Object.keys(params)) {
        if (params[key] === null) params[key] = undefined;
    }

    // Coerce numeric strings to numbers
    for (const key of NUMERIC_FIELDS) {
        if (key in params && typeof params[key] === 'string' && /^\d+$/.test(params[key] as string)) {
            params[key] = parseInt(params[key] as string, 10);
        }
    }

    return params;
}

export interface ToolExecutionMetadata {
    allAllowedOps?: string[];
    allowWrites?: boolean;
}

export async function executeAiTool(
    context: IExecuteFunctions,
    resource: string,
    operation: string,
    rawParams: Record<string, unknown>,
    metadata: ToolExecutionMetadata = {},
): Promise<string> {
    const params = cleanParams(rawParams);
    const sdk = await createSdk(context);
    const cache = await buildEnrichmentCache(sdk);

    try {
        // Activity operations
        if (resource === 'activity') {
            switch (operation) {
                case 'getAll': {
                    const records = await sdk.activitiesList(params);
                    return JSON.stringify(buildListResponse(resource, operation, enrichRecords(records, cache)));
                }
                case 'get': {
                    const id = parseId(params.id);
                    if (!id) return JSON.stringify(formatIdError(resource, operation));
                    const result = await sdk.activitiesGetById(id);
                    if (!result) return JSON.stringify(formatNotFoundError(resource, operation, id));
                    return JSON.stringify(buildItemResponse(resource, operation, enrichRecord(result, cache)));
                }
                case 'create': {
                    const body: Record<string, any> = {};
                    for (const field of ['name', 'project', 'number', 'comment', 'visible', 'billable',
                        'color', 'invoiceText', 'budget', 'timeBudget', 'budgetType', 'teams']) {
                        if (params[field] !== undefined && params[field] !== '') body[field] = params[field];
                    }
                    const result = await sdk.activitiesCreate(body);
                    return JSON.stringify(buildMutationResponse(resource, operation, result.id, enrichRecord(result, cache)));
                }
                case 'update': {
                    const id = parseId(params.id);
                    if (!id) return JSON.stringify(formatIdError(resource, operation));
                    const body: Record<string, any> = {};
                    for (const field of ['name', 'project', 'number', 'comment', 'visible', 'billable',
                        'color', 'invoiceText', 'budget', 'timeBudget', 'budgetType', 'teams']) {
                        if (params[field] !== undefined && params[field] !== '') body[field] = params[field];
                    }
                    const result = await sdk.activitiesUpdate(id, body);
                    return JSON.stringify(buildMutationResponse(resource, operation, id, enrichRecord(result, cache)));
                }
                case 'delete': {
                    const id = parseId(params.id);
                    if (!id) return JSON.stringify(formatIdError(resource, operation));
                    await sdk.activitiesDelete(id);
                    return JSON.stringify(buildDeleteResponse(resource, operation, id));
                }
                case 'updateMeta': {
                    const id = parseId(params.id);
                    if (!id) return JSON.stringify(formatIdError(resource, operation));
                    const meta: Record<string, any> = {};
                    meta[params.metaName as string] = params.metaValue;
                    const result = await sdk.activitiesUpdateMeta(id, meta);
                    return JSON.stringify(buildMutationResponse(resource, operation, id, enrichRecord(result, cache)));
                }
                case 'getRates': {
                    const id = parseId(params.id);
                    if (!id) return JSON.stringify(formatIdError(resource, operation));
                    const records = await sdk.activitiesGetRates(id);
                    return JSON.stringify(buildListResponse(resource, operation, records));
                }
                case 'addRate': {
                    const id = parseId(params.id);
                    if (!id) return JSON.stringify(formatIdError(resource, operation));
                    const body: Record<string, any> = {};
                    if (params.rateUser !== undefined) body.user = params.rateUser;
                    if (params.rate !== undefined) body.rate = params.rate;
                    if (params.internalRate !== undefined) body.internalRate = params.internalRate;
                    if (params.isFixed !== undefined) body.isFixed = params.isFixed;
                    const result = await sdk.activitiesCreateRate(id, body);
                    return JSON.stringify(buildMutationResponse(resource, operation, result.id, result));
                }
                case 'deleteRate': {
                    const id = parseId(params.id);
                    const rateId = parseId(params.rateId);
                    if (!id || !rateId) return JSON.stringify(formatIdError(resource, operation));
                    await sdk.activitiesDeleteRate(id, rateId);
                    return JSON.stringify(buildDeleteResponse(resource, operation, `${id}-${rateId}`));
                }
                case 'addTeam': {
                    const id = parseId(params.id);
                    if (!id) return JSON.stringify(formatIdError(resource, operation));
                    const result = await sdk.activitiesAddToTeam(id);
                    return JSON.stringify(buildMutationResponse(resource, operation, id, enrichRecord(result, cache)));
                }
                default:
                    return JSON.stringify(wrapError(resource, operation, ERROR_TYPES.INVALID_OPERATION,
                        'Unsupported operation.', 'Use a valid activity operation.'));
            }
        }

        // Customer operations
        if (resource === 'customer') {
            switch (operation) {
                case 'getAll': {
                    const records = await sdk.customersList(params);
                    return JSON.stringify(buildListResponse(resource, operation, enrichRecords(records, cache)));
                }
                case 'get': {
                    const id = parseId(params.id);
                    if (!id) return JSON.stringify(formatIdError(resource, operation));
                    const result = await sdk.customersGetById(id);
                    if (!result) return JSON.stringify(formatNotFoundError(resource, operation, id));
                    return JSON.stringify(buildItemResponse(resource, operation, enrichRecord(result, cache)));
                }
                case 'create': {
                    const body: Record<string, any> = {};
                    for (const field of ['name', 'number', 'comment', 'company', 'vatId', 'contact',
                        'addressLine1', 'addressLine2', 'addressLine3', 'postcode', 'city', 'country',
                        'currency', 'phone', 'fax', 'mobile', 'email', 'homepage', 'timezone', 'language',
                        'invoiceText', 'invoiceTemplate', 'buyerReference', 'color', 'invoiceEmail',
                        'budget', 'timeBudget', 'budgetType', 'visible', 'billable']) {
                        if (params[field] !== undefined && params[field] !== '') body[field] = params[field];
                    }
                    if (params.customerTeams !== undefined) body.teams = params.customerTeams;
                    const result = await sdk.customersCreate(body);
                    return JSON.stringify(buildMutationResponse(resource, operation, result.id, enrichRecord(result, cache)));
                }
                case 'update': {
                    const id = parseId(params.id);
                    if (!id) return JSON.stringify(formatIdError(resource, operation));
                    const body: Record<string, any> = {};
                    for (const field of ['name', 'number', 'comment', 'company', 'vatId', 'contact',
                        'addressLine1', 'addressLine2', 'addressLine3', 'postcode', 'city', 'country',
                        'currency', 'phone', 'fax', 'mobile', 'email', 'homepage', 'timezone', 'language',
                        'invoiceText', 'invoiceTemplate', 'buyerReference', 'color', 'invoiceEmail',
                        'budget', 'timeBudget', 'budgetType', 'visible', 'billable']) {
                        if (params[field] !== undefined && params[field] !== '') body[field] = params[field];
                    }
                    if (params.customerTeams !== undefined) body.teams = params.customerTeams;
                    const result = await sdk.customersUpdate(id, body);
                    return JSON.stringify(buildMutationResponse(resource, operation, id, enrichRecord(result, cache)));
                }
                case 'delete': {
                    const id = parseId(params.id);
                    if (!id) return JSON.stringify(formatIdError(resource, operation));
                    await sdk.customersDelete(id);
                    return JSON.stringify(buildDeleteResponse(resource, operation, id));
                }
                case 'updateMeta': {
                    const id = parseId(params.id);
                    if (!id) return JSON.stringify(formatIdError(resource, operation));
                    const meta: Record<string, any> = {};
                    meta[params.metaName as string] = params.metaValue;
                    const result = await sdk.customersUpdateMeta(id, meta);
                    return JSON.stringify(buildMutationResponse(resource, operation, id, enrichRecord(result, cache)));
                }
                case 'getRates': {
                    const id = parseId(params.id);
                    if (!id) return JSON.stringify(formatIdError(resource, operation));
                    const records = await sdk.customersGetRates(id);
                    return JSON.stringify(buildListResponse(resource, operation, records));
                }
                case 'addRate': {
                    const id = parseId(params.id);
                    if (!id) return JSON.stringify(formatIdError(resource, operation));
                    const body: Record<string, any> = {};
                    if (params.rateUser !== undefined) body.user = params.rateUser;
                    if (params.rate !== undefined) body.rate = params.rate;
                    if (params.internalRate !== undefined) body.internalRate = params.internalRate;
                    if (params.isFixed !== undefined) body.isFixed = params.isFixed;
                    const result = await sdk.customersCreateRate(id, body);
                    return JSON.stringify(buildMutationResponse(resource, operation, result.id, result));
                }
                case 'deleteRate': {
                    const id = parseId(params.id);
                    const rateId = parseId(params.rateId);
                    if (!id || !rateId) return JSON.stringify(formatIdError(resource, operation));
                    await sdk.customersDeleteRate(id, rateId);
                    return JSON.stringify(buildDeleteResponse(resource, operation, `${id}-${rateId}`));
                }
                case 'getComments': {
                    const id = parseId(params.id);
                    if (!id) return JSON.stringify(formatIdError(resource, operation));
                    const records = await sdk.customersListComments(id);
                    return JSON.stringify(buildListResponse(resource, operation, records));
                }
                case 'addComment': {
                    const id = parseId(params.id);
                    if (!id) return JSON.stringify(formatIdError(resource, operation));
                    const result = await sdk.customersCreateComment(id, { message: params.commentText });
                    return JSON.stringify(buildMutationResponse(resource, operation, result.id, result));
                }
                case 'deleteComment': {
                    const id = parseId(params.id);
                    const commentId = parseId(params.commentId);
                    if (!id || !commentId) return JSON.stringify(formatIdError(resource, operation));
                    await sdk.customersDeleteComment(id, commentId);
                    return JSON.stringify(buildDeleteResponse(resource, operation, `${id}-${commentId}`));
                }
                case 'togglePin': {
                    const id = parseId(params.id);
                    const commentId = parseId(params.commentId);
                    if (!id || !commentId) return JSON.stringify(formatIdError(resource, operation));
                    const result = await sdk.customersPinComment(id, commentId);
                    return JSON.stringify(buildMutationResponse(resource, operation, id, result));
                }
                case 'addTeam': {
                    const id = parseId(params.id);
                    if (!id) return JSON.stringify(formatIdError(resource, operation));
                    const result = await sdk.customersAddToTeam(id);
                    return JSON.stringify(buildMutationResponse(resource, operation, id, enrichRecord(result, cache)));
                }
                default:
                    return JSON.stringify(wrapError(resource, operation, ERROR_TYPES.INVALID_OPERATION,
                        'Unsupported operation.', 'Use a valid customer operation.'));
            }
        }

        // Project operations
        if (resource === 'project') {
            switch (operation) {
                case 'getAll': {
                    const records = await sdk.projectsList(params);
                    return JSON.stringify(buildListResponse(resource, operation, enrichRecords(records, cache)));
                }
                case 'get': {
                    const id = parseId(params.id);
                    if (!id) return JSON.stringify(formatIdError(resource, operation));
                    const result = await sdk.projectsGetById(id);
                    if (!result) return JSON.stringify(formatNotFoundError(resource, operation, id));
                    return JSON.stringify(buildItemResponse(resource, operation, enrichRecord(result, cache)));
                }
                case 'create': {
                    const body: Record<string, any> = {};
                    for (const field of ['name', 'customer', 'number', 'comment', 'invoiceText',
                        'orderNumber', 'orderDate', 'start', 'end', 'color', 'budget', 'timeBudget',
                        'budgetType', 'globalActivities', 'visible', 'billable']) {
                        if (params[field] !== undefined && params[field] !== '') body[field] = params[field];
                    }
                    if (params.projectTeams !== undefined) body.teams = params.projectTeams;
                    const result = await sdk.projectsCreate(body);
                    return JSON.stringify(buildMutationResponse(resource, operation, result.id, enrichRecord(result, cache)));
                }
                case 'update': {
                    const id = parseId(params.id);
                    if (!id) return JSON.stringify(formatIdError(resource, operation));
                    const body: Record<string, any> = {};
                    for (const field of ['name', 'customer', 'number', 'comment', 'invoiceText',
                        'orderNumber', 'orderDate', 'start', 'end', 'color', 'budget', 'timeBudget',
                        'budgetType', 'globalActivities', 'visible', 'billable']) {
                        if (params[field] !== undefined && params[field] !== '') body[field] = params[field];
                    }
                    if (params.projectTeams !== undefined) body.teams = params.projectTeams;
                    const result = await sdk.projectsUpdate(id, body);
                    return JSON.stringify(buildMutationResponse(resource, operation, id, enrichRecord(result, cache)));
                }
                case 'delete': {
                    const id = parseId(params.id);
                    if (!id) return JSON.stringify(formatIdError(resource, operation));
                    await sdk.projectsDelete(id);
                    return JSON.stringify(buildDeleteResponse(resource, operation, id));
                }
                case 'updateMeta': {
                    const id = parseId(params.id);
                    if (!id) return JSON.stringify(formatIdError(resource, operation));
                    const meta: Record<string, any> = {};
                    meta[params.metaName as string] = params.metaValue;
                    const result = await sdk.projectsUpdateMeta(id, meta);
                    return JSON.stringify(buildMutationResponse(resource, operation, id, enrichRecord(result, cache)));
                }
                case 'getRates': {
                    const id = parseId(params.id);
                    if (!id) return JSON.stringify(formatIdError(resource, operation));
                    const records = await sdk.projectsGetRates(id);
                    return JSON.stringify(buildListResponse(resource, operation, records));
                }
                case 'addRate': {
                    const id = parseId(params.id);
                    if (!id) return JSON.stringify(formatIdError(resource, operation));
                    const body: Record<string, any> = {};
                    if (params.rateUser !== undefined) body.user = params.rateUser;
                    if (params.rate !== undefined) body.rate = params.rate;
                    if (params.internalRate !== undefined) body.internalRate = params.internalRate;
                    if (params.isFixed !== undefined) body.isFixed = params.isFixed;
                    const result = await sdk.projectsCreateRate(id, body);
                    return JSON.stringify(buildMutationResponse(resource, operation, result.id, result));
                }
                case 'deleteRate': {
                    const id = parseId(params.id);
                    const rateId = parseId(params.rateId);
                    if (!id || !rateId) return JSON.stringify(formatIdError(resource, operation));
                    await sdk.projectsDeleteRate(id, rateId);
                    return JSON.stringify(buildDeleteResponse(resource, operation, `${id}-${rateId}`));
                }
                case 'getComments': {
                    const id = parseId(params.id);
                    if (!id) return JSON.stringify(formatIdError(resource, operation));
                    const records = await sdk.projectsListComments(id);
                    return JSON.stringify(buildListResponse(resource, operation, records));
                }
                case 'addComment': {
                    const id = parseId(params.id);
                    if (!id) return JSON.stringify(formatIdError(resource, operation));
                    const result = await sdk.projectsCreateComment(id, { message: params.commentText });
                    return JSON.stringify(buildMutationResponse(resource, operation, result.id, result));
                }
                case 'deleteComment': {
                    const id = parseId(params.id);
                    const commentId = parseId(params.commentId);
                    if (!id || !commentId) return JSON.stringify(formatIdError(resource, operation));
                    await sdk.projectsDeleteComment(id, commentId);
                    return JSON.stringify(buildDeleteResponse(resource, operation, `${id}-${commentId}`));
                }
                case 'togglePin': {
                    const id = parseId(params.id);
                    const commentId = parseId(params.commentId);
                    if (!id || !commentId) return JSON.stringify(formatIdError(resource, operation));
                    const result = await sdk.projectsPinComment(id, commentId);
                    return JSON.stringify(buildMutationResponse(resource, operation, id, result));
                }
                case 'addTeam': {
                    const id = parseId(params.id);
                    if (!id) return JSON.stringify(formatIdError(resource, operation));
                    const result = await sdk.projectsAddToTeam(id);
                    return JSON.stringify(buildMutationResponse(resource, operation, id, enrichRecord(result, cache)));
                }
                default:
                    return JSON.stringify(wrapError(resource, operation, ERROR_TYPES.INVALID_OPERATION,
                        'Unsupported operation.', 'Use a valid project operation.'));
            }
        }

        // Timesheet operations
        if (resource === 'timesheet') {
            switch (operation) {
                case 'getAll': {
                    const records = await sdk.timesheetsList(params);
                    return JSON.stringify(buildListResponse(resource, operation, enrichRecords(records, cache)));
                }
                case 'get': {
                    const id = parseId(params.id);
                    if (!id) return JSON.stringify(formatIdError(resource, operation));
                    const result = await sdk.timesheetsGetById(id);
                    if (!result) return JSON.stringify(formatNotFoundError(resource, operation, id));
                    return JSON.stringify(buildItemResponse(resource, operation, enrichRecord(result, cache)));
                }
                case 'create': {
                    const body: Record<string, any> = {};
                    for (const field of ['begin', 'end', 'project', 'activity', 'description',
                        'fixedRate', 'hourlyRate', 'user', 'tags', 'exported', 'billable']) {
                        if (params[field] !== undefined && params[field] !== '') body[field] = params[field];
                    }
                    const full = params.full === true || params.full === '1';
                    const result = await sdk.timesheetsCreate(body, full);
                    return JSON.stringify(buildMutationResponse(resource, operation, result.id, enrichRecord(result, cache)));
                }
                case 'update': {
                    const id = parseId(params.id);
                    if (!id) return JSON.stringify(formatIdError(resource, operation));
                    const body: Record<string, any> = {};
                    for (const field of ['begin', 'end', 'project', 'activity', 'description',
                        'fixedRate', 'hourlyRate', 'user', 'tags', 'exported', 'billable']) {
                        if (params[field] !== undefined && params[field] !== '') body[field] = params[field];
                    }
                    const result = await sdk.timesheetsUpdate(id, body);
                    return JSON.stringify(buildMutationResponse(resource, operation, id, enrichRecord(result, cache)));
                }
                case 'delete': {
                    const id = parseId(params.id);
                    if (!id) return JSON.stringify(formatIdError(resource, operation));
                    await sdk.timesheetsDelete(id);
                    return JSON.stringify(buildDeleteResponse(resource, operation, id));
                }
                case 'stop': {
                    const id = parseId(params.id);
                    if (!id) return JSON.stringify(formatIdError(resource, operation));
                    const result = await sdk.timesheetsStop(id);
                    return JSON.stringify(buildMutationResponse(resource, operation, id, enrichRecord(result, cache)));
                }
                case 'restart': {
                    const id = parseId(params.id);
                    if (!id) return JSON.stringify(formatIdError(resource, operation));
                    const body: Record<string, any> = {};
                    if (params.copy !== undefined) body.copy = params.copy;
                    if (params.begin !== undefined) body.begin = params.begin;
                    const result = await sdk.timesheetsRestart(id, body);
                    return JSON.stringify(buildMutationResponse(resource, operation, result.id, enrichRecord(result, cache)));
                }
                case 'duplicate': {
                    const id = parseId(params.id);
                    if (!id) return JSON.stringify(formatIdError(resource, operation));
                    const result = await sdk.timesheetsDuplicate(id);
                    return JSON.stringify(buildMutationResponse(resource, operation, result.id, enrichRecord(result, cache)));
                }
                case 'toggleExport': {
                    const id = parseId(params.id);
                    if (!id) return JSON.stringify(formatIdError(resource, operation));
                    const result = await sdk.timesheetsToggleExport(id);
                    return JSON.stringify(buildMutationResponse(resource, operation, id, enrichRecord(result, cache)));
                }
                case 'updateMeta': {
                    const id = parseId(params.id);
                    if (!id) return JSON.stringify(formatIdError(resource, operation));
                    const meta: Record<string, any> = {};
                    meta[params.metaName as string] = params.metaValue;
                    const result = await sdk.timesheetsUpdateMeta(id, meta);
                    return JSON.stringify(buildMutationResponse(resource, operation, id, enrichRecord(result, cache)));
                }
                case 'getActive': {
                    const records = await sdk.timesheetsGetActive();
                    return JSON.stringify(buildListResponse(resource, operation, enrichRecords(records, cache)));
                }
                case 'getRecent': {
                    const records = await sdk.timesheetsGetRecent(params);
                    return JSON.stringify(buildListResponse(resource, operation, enrichRecords(records, cache)));
                }
                default:
                    return JSON.stringify(wrapError(resource, operation, ERROR_TYPES.INVALID_OPERATION,
                        'Unsupported operation.', 'Use a valid timesheet operation.'));
            }
        }

        // User operations
        if (resource === 'user') {
            switch (operation) {
                case 'getAll': {
                    const records = await sdk.usersList(params);
                    return JSON.stringify(buildListResponse(resource, operation, enrichRecords(records, cache)));
                }
                case 'get': {
                    const id = parseId(params.id);
                    if (!id) return JSON.stringify(formatIdError(resource, operation));
                    const result = await sdk.usersGetById(id);
                    if (!result) return JSON.stringify(formatNotFoundError(resource, operation, id));
                    return JSON.stringify(buildItemResponse(resource, operation, enrichRecord(result, cache)));
                }
                case 'getMe': {
                    const result = await sdk.usersGetMe();
                    return JSON.stringify(buildItemResponse(resource, operation, enrichRecord(result, cache)));
                }
                case 'create': {
                    const body: Record<string, any> = {};
                    for (const field of ['username', 'alias', 'title', 'accountNumber', 'color', 'email',
                        'language', 'locale', 'timezone', 'supervisor', 'roles', 'plainPassword',
                        'plainApiToken', 'enabled', 'systemAccount', 'requiresPasswordReset']) {
                        if (params[field] !== undefined && params[field] !== '') body[field] = params[field];
                    }
                    const result = await sdk.usersCreate(body);
                    return JSON.stringify(buildMutationResponse(resource, operation, result.id, enrichRecord(result, cache)));
                }
                case 'update': {
                    const id = parseId(params.id);
                    if (!id) return JSON.stringify(formatIdError(resource, operation));
                    const body: Record<string, any> = {};
                    for (const field of ['alias', 'title', 'accountNumber', 'color', 'email',
                        'language', 'locale', 'timezone', 'supervisor', 'roles', 'enabled',
                        'systemAccount', 'requiresPasswordReset']) {
                        if (params[field] !== undefined && params[field] !== '') body[field] = params[field];
                    }
                    const result = await sdk.usersUpdate(id, body);
                    return JSON.stringify(buildMutationResponse(resource, operation, id, enrichRecord(result, cache)));
                }
                case 'updatePreferences': {
                    const id = parseId(params.id);
                    if (!id) return JSON.stringify(formatIdError(resource, operation));
                    const prefs = typeof params.preferences === 'string'
                        ? JSON.parse(params.preferences as string)
                        : params.preferences;
                    const result = await sdk.usersUpdatePreferences(id, prefs);
                    return JSON.stringify(buildMutationResponse(resource, operation, id, enrichRecord(result, cache)));
                }
                case 'deleteApiToken': {
                    const tokenId = parseId(params.tokenId);
                    if (!tokenId) return JSON.stringify(formatIdError(resource, operation));
                    await sdk.usersDeleteApiToken(tokenId);
                    return JSON.stringify(buildDeleteResponse(resource, operation, tokenId));
                }
                default:
                    return JSON.stringify(wrapError(resource, operation, ERROR_TYPES.INVALID_OPERATION,
                        'Unsupported operation.', 'Use a valid user operation.'));
            }
        }

        // Tag operations
        if (resource === 'tag') {
            switch (operation) {
                case 'getAll': {
                    const records = await sdk.tagsList(params);
                    return JSON.stringify(buildListResponse(resource, operation, records));
                }
                case 'create': {
                    const body: Record<string, any> = {};
                    if (params.name !== undefined) body.name = params.name;
                    if (params.color !== undefined) body.color = params.color;
                    if (params.visible !== undefined) body.visible = params.visible;
                    const result = await sdk.tagsCreate(body);
                    return JSON.stringify(buildMutationResponse(resource, operation, result.id, result));
                }
                case 'delete': {
                    const id = parseId(params.id);
                    if (!id) return JSON.stringify(formatIdError(resource, operation));
                    await sdk.tagsDelete(id);
                    return JSON.stringify(buildDeleteResponse(resource, operation, id));
                }
                default:
                    return JSON.stringify(wrapError(resource, operation, ERROR_TYPES.INVALID_OPERATION,
                        'Unsupported operation.', 'Use a valid tag operation.'));
            }
        }

        // Team operations
        if (resource === 'team') {
            switch (operation) {
                case 'getAll': {
                    const records = await sdk.teamsList();
                    return JSON.stringify(buildListResponse(resource, operation, enrichRecords(records, cache)));
                }
                case 'get': {
                    const id = parseId(params.id);
                    if (!id) return JSON.stringify(formatIdError(resource, operation));
                    const result = await sdk.teamsGetById(id);
                    if (!result) return JSON.stringify(formatNotFoundError(resource, operation, id));
                    return JSON.stringify(buildItemResponse(resource, operation, enrichRecord(result, cache)));
                }
                case 'create': {
                    const body: Record<string, any> = {};
                    if (params.name !== undefined) body.name = params.name;
                    if (params.members !== undefined) {
                        body.members = typeof params.members === 'string'
                            ? JSON.parse(params.members as string)
                            : params.members;
                    }
                    if (params.color !== undefined) body.color = params.color;
                    const result = await sdk.teamsCreate(body);
                    return JSON.stringify(buildMutationResponse(resource, operation, result.id, enrichRecord(result, cache)));
                }
                case 'update': {
                    const id = parseId(params.id);
                    if (!id) return JSON.stringify(formatIdError(resource, operation));
                    const body: Record<string, any> = {};
                    if (params.name !== undefined) body.name = params.name;
                    if (params.members !== undefined) {
                        body.members = typeof params.members === 'string'
                            ? JSON.parse(params.members as string)
                            : params.members;
                    }
                    if (params.color !== undefined) body.color = params.color;
                    const result = await sdk.teamsUpdate(id, body);
                    return JSON.stringify(buildMutationResponse(resource, operation, id, enrichRecord(result, cache)));
                }
                case 'delete': {
                    const id = parseId(params.id);
                    if (!id) return JSON.stringify(formatIdError(resource, operation));
                    await sdk.teamsDelete(id);
                    return JSON.stringify(buildDeleteResponse(resource, operation, id));
                }
                case 'addMember': {
                    const id = parseId(params.id);
                    const userId = parseId(params.userId);
                    if (!id || !userId) return JSON.stringify(formatIdError(resource, operation));
                    const result = await sdk.teamsAddMember(id, userId);
                    return JSON.stringify(buildMutationResponse(resource, operation, id, enrichRecord(result, cache)));
                }
                case 'removeMember': {
                    const id = parseId(params.id);
                    const userId = parseId(params.userId);
                    if (!id || !userId) return JSON.stringify(formatIdError(resource, operation));
                    await sdk.teamsRemoveMember(id, userId);
                    return JSON.stringify(buildDeleteResponse(resource, operation, `${id}-${userId}`));
                }
                case 'grantCustomer': {
                    const id = parseId(params.id);
                    const customerId = parseId(params.customerId);
                    if (!id || !customerId) return JSON.stringify(formatIdError(resource, operation));
                    const result = await sdk.teamsGrantCustomerAccess(id, customerId);
                    return JSON.stringify(buildMutationResponse(resource, operation, id, enrichRecord(result, cache)));
                }
                case 'revokeCustomer': {
                    const id = parseId(params.id);
                    const customerId = parseId(params.customerId);
                    if (!id || !customerId) return JSON.stringify(formatIdError(resource, operation));
                    await sdk.teamsRevokeCustomerAccess(id, customerId);
                    return JSON.stringify(buildDeleteResponse(resource, operation, `${id}-${customerId}`));
                }
                case 'grantProject': {
                    const id = parseId(params.id);
                    const projectId = parseId(params.projectId);
                    if (!id || !projectId) return JSON.stringify(formatIdError(resource, operation));
                    const result = await sdk.teamsGrantProjectAccess(id, projectId);
                    return JSON.stringify(buildMutationResponse(resource, operation, id, enrichRecord(result, cache)));
                }
                case 'revokeProject': {
                    const id = parseId(params.id);
                    const projectId = parseId(params.projectId);
                    if (!id || !projectId) return JSON.stringify(formatIdError(resource, operation));
                    await sdk.teamsRevokeProjectAccess(id, projectId);
                    return JSON.stringify(buildDeleteResponse(resource, operation, `${id}-${projectId}`));
                }
                case 'grantActivity': {
                    const id = parseId(params.id);
                    const activityId = parseId(params.activityId);
                    if (!id || !activityId) return JSON.stringify(formatIdError(resource, operation));
                    const result = await sdk.teamsGrantActivityAccess(id, activityId);
                    return JSON.stringify(buildMutationResponse(resource, operation, id, enrichRecord(result, cache)));
                }
                case 'revokeActivity': {
                    const id = parseId(params.id);
                    const activityId = parseId(params.activityId);
                    if (!id || !activityId) return JSON.stringify(formatIdError(resource, operation));
                    await sdk.teamsRevokeActivityAccess(id, activityId);
                    return JSON.stringify(buildDeleteResponse(resource, operation, `${id}-${activityId}`));
                }
                default:
                    return JSON.stringify(wrapError(resource, operation, ERROR_TYPES.INVALID_OPERATION,
                        'Unsupported operation.', 'Use a valid team operation.'));
            }
        }

        // Invoice operations
        if (resource === 'invoice') {
            switch (operation) {
                case 'getAll': {
                    const records = await sdk.invoicesList(params);
                    return JSON.stringify(buildListResponse(resource, operation, enrichRecords(records, cache)));
                }
                case 'get': {
                    const id = parseId(params.id);
                    if (!id) return JSON.stringify(formatIdError(resource, operation));
                    const result = await sdk.invoicesGetById(id);
                    if (!result) return JSON.stringify(formatNotFoundError(resource, operation, id));
                    return JSON.stringify(buildItemResponse(resource, operation, enrichRecord(result, cache)));
                }
                case 'updateCustomFields': {
                    const id = parseId(params.id);
                    if (!id) return JSON.stringify(formatIdError(resource, operation));
                    const fields = typeof params.customFields === 'string'
                        ? JSON.parse(params.customFields as string)
                        : params.customFields;
                    const result = await sdk.invoicesUpdateCustomFields(id, fields);
                    return JSON.stringify(buildMutationResponse(resource, operation, id, enrichRecord(result, cache)));
                }
                case 'download': {
                    const id = parseId(params.id);
                    if (!id) return JSON.stringify(formatIdError(resource, operation));
                    const buffer = await sdk.invoicesDownload(id);
                    const filename = `invoice-${id}.pdf`;
                    return JSON.stringify(buildDownloadResponse(resource, operation, id, filename));
                }
                default:
                    return JSON.stringify(wrapError(resource, operation, ERROR_TYPES.INVALID_OPERATION,
                        'Unsupported operation.', 'Use a valid invoice operation.'));
            }
        }

        // Default/System operations
        if (resource === 'default') {
            switch (operation) {
                case 'ping': {
                    const result = await sdk.pingRaw();
                    return JSON.stringify(buildListResponse(resource, operation, result as Record<string, unknown>[]));
                }
                case 'getVersion': {
                    const result = await sdk.getVersion();
                    return JSON.stringify(buildItemResponse(resource, operation, result as Record<string, unknown>));
                }
                case 'getPlugins': {
                    const records = await sdk.getPlugins();
                    return JSON.stringify(buildListResponse(resource, operation, records));
                }
                case 'getTimesheetConfig': {
                    const result = await sdk.getTimesheetConfig();
                    return JSON.stringify(buildItemResponse(resource, operation, result as Record<string, unknown>));
                }
                case 'getColors': {
                    const result = await sdk.getColors();
                    return JSON.stringify(buildItemResponse(resource, operation, result as Record<string, unknown>));
                }
                case 'getNextWeek': {
                    const userId = parseId(params.userId);
                    if (!userId) return JSON.stringify(formatIdError(resource, operation));
                    const result = await sdk.nextWeek({ user: userId });
                    return JSON.stringify(buildItemResponse(resource, operation, result as Record<string, unknown>));
                }
                case 'getOvertimeYear': {
                    const userId = parseId(params.userId);
                    if (!userId) return JSON.stringify(formatIdError(resource, operation));
                    const result = await sdk.overtimeYear({ user: userId, date: params.date });
                    return JSON.stringify(buildItemResponse(resource, operation, result as Record<string, unknown>));
                }
                case 'getWeekStatus': {
                    const userId = parseId(params.userId);
                    if (!userId) return JSON.stringify(formatIdError(resource, operation));
                    const result = await sdk.weekStatus({ user: userId, date: params.date });
                    return JSON.stringify(buildItemResponse(resource, operation, result as Record<string, unknown>));
                }
                case 'getWeeklyOvertime': {
                    const userId = parseId(params.userId);
                    if (!userId) return JSON.stringify(formatIdError(resource, operation));
                    const records = await sdk.weeklyOvertime({ user: userId, date: params.date });
                    return JSON.stringify(buildListResponse(resource, operation, records));
                }
                case 'addToApprove': {
                    const userId = parseId(params.userId);
                    if (!userId) return JSON.stringify(formatIdError(resource, operation));
                    const result = await sdk.addToApprove({ user: userId, date: params.date });
                    return JSON.stringify(buildMutationResponse(resource, operation, userId, { result }));
                }
                default:
                    return JSON.stringify(wrapError(resource, operation, ERROR_TYPES.INVALID_OPERATION,
                        'Unsupported operation.', 'Use a valid default/system operation.'));
            }
        }

        // Unknown resource
        return JSON.stringify(wrapError(resource, operation, ERROR_TYPES.INVALID_OPERATION,
            `Unknown resource: ${resource}.`,
            `Use one of: ${Object.keys(RESOURCE_OPS).join(', ')}.`));
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);

        // Programming errors must not be labeled as API errors
        if (error instanceof TypeError || error instanceof ReferenceError || error instanceof RangeError) {
            return JSON.stringify(wrapError(resource, operation, ERROR_TYPES.INTERNAL_ERROR,
                `Internal tool error: ${msg}`,
                'This appears to be a bug in the tool. Do not retry with the same parameters.'));
        }

        return JSON.stringify(formatApiError(msg, resource, operation));
    }
}

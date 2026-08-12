// nodes/KimaiPro/ai-tools/schema-generator.ts
import type { RuntimeZod } from './runtime';

// Single source of truth for all operations — used by schema, descriptions, and executor
export const RESOURCE_OPS: Record<string, string[]> = {
  activity: ['getAll', 'get', 'create', 'update', 'delete', 'updateMeta', 'getRates', 'addRate', 'deleteRate', 'addTeam'],
  customer: ['getAll', 'get', 'create', 'update', 'delete', 'updateMeta', 'getRates', 'addRate', 'deleteRate', 'getComments', 'addComment', 'deleteComment', 'togglePin', 'addTeam'],
  project: ['getAll', 'get', 'create', 'update', 'delete', 'updateMeta', 'getRates', 'addRate', 'deleteRate', 'getComments', 'addComment', 'deleteComment', 'togglePin', 'addTeam'],
  timesheet: ['getAll', 'get', 'create', 'update', 'delete', 'stop', 'restart', 'duplicate', 'toggleExport', 'updateMeta', 'getActive', 'getRecent'],
  user: ['getAll', 'get', 'getMe', 'create', 'update', 'updatePreferences', 'deleteApiToken'],
  tag: ['getAll', 'create', 'delete'],
  team: ['getAll', 'get', 'create', 'update', 'delete', 'addMember', 'removeMember', 'grantCustomer', 'revokeCustomer', 'grantProject', 'revokeProject', 'grantActivity', 'revokeActivity'],
  invoice: ['getAll', 'get', 'updateCustomFields', 'download'],
  default: ['ping', 'getVersion', 'getPlugins', 'getTimesheetConfig', 'getColors', 'getNextWeek', 'getOvertimeYear', 'getWeekStatus', 'getWeeklyOvertime', 'addToApprove'],
};

export const OPERATION_LABELS: Record<string, string> = {
    getAll: 'Get All', get: 'Get by ID', create: 'Create', update: 'Update', delete: 'Delete',
    getMe: 'Get Current User', getRates: 'Get Rates', addRate: 'Add Rate', deleteRate: 'Delete Rate',
    getComments: 'Get Comments', addComment: 'Add Comment', deleteComment: 'Delete Comment',
    togglePin: 'Toggle Pin Comment', updateMeta: 'Update Metadata', addTeam: 'Add to Team',
    stop: 'Stop', restart: 'Restart', duplicate: 'Duplicate', toggleExport: 'Toggle Export',
    getActive: 'Get Active', getRecent: 'Get Recent', updatePreferences: 'Update Preferences',
    deleteApiToken: 'Delete API Token', addMember: 'Add Member', removeMember: 'Remove Member',
    grantCustomer: 'Grant Customer Access', revokeCustomer: 'Revoke Customer Access',
    grantProject: 'Grant Project Access', revokeProject: 'Revoke Project Access',
    grantActivity: 'Grant Activity Access', revokeActivity: 'Revoke Activity Access',
    updateCustomFields: 'Update Custom Fields', download: 'Download PDF',
    ping: 'Ping', getVersion: 'Get Version', getPlugins: 'Get Plugins',
    getTimesheetConfig: 'Get Timesheet Config', getColors: 'Get Colors',
    getNextWeek: 'Get Next Week', getOvertimeYear: 'Get Overtime Year',
    getWeekStatus: 'Get Week Status', getWeeklyOvertime: 'Get Weekly Overtime',
    addToApprove: 'Add to Approve',
};

const READ_ONLY_SCHEMA_CACHE_MAX = 200;
const readOnlySchemaCache = new Map<string, unknown>();

function getReadOnlySchemaCacheKey(resource: string, operations: string[]): string {
    return `${resource}|${[...operations].sort().join(',')}`;
}

function setReadOnlySchemaCache(key: string, value: unknown): void {
    if (readOnlySchemaCache.size >= READ_ONLY_SCHEMA_CACHE_MAX) {
        const firstKey = readOnlySchemaCache.keys().next().value as string | undefined;
        if (firstKey) readOnlySchemaCache.delete(firstKey);
    }
    readOnlySchemaCache.set(key, value);
}

export function getRuntimeSchemaBuilders(rz: RuntimeZod) {
    // Universal base schemas
    const idSchema = rz.number().int().min(1).describe(
        'Numeric record ID (>= 1).'
    );
    const limitSchema = rz.number().int().min(1).max(100).nullish().default(25).describe(
        'Maximum records to return (default 25, max 100).'
    );
    const dateSchema = rz.string().nullish().describe(
        'Date in ISO format (YYYY-MM-DD) or datetime (YYYY-MM-DDTHH:mm:ss).'
    );
    const booleanSchema = rz.boolean().nullish().describe('Boolean value.');
    const stringSchema = rz.string().nullish().describe('String value.');
    const termSchema = rz.string().nullish().describe(
        'Search term for partial text match across name and common fields.'
    );

    // Reference ID schemas (use string for MCP compatibility — label resolution handles name→ID)
    const refIdSchema = rz.string().nullish().describe(
        'Numeric ID or name string (resolved automatically).'
    );
    const projectRefSchema = rz.string().nullish().describe(
        'Project ID or name.'
    );
    const customerRefSchema = rz.string().nullish().describe(
        'Customer ID or name.'
    );
    const activityRefSchema = rz.string().nullish().describe(
        'Activity ID or name.'
    );
    const userRefSchema = rz.string().nullish().describe(
        'User ID or username.'
    );
    const tagRefSchema = rz.string().nullish().describe(
        'Tag name or ID.'
    );
    const jsonSchema = rz.string().nullish().describe(
        'JSON string representing the data structure.'
    );

    // Activity schemas
    function getActivityGetAllSchema() {
        return rz.object({
            term: termSchema,
            project: projectRefSchema,
            projects: rz.string().nullish().describe('Comma-separated project IDs.'),
            visible: booleanSchema,
            globals: booleanSchema,
            orderBy: stringSchema,
            order: stringSchema,
        });
    }
    function getActivityGetSchema() {
        return rz.object({ id: idSchema });
    }
    function getActivityCreateSchema() {
        return rz.object({
            name: rz.string().describe('Activity name.'),
            project: rz.string().describe('Project ID or name.'),
            number: stringSchema,
            comment: stringSchema,
            visible: booleanSchema,
            billable: booleanSchema,
            color: stringSchema,
            invoiceText: stringSchema,
            budget: rz.number().nullish().describe('Budget amount.'),
            timeBudget: rz.number().nullish().describe('Time budget in seconds.'),
            budgetType: stringSchema,
            teams: jsonSchema,
        });
    }
    function getActivityUpdateSchema() {
        return rz.object({
            id: idSchema,
            name: stringSchema,
            project: projectRefSchema,
            number: stringSchema,
            comment: stringSchema,
            visible: booleanSchema,
            billable: booleanSchema,
            color: stringSchema,
            invoiceText: stringSchema,
            budget: rz.number().nullish().describe('Budget amount.'),
            timeBudget: rz.number().nullish().describe('Time budget in seconds.'),
            budgetType: stringSchema,
            teams: jsonSchema,
        });
    }
    function getActivityUpdateMetaSchema() {
        return rz.object({
            id: idSchema,
            metaName: rz.string().describe('Metadata key name.'),
            metaValue: stringSchema,
        });
    }
    function getActivityGetRatesSchema() {
        return rz.object({ id: idSchema });
    }
    function getActivityAddRateSchema() {
        return rz.object({
            id: idSchema,
            rateUser: userRefSchema,
            rate: rz.number().nullish().describe('Rate amount.'),
            internalRate: rz.number().nullish().describe('Internal rate.'),
            isFixed: booleanSchema,
        });
    }
    function getActivityDeleteRateSchema() {
        return rz.object({
            id: idSchema,
            rateId: idSchema,
        });
    }
    function getActivityAddTeamSchema() {
        return rz.object({ id: idSchema });
    }

    // Customer schemas
    function getCustomerGetAllSchema() {
        return rz.object({
            term: termSchema,
            visible: booleanSchema,
            order: stringSchema,
            orderBy: stringSchema,
            full: booleanSchema,
        });
    }
    function getCustomerGetSchema() {
        return rz.object({ id: idSchema });
    }
    function getCustomerCreateSchema() {
        return rz.object({
            name: rz.string().describe('Customer name.'),
            number: stringSchema,
            comment: stringSchema,
            company: stringSchema,
            vatId: stringSchema,
            contact: stringSchema,
            addressLine1: stringSchema,
            addressLine2: stringSchema,
            addressLine3: stringSchema,
            postcode: stringSchema,
            city: stringSchema,
            country: stringSchema,
            currency: stringSchema,
            phone: stringSchema,
            fax: stringSchema,
            mobile: stringSchema,
            email: stringSchema,
            homepage: stringSchema,
            timezone: stringSchema,
            language: stringSchema,
            invoiceText: stringSchema,
            invoiceTemplate: stringSchema,
            buyerReference: stringSchema,
            color: stringSchema,
            invoiceEmail: stringSchema,
            customerTeams: jsonSchema,
            budget: rz.number().nullish().describe('Budget amount.'),
            timeBudget: rz.number().nullish().describe('Time budget in seconds.'),
            budgetType: stringSchema,
            visible: booleanSchema,
            billable: booleanSchema,
        });
    }
    function getCustomerUpdateSchema() {
        return rz.object({
            id: idSchema,
            name: stringSchema,
            number: stringSchema,
            comment: stringSchema,
            company: stringSchema,
            vatId: stringSchema,
            contact: stringSchema,
            addressLine1: stringSchema,
            addressLine2: stringSchema,
            addressLine3: stringSchema,
            postcode: stringSchema,
            city: stringSchema,
            country: stringSchema,
            currency: stringSchema,
            phone: stringSchema,
            fax: stringSchema,
            mobile: stringSchema,
            email: stringSchema,
            homepage: stringSchema,
            timezone: stringSchema,
            language: stringSchema,
            invoiceText: stringSchema,
            invoiceTemplate: stringSchema,
            buyerReference: stringSchema,
            color: stringSchema,
            invoiceEmail: stringSchema,
            customerTeams: jsonSchema,
            budget: rz.number().nullish().describe('Budget amount.'),
            timeBudget: rz.number().nullish().describe('Time budget in seconds.'),
            budgetType: stringSchema,
            visible: booleanSchema,
            billable: booleanSchema,
        });
    }
    function getCustomerUpdateMetaSchema() {
        return rz.object({
            id: idSchema,
            metaName: rz.string().describe('Metadata key name.'),
            metaValue: stringSchema,
        });
    }
    function getCustomerGetRatesSchema() {
        return rz.object({ id: idSchema });
    }
    function getCustomerAddRateSchema() {
        return rz.object({
            id: idSchema,
            rateUser: userRefSchema,
            rate: rz.number().nullish().describe('Rate amount.'),
            internalRate: rz.number().nullish().describe('Internal rate.'),
            isFixed: booleanSchema,
        });
    }
    function getCustomerDeleteRateSchema() {
        return rz.object({
            id: idSchema,
            rateId: idSchema,
        });
    }
    function getCustomerGetCommentsSchema() {
        return rz.object({ id: idSchema });
    }
    function getCustomerAddCommentSchema() {
        return rz.object({
            id: idSchema,
            commentText: rz.string().describe('Comment text.'),
        });
    }
    function getCustomerDeleteCommentSchema() {
        return rz.object({
            id: idSchema,
            commentId: idSchema,
        });
    }
    function getCustomerTogglePinSchema() {
        return rz.object({
            id: idSchema,
            commentId: idSchema,
        });
    }
    function getCustomerAddTeamSchema() {
        return rz.object({ id: idSchema });
    }

    // Project schemas
    function getProjectGetAllSchema() {
        return rz.object({
            term: termSchema,
            customers: rz.string().nullish().describe('Comma-separated customer IDs.'),
            visible: booleanSchema,
            start: dateSchema,
            end: dateSchema,
            globalActivities: booleanSchema,
            order: stringSchema,
            orderBy: stringSchema,
            ignoreDates: booleanSchema,
        });
    }
    function getProjectGetSchema() {
        return rz.object({ id: idSchema });
    }
    function getProjectCreateSchema() {
        return rz.object({
            name: rz.string().describe('Project name.'),
            customer: rz.string().describe('Customer ID or name.'),
            number: stringSchema,
            comment: stringSchema,
            invoiceText: stringSchema,
            orderNumber: stringSchema,
            orderDate: dateSchema,
            start: dateSchema,
            end: dateSchema,
            color: stringSchema,
            projectTeams: jsonSchema,
            budget: rz.number().nullish().describe('Budget amount.'),
            timeBudget: rz.number().nullish().describe('Time budget in seconds.'),
            budgetType: stringSchema,
            globalActivities: booleanSchema,
            visible: booleanSchema,
            billable: booleanSchema,
        });
    }
    function getProjectUpdateSchema() {
        return rz.object({
            id: idSchema,
            name: stringSchema,
            customer: customerRefSchema,
            number: stringSchema,
            comment: stringSchema,
            invoiceText: stringSchema,
            orderNumber: stringSchema,
            orderDate: dateSchema,
            start: dateSchema,
            end: dateSchema,
            color: stringSchema,
            projectTeams: jsonSchema,
            budget: rz.number().nullish().describe('Budget amount.'),
            timeBudget: rz.number().nullish().describe('Time budget in seconds.'),
            budgetType: stringSchema,
            globalActivities: booleanSchema,
            visible: booleanSchema,
            billable: booleanSchema,
        });
    }
    function getProjectUpdateMetaSchema() {
        return rz.object({
            id: idSchema,
            metaName: rz.string().describe('Metadata key name.'),
            metaValue: stringSchema,
        });
    }
    function getProjectGetRatesSchema() {
        return rz.object({ id: idSchema });
    }
    function getProjectAddRateSchema() {
        return rz.object({
            id: idSchema,
            rateUser: userRefSchema,
            rate: rz.number().nullish().describe('Rate amount.'),
            internalRate: rz.number().nullish().describe('Internal rate.'),
            isFixed: booleanSchema,
        });
    }
    function getProjectDeleteRateSchema() {
        return rz.object({
            id: idSchema,
            rateId: idSchema,
        });
    }
    function getProjectGetCommentsSchema() {
        return rz.object({ id: idSchema });
    }
    function getProjectAddCommentSchema() {
        return rz.object({
            id: idSchema,
            commentText: rz.string().describe('Comment text.'),
        });
    }
    function getProjectDeleteCommentSchema() {
        return rz.object({
            id: idSchema,
            commentId: idSchema,
        });
    }
    function getProjectTogglePinSchema() {
        return rz.object({
            id: idSchema,
            commentId: idSchema,
        });
    }
    function getProjectAddTeamSchema() {
        return rz.object({ id: idSchema });
    }

    // Timesheet schemas
    function getTimesheetGetAllSchema() {
        return rz.object({
            term: termSchema,
            userFilter: userRefSchema,
            users: rz.string().nullish().describe('Comma-separated user IDs.'),
            customer: customerRefSchema,
            customers: rz.string().nullish().describe('Comma-separated customer IDs.'),
            project: projectRefSchema,
            projects: rz.string().nullish().describe('Comma-separated project IDs.'),
            activity: activityRefSchema,
            activities: rz.string().nullish().describe('Comma-separated activity IDs.'),
            tags: rz.string().nullish().describe('Comma-separated tag names.'),
            begin: dateSchema,
            end: dateSchema,
            page: rz.number().int().min(1).nullish().describe('Page number.'),
            size: rz.number().int().min(1).max(100).nullish().describe('Page size.'),
            orderBy: stringSchema,
            order: stringSchema,
            exported: booleanSchema,
            active: booleanSchema,
            billable: booleanSchema,
            full: booleanSchema,
            modifiedAfter: dateSchema,
        });
    }
    function getTimesheetGetSchema() {
        return rz.object({ id: idSchema });
    }
    function getTimesheetCreateSchema() {
        return rz.object({
            begin: rz.string().describe('Start datetime (ISO format).'),
            end: rz.string().describe('End datetime (ISO format), omit for active entry.'),
            project: rz.string().describe('Project ID or name (required).'),
            activity: rz.string().describe('Activity ID or name (required).'),
            description: stringSchema,
            fixedRate: rz.number().nullish().describe('Fixed rate.'),
            hourlyRate: rz.number().nullish().describe('Hourly rate.'),
            user: userRefSchema,
            tags: rz.string().nullish().describe('Comma-separated tag names.'),
            exported: booleanSchema,
            billable: booleanSchema,
            full: booleanSchema,
        });
    }
    function getTimesheetUpdateSchema() {
        return rz.object({
            id: idSchema,
            begin: dateSchema,
            end: dateSchema,
            project: projectRefSchema,
            activity: activityRefSchema,
            description: stringSchema,
            fixedRate: rz.number().nullish().describe('Fixed rate.'),
            hourlyRate: rz.number().nullish().describe('Hourly rate.'),
            user: userRefSchema,
            tags: rz.string().nullish().describe('Comma-separated tag names.'),
            exported: booleanSchema,
            billable: booleanSchema,
        });
    }
    function getTimesheetStopSchema() {
        return rz.object({ id: idSchema });
    }
    function getTimesheetRestartSchema() {
        return rz.object({
            id: idSchema,
            copy: booleanSchema,
            begin: dateSchema,
        });
    }
    function getTimesheetDuplicateSchema() {
        return rz.object({ id: idSchema });
    }
    function getTimesheetToggleExportSchema() {
        return rz.object({ id: idSchema });
    }
    function getTimesheetUpdateMetaSchema() {
        return rz.object({
            id: idSchema,
            metaName: rz.string().describe('Metadata key name.'),
            metaValue: stringSchema,
        });
    }
    function getTimesheetGetActiveSchema() {
        return rz.object({});
    }
    function getTimesheetGetRecentSchema() {
        return rz.object({
            begin: dateSchema,
            size: rz.number().int().min(1).max(100).nullish().describe('Number of records.'),
        });
    }

    // User schemas
    function getUserGetAllSchema() {
        return rz.object({
            term: termSchema,
            visible: booleanSchema,
            orderBy: stringSchema,
            order: stringSchema,
            full: booleanSchema,
        });
    }
    function getUserGetSchema() {
        return rz.object({ id: idSchema });
    }
    function getUserGetMeSchema() {
        return rz.object({});
    }
    function getUserCreateSchema() {
        return rz.object({
            username: rz.string().describe('Username.'),
            alias: stringSchema,
            title: stringSchema,
            accountNumber: stringSchema,
            color: stringSchema,
            email: rz.string().describe('Email address.'),
            language: stringSchema,
            locale: stringSchema,
            timezone: stringSchema,
            supervisor: rz.string().nullish().describe('Supervisor user ID (as string).'),
            roles: jsonSchema,
            plainPassword: rz.string().describe('Plain text password.'),
            plainApiToken: stringSchema,
            enabled: booleanSchema,
            systemAccount: booleanSchema,
            requiresPasswordReset: booleanSchema,
        });
    }
    function getUserUpdateSchema() {
        return rz.object({
            id: idSchema,
            alias: stringSchema,
            title: stringSchema,
            accountNumber: stringSchema,
            color: stringSchema,
            email: stringSchema,
            language: stringSchema,
            locale: stringSchema,
            timezone: stringSchema,
            supervisor: rz.string().nullish().describe('Supervisor user ID (as string).'),
            roles: jsonSchema,
            enabled: booleanSchema,
            systemAccount: booleanSchema,
            requiresPasswordReset: booleanSchema,
        });
    }
    function getUserUpdatePreferencesSchema() {
        return rz.object({
            id: idSchema,
            preferences: jsonSchema,
        });
    }
    function getUserDeleteApiTokenSchema() {
        return rz.object({
            tokenId: idSchema,
        });
    }

    // Tag schemas
    function getTagGetAllSchema() {
        return rz.object({
            name: rz.string().nullish().describe('Filter by tag name.'),
        });
    }
    function getTagCreateSchema() {
        return rz.object({
            name: rz.string().describe('Tag name.'),
            color: stringSchema,
            visible: booleanSchema,
        });
    }
    function getTagDeleteSchema() {
        return rz.object({ id: idSchema });
    }

    // Team schemas
    function getTeamGetAllSchema() {
        return rz.object({});
    }
    function getTeamGetSchema() {
        return rz.object({ id: idSchema });
    }
    function getTeamCreateSchema() {
        return rz.object({
            name: rz.string().describe('Team name.'),
            members: jsonSchema,
            color: stringSchema,
        });
    }
    function getTeamUpdateSchema() {
        return rz.object({
            id: idSchema,
            name: stringSchema,
            members: jsonSchema,
            color: stringSchema,
        });
    }
    function getTeamAddMemberSchema() {
        return rz.object({
            id: idSchema,
            userId: idSchema,
        });
    }
    function getTeamRemoveMemberSchema() {
        return rz.object({
            id: idSchema,
            userId: idSchema,
        });
    }
    function getTeamGrantCustomerSchema() {
        return rz.object({
            id: idSchema,
            customerId: idSchema,
        });
    }
    function getTeamRevokeCustomerSchema() {
        return rz.object({
            id: idSchema,
            customerId: idSchema,
        });
    }
    function getTeamGrantProjectSchema() {
        return rz.object({
            id: idSchema,
            projectId: idSchema,
        });
    }
    function getTeamRevokeProjectSchema() {
        return rz.object({
            id: idSchema,
            projectId: idSchema,
        });
    }
    function getTeamGrantActivitySchema() {
        return rz.object({
            id: idSchema,
            activityId: idSchema,
        });
    }
    function getTeamRevokeActivitySchema() {
        return rz.object({
            id: idSchema,
            activityId: idSchema,
        });
    }

    // Invoice schemas
    function getInvoiceGetAllSchema() {
        return rz.object({
            begin: dateSchema,
            end: dateSchema,
            customers: rz.string().nullish().describe('Comma-separated customer IDs.'),
            status: rz.string().nullish().describe('Comma-separated: pending, paid, canceled, new.'),
            page: rz.number().int().min(1).nullish().describe('Page number.'),
            size: rz.number().int().min(1).max(100).nullish().describe('Page size.'),
        });
    }
    function getInvoiceGetSchema() {
        return rz.object({ id: idSchema });
    }
    function getInvoiceUpdateCustomFieldsSchema() {
        return rz.object({
            id: idSchema,
            customFields: jsonSchema,
        });
    }
    function getInvoiceDownloadSchema() {
        return rz.object({ id: idSchema });
    }

    // Default/System schemas
    function getDefaultPingSchema() {
        return rz.object({});
    }
    function getDefaultGetVersionSchema() {
        return rz.object({});
    }
    function getDefaultGetPluginsSchema() {
        return rz.object({});
    }
    function getDefaultGetTimesheetConfigSchema() {
        return rz.object({});
    }
    function getDefaultGetColorsSchema() {
        return rz.object({});
    }
    function getDefaultGetNextWeekSchema() {
        return rz.object({
            userId: idSchema,
        });
    }
    function getDefaultGetOvertimeYearSchema() {
        return rz.object({
            userId: idSchema,
            date: dateSchema,
        });
    }
    function getDefaultGetWeekStatusSchema() {
        return rz.object({
            userId: idSchema,
            date: dateSchema,
        });
    }
    function getDefaultGetWeeklyOvertimeSchema() {
        return rz.object({
            userId: idSchema,
            date: dateSchema,
        });
    }
    function getDefaultAddToApproveSchema() {
        return rz.object({
            userId: idSchema,
            date: dateSchema,
        });
    }

    // Operation → schema mapping per resource
    function getSchemaForOperation(resource: string, operation: string) {
        switch (resource) {
            case 'activity':
                switch (operation) {
                    case 'getAll': return getActivityGetAllSchema();
                    case 'get': return getActivityGetSchema();
                    case 'create': return getActivityCreateSchema();
                    case 'update': return getActivityUpdateSchema();
                    case 'delete': return getActivityGetSchema();
                    case 'updateMeta': return getActivityUpdateMetaSchema();
                    case 'getRates': return getActivityGetRatesSchema();
                    case 'addRate': return getActivityAddRateSchema();
                    case 'deleteRate': return getActivityDeleteRateSchema();
                    case 'addTeam': return getActivityAddTeamSchema();
                    default: return getActivityGetSchema();
                }
            case 'customer':
                switch (operation) {
                    case 'getAll': return getCustomerGetAllSchema();
                    case 'get': return getCustomerGetSchema();
                    case 'create': return getCustomerCreateSchema();
                    case 'update': return getCustomerUpdateSchema();
                    case 'delete': return getCustomerGetSchema();
                    case 'updateMeta': return getCustomerUpdateMetaSchema();
                    case 'getRates': return getCustomerGetRatesSchema();
                    case 'addRate': return getCustomerAddRateSchema();
                    case 'deleteRate': return getCustomerDeleteRateSchema();
                    case 'getComments': return getCustomerGetCommentsSchema();
                    case 'addComment': return getCustomerAddCommentSchema();
                    case 'deleteComment': return getCustomerDeleteCommentSchema();
                    case 'togglePin': return getCustomerTogglePinSchema();
                    case 'addTeam': return getCustomerAddTeamSchema();
                    default: return getCustomerGetSchema();
                }
            case 'project':
                switch (operation) {
                    case 'getAll': return getProjectGetAllSchema();
                    case 'get': return getProjectGetSchema();
                    case 'create': return getProjectCreateSchema();
                    case 'update': return getProjectUpdateSchema();
                    case 'delete': return getProjectGetSchema();
                    case 'updateMeta': return getProjectUpdateMetaSchema();
                    case 'getRates': return getProjectGetRatesSchema();
                    case 'addRate': return getProjectAddRateSchema();
                    case 'deleteRate': return getProjectDeleteRateSchema();
                    case 'getComments': return getProjectGetCommentsSchema();
                    case 'addComment': return getProjectAddCommentSchema();
                    case 'deleteComment': return getProjectDeleteCommentSchema();
                    case 'togglePin': return getProjectTogglePinSchema();
                    case 'addTeam': return getProjectAddTeamSchema();
                    default: return getProjectGetSchema();
                }
            case 'timesheet':
                switch (operation) {
                    case 'getAll': return getTimesheetGetAllSchema();
                    case 'get': return getTimesheetGetSchema();
                    case 'create': return getTimesheetCreateSchema();
                    case 'update': return getTimesheetUpdateSchema();
                    case 'delete': return getTimesheetGetSchema();
                    case 'stop': return getTimesheetStopSchema();
                    case 'restart': return getTimesheetRestartSchema();
                    case 'duplicate': return getTimesheetDuplicateSchema();
                    case 'toggleExport': return getTimesheetToggleExportSchema();
                    case 'updateMeta': return getTimesheetUpdateMetaSchema();
                    case 'getActive': return getTimesheetGetActiveSchema();
                    case 'getRecent': return getTimesheetGetRecentSchema();
                    default: return getTimesheetGetSchema();
                }
            case 'user':
                switch (operation) {
                    case 'getAll': return getUserGetAllSchema();
                    case 'get': return getUserGetSchema();
                    case 'getMe': return getUserGetMeSchema();
                    case 'create': return getUserCreateSchema();
                    case 'update': return getUserUpdateSchema();
                    case 'updatePreferences': return getUserUpdatePreferencesSchema();
                    case 'deleteApiToken': return getUserDeleteApiTokenSchema();
                    default: return getUserGetSchema();
                }
            case 'tag':
                switch (operation) {
                    case 'getAll': return getTagGetAllSchema();
                    case 'create': return getTagCreateSchema();
                    case 'delete': return getTagDeleteSchema();
                    default: return getTagDeleteSchema();
                }
            case 'team':
                switch (operation) {
                    case 'getAll': return getTeamGetAllSchema();
                    case 'get': return getTeamGetSchema();
                    case 'create': return getTeamCreateSchema();
                    case 'update': return getTeamUpdateSchema();
                    case 'delete': return getTeamGetSchema();
                    case 'addMember': return getTeamAddMemberSchema();
                    case 'removeMember': return getTeamRemoveMemberSchema();
                    case 'grantCustomer': return getTeamGrantCustomerSchema();
                    case 'revokeCustomer': return getTeamRevokeCustomerSchema();
                    case 'grantProject': return getTeamGrantProjectSchema();
                    case 'revokeProject': return getTeamRevokeProjectSchema();
                    case 'grantActivity': return getTeamGrantActivitySchema();
                    case 'revokeActivity': return getTeamRevokeActivitySchema();
                    default: return getTeamGetSchema();
                }
            case 'invoice':
                switch (operation) {
                    case 'getAll': return getInvoiceGetAllSchema();
                    case 'get': return getInvoiceGetSchema();
                    case 'updateCustomFields': return getInvoiceUpdateCustomFieldsSchema();
                    case 'download': return getInvoiceDownloadSchema();
                    default: return getInvoiceGetSchema();
                }
            case 'default':
                switch (operation) {
                    case 'ping': return getDefaultPingSchema();
                    case 'getVersion': return getDefaultGetVersionSchema();
                    case 'getPlugins': return getDefaultGetPluginsSchema();
                    case 'getTimesheetConfig': return getDefaultGetTimesheetConfigSchema();
                    case 'getColors': return getDefaultGetColorsSchema();
                    case 'getNextWeek': return getDefaultGetNextWeekSchema();
                    case 'getOvertimeYear': return getDefaultGetOvertimeYearSchema();
                    case 'getWeekStatus': return getDefaultGetWeekStatusSchema();
                    case 'getWeeklyOvertime': return getDefaultGetWeeklyOvertimeSchema();
                    case 'addToApprove': return getDefaultAddToApproveSchema();
                    default: return getDefaultPingSchema();
                }
            default:
                return rz.object({ operation: rz.string().describe('Operation to perform') });
        }
    }

    function buildUnifiedSchema(
        resource: string,
        operations: string[],
    ) {
        const enabledOps = Array.from(new Set(operations));

        if (enabledOps.length === 0) {
            return rz.object({ operation: rz.string().describe('Operation to perform') });
        }

        // Read-only shape (no write ops enabled) is credential-independent
        const hasWriteOps = enabledOps.some((op) =>
            ['create', 'update', 'delete', 'updateMeta', 'addRate', 'deleteRate', 'addComment',
             'deleteComment', 'togglePin', 'addTeam', 'stop', 'restart', 'duplicate', 'toggleExport',
             'updatePreferences', 'deleteApiToken', 'addMember', 'removeMember', 'grantCustomer',
             'revokeCustomer', 'grantProject', 'revokeProject', 'grantActivity', 'revokeActivity',
             'updateCustomFields', 'addToApprove'].includes(op)
        );
        const cacheKey = !hasWriteOps ? getReadOnlySchemaCacheKey(resource, enabledOps) : undefined;
        if (cacheKey) {
            const cached = readOnlySchemaCache.get(cacheKey);
            if (cached) return cached;
        }

        const operationEnum = rz
            .enum(enabledOps as [string, ...string[]])
            .describe(`Operation to perform. Allowed values: ${enabledOps.join(', ')}.`);

                const fieldSources = new Map<string, any>();
        const fieldOps = new Map<string, Set<string>>();

        for (const operation of enabledOps) {
            const schema = getSchemaForOperation(resource, operation);
            if (schema && typeof schema.shape === 'object') {
                for (const [field, fieldSchema] of Object.entries(schema.shape)) {
                    if (!fieldSources.has(field)) fieldSources.set(field, fieldSchema);
                    if (!fieldOps.has(field)) fieldOps.set(field, new Set<string>());
                    fieldOps.get(field)?.add(operation);
                }
            }
        }

                const mergedShape: Record<string, any> = { operation: operationEnum };

        for (const [field, fieldSchema] of fieldSources.entries()) {
            const opsForField = Array.from(fieldOps.get(field) ?? []);
            const baseDescription = fieldSchema.description ?? '';
            const opsDescription = `Used by: ${opsForField.map((op) => OPERATION_LABELS[op] ?? op).join(', ')}.`;
            const description = baseDescription ? `${baseDescription} ${opsDescription}` : opsDescription;
            mergedShape[field] = fieldSchema.nullish().describe(description);
        }

        const schema = rz.object(mergedShape);
        if (cacheKey) setReadOnlySchemaCache(cacheKey, schema);
        return schema;
    }

    return { buildUnifiedSchema };
}

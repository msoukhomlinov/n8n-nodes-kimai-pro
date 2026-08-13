// nodes/KimaiPro/ai-tools/description-builders.ts

/**
 * One-line resource-specific usage hint that fits inside the terse tool description.
 */
const RESOURCE_HINTS: Record<string, string> = {
  activity: 'Activities are time-tracking tasks linked to projects.',
  customer: 'Customers are clients billed for time entries.',
  project: 'Projects belong to customers and contain activities.',
  timesheet: 'Time entries. Create/update need project and activity. Auto-enriched with related names.',
  user: 'Users are Kimai accounts. getMe returns the authenticated user.',
  tag: 'Tags are name-based labels for timesheets.',
  team: 'Teams manage access to customers, projects, and activities.',
  invoice: 'Invoices are generated billing documents. Download returns binary PDF.',
  default: 'System info and approval bundle operations.',
};

/**
 * Parameter documentation for each resource, used to compensate for empty MCP input schemas.
 * Documents operation values and key parameters so LLMs can discover valid inputs from description text.
 */
const RESOURCE_PARAMS: Record<string, string> = {
  activity:
    'Parameters: operation (getAll|get|create|update|delete|updateMeta|getRates|addRate|deleteRate|addTeam), id (for get/delete/updateMeta/getRates/addRate/deleteRate/addTeam), term (search), project (filter by project ID/name), projects (comma-separated IDs), visible, globals, orderBy, order; create/update: name, project, number, comment, visible, billable, color, invoiceText, budget, timeBudget, budgetType, teams (JSON array); addRate: rateUser, rate, internalRate, isFixed; deleteRate: rateId.',

  customer:
    'Parameters: operation (getAll|get|create|update|delete|updateMeta|getRates|addRate|deleteRate|getComments|addComment|deleteComment|togglePin|addTeam), id (for get/delete/updateMeta/getRates/addRate/deleteRate/getComments/addComment/deleteComment/togglePin/addTeam), term (search), visible, order, orderBy, full; create/update: name, number, comment, company, vatId, contact, addressLine1-3, postcode, city, country, currency, phone, fax, mobile, email, homepage, timezone, language, invoiceText, invoiceTemplate, buyerReference, color, invoiceEmail, customerTeams (JSON array), budget, timeBudget, budgetType, visible, billable; addComment: commentText; deleteComment/togglePin: commentId; addRate: rateUser, rate, internalRate, isFixed; deleteRate: rateId.',

  project:
    'Parameters: operation (getAll|get|create|update|delete|updateMeta|getRates|addRate|deleteRate|getComments|addComment|deleteComment|togglePin|addTeam), id (for get/delete/updateMeta/getRates/addRate/deleteRate/getComments/addComment/deleteComment/togglePin/addTeam), term (search), customers (comma-separated IDs), visible, start/end (date), globalActivities, ignoreDates, order, orderBy; create/update: name, customer (ID/name), number, comment, invoiceText, orderNumber, orderDate, start, end, color, projectTeams (JSON array), budget, timeBudget, budgetType, globalActivities, visible, billable; addComment: commentText; deleteComment/togglePin: commentId; addRate: rateUser, rate, internalRate, isFixed; deleteRate: rateId.',

  timesheet:
    'Parameters: operation (getAll|get|create|update|delete|stop|restart|duplicate|toggleExport|updateMeta|getActive|getRecent), id (for get/delete/stop/restart/duplicate/toggleExport/updateMeta), term (search), user (single user ID/name), users (comma-separated IDs), project (project ID/name), projects (comma-separated IDs), activity (activity ID/name), activities (comma-separated IDs), tags (comma-separated names), begin/end (ISO date/datetime), page, size, orderBy, order, exported, active, billable, full, modifiedAfter; create: begin (ISO), end (ISO, omit for active), project (required), activity (required), description, fixedRate, hourlyRate, user, tags, exported, billable; update: begin, end, project, activity, description, fixedRate, hourlyRate, user, tags, exported, billable; restart: copy, begin; getRecent: begin, size.',

  user:
    'Parameters: operation (getAll|get|getMe|create|update|updatePreferences|deleteApiToken), id (for get/delete/update/updatePreferences/deleteApiToken), term (search), visible, orderBy, order, full; create: username, email, plainPassword (required), alias, title, accountNumber, color, language, locale, timezone, supervisor (user ID as string), roles (JSON array), plainApiToken, enabled, systemAccount, requiresPasswordReset; update: alias, title, accountNumber, color, email, language, locale, timezone, supervisor, roles (JSON array), enabled, systemAccount, requiresPasswordReset; updatePreferences: preferences (JSON object); deleteApiToken: tokenId.',

  tag:
    'Parameters: operation (getAll|create|delete), id (for delete), name (filter getAll or create); create: name (required), color, visible.',

  team:
    'Parameters: operation (getAll|get|create|update|delete|addMember|removeMember|grantCustomer|revokeCustomer|grantProject|revokeProject|grantActivity|revokeActivity), id (for all except getAll); create/update: name, members (JSON array of {id, username}), color; addMember/removeMember: userId; grantCustomer/revokeCustomer: customerId; grantProject/revokeProject: projectId; grantActivity/revokeActivity: activityId.',

  invoice:
    'Parameters: operation (getAll|get|updateCustomFields|download), id (for get/updateCustomFields/download), begin/end (ISO date filter), customers (comma-separated IDs), status (comma-separated: pending,paid,canceled,new), page, size; updateCustomFields: customFields (JSON object of field values).',

  default:
    'Parameters: operation (ping|getVersion|getPlugins|getTimesheetConfig|getColors|getNextWeek|getOvertimeYear|getWeekStatus|getWeeklyOvertime|addToApprove); ping/getVersion/getPlugins/getTimesheetConfig/getColors require no params; getNextWeek/getOvertimeYear/getWeekStatus/getWeeklyOvertime/addToApprove: userId, date (ISO, optional for getNextWeek).',
};

/**
 * Single envelope statement appended to every tool description.
 */
const ENVELOPE_PREAMBLE =
  "Response format: success returns data with 'data' key; errors return 'error' key with message. Fields with default values may be omitted from responses.";

/**
 * Build the unified tool description passed to the LLM as the
 * DynamicStructuredTool description. Kept deliberately terse.
 *
 * Includes parameter documentation to compensate for MCP tools/list
 * returning empty input schemas — this is the workaround for n8n's
 * DynamicStructuredTool schema serialization limitation.
 */
export function buildUnifiedDescription(
    resourceLabel: string,
    resource: string,
    operations: string[],
): string {
    const enabledOps = Array.from(new Set(operations));
    const hint = RESOURCE_HINTS[resource] ?? '';
    const params = RESOURCE_PARAMS[resource] ?? '';

    // Separate read and write operations for clarity
    const readOps = enabledOps.filter(op => !['create', 'update', 'delete', 'updateMeta', 'addRate',
        'deleteRate', 'addComment', 'deleteComment', 'togglePin', 'addTeam', 'stop', 'restart',
        'duplicate', 'toggleExport', 'updatePreferences', 'deleteApiToken', 'addMember',
        'removeMember', 'grantCustomer', 'revokeCustomer', 'grantProject', 'revokeProject',
        'grantActivity', 'revokeActivity', 'updateCustomFields', 'addToApprove'].includes(op));
    const writeOps = enabledOps.filter(op => !readOps.includes(op));

    const parts: string[] = [];
    parts.push(`Manage Kimai ${resourceLabel} records.`);
    parts.push(`Operations: ${enabledOps.join(', ')}.`);
    if (writeOps.length > 0) {
        parts.push(`Write operations require write permissions enabled.`);
    }
    if (hint) {
        parts.push(hint);
    }
    if (params) {
        parts.push(params);
    }
    parts.push(ENVELOPE_PREAMBLE);

    return parts.join(' ');
}

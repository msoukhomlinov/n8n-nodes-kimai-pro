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
 * Single envelope statement appended to every tool description.
 */
const ENVELOPE_PREAMBLE =
  "Envelope v3 — 'error' key = failure; default-valued fields omitted.";

/**
 * Build the unified tool description passed to the LLM as the
 * DynamicStructuredTool description. Kept deliberately terse.
 */
export function buildUnifiedDescription(
    resourceLabel: string,
    resource: string,
    operations: string[],
): string {
    const enabledOps = Array.from(new Set(operations));
    const hint = RESOURCE_HINTS[resource] ?? '';

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
        parts.push(`Write operations require allowWrites toggle enabled.`);
    }
    if (hint) {
        parts.push(hint);
    }
    parts.push(ENVELOPE_PREAMBLE);

    return parts.join(' ');
}

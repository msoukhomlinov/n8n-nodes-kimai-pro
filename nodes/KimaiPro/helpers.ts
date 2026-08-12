import type { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
import { KimaiSdk } from './sdk-wrapper';

interface EntityItem {
    id: number | string;
    name?: string;
    username?: string;
    alias?: string;
    globalActivities?: boolean;
    [key: string]: any;
}

function mapToOptions(items: EntityItem[]): INodePropertyOptions[] {
    return items.map((item) => ({
        name: item.name || item.username || item.alias || String(item.id),
        value: String(item.id),
    }));
}

/**
 * Get SDK instance from load options context
 */
async function getSdk(this: ILoadOptionsFunctions): Promise<KimaiSdk> {
    const credentials = await this.getCredentials('kimaiProApi');
    const baseURL = credentials.apiUrl as string;
    const apiToken = credentials.apiToken as string;
    return new KimaiSdk({ apiUrl: baseURL, apiToken });
}

/**
 * Load customer options for picklists.
 * Invoice "Customers" is a multiOptions field (no sentinel needed),
 * all other contexts are single-value options (sentinel wanted).
 */
export async function getCustomers(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
    try {
        const sdk = await getSdk.call(this);
        const items = await sdk.customersList({ visible: '3' });
        const resource = this.getCurrentNodeParameter('resource') as string;
        // invoice customers is a multiOptions field - no empty sentinel needed
        if (resource === 'invoice') {
            return mapToOptions(items);
        }
        return [{ name: '', value: '' }, ...mapToOptions(items)];
    } catch {
        return [];
    }
}

/**
 * Load project options for picklists.
 * Uses visible=1 for timesheet creation, visible=3 for management contexts.
 */
export async function getProjects(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
    try {
        const sdk = await getSdk.call(this);
        const operation = this.getCurrentNodeParameter('operation') as string;
        const resource = this.getCurrentNodeParameter('resource') as string;

        // Use visible=1 for timesheet create only, visible=3 for update and management
        const isTimesheetCreate = resource === 'timesheet' && operation === 'create';
        const visible = isTimesheetCreate ? '1' : '3';

        const qs: Record<string, any> = { visible };

        // For timesheet create, filter by booking date if provided.
        // Only apply bounds when Begin is a concrete date; skip date filtering
        // when it is an unresolved expression (e.g. {{$json.begin}}) that the
        // load-options context cannot resolve against an input item.
        if (isTimesheetCreate) {
            const begin = this.getCurrentNodeParameter('begin') as string;
            if (begin && typeof begin === 'string' && !begin.includes('{{') && !begin.startsWith('=')) {
                qs.start = begin;
                qs.end = begin;
            }
        } else {
            qs.ignoreDates = '1';
        }

        const items = await sdk.projectsList(qs);
        return [{ name: '', value: '' }, ...items.map((item: EntityItem) => ({
            name: item.parentTitle ? `${item.name} (${item.parentTitle})` : (item.name || String(item.id)),
            value: String(item.id),
        }))];
    } catch {
        return [];
    }
}

/**
 * Load activity options for picklists.
 * Fetches project-bound and global activities separately, then merges.
 * Only includes global activities if the selected project permits them.
 */
export async function getActivities(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
    try {
        const sdk = await getSdk.call(this);
        const projectParam = this.getCurrentNodeParameter('project');
        // Skip a project filter when it is an unresolved input-item expression
        // (e.g. {{$json.projectId}}) that the load-options context cannot resolve.
        const projectId = typeof projectParam === 'string'
            && !projectParam.includes('{{')
            && !projectParam.startsWith('=')
            ? projectParam
            : undefined;
        let items: EntityItem[];

        if (projectId) {
            /* Fetch project-bound activities and global activities separately, then merge. */
            const [projectItems, globalItems] = await Promise.all([
                sdk.activitiesList({ project: projectId }),
                sdk.activitiesList({ globals: true }),
            ]);

            /* Check if the selected project allows global activities */
            let allowsGlobals = false;
            try {
                const project = await sdk.projectsGetById(Number(projectId));
                allowsGlobals = project && project.globalActivities !== false;
            } catch {
                /* If detail lookup fails, exclude global activities to be safe */
                allowsGlobals = false;
            }

            /* Deduplicate by ID — project activities take priority. */
            const seen = new Set(projectItems.map((i) => String(i.id)));
            const filteredGlobals = allowsGlobals 
                ? globalItems.filter((i) => !seen.has(String(i.id)))
                : [];
            items = [...projectItems, ...filteredGlobals];
        } else {
            items = await sdk.activitiesList();
        }

        return [{ name: '', value: '' }, ...items.map((item: EntityItem) => ({
            name: item.parentTitle ? `${item.name} (${item.parentTitle})` : (item.name || String(item.id)),
            value: String(item.id),
        }))];
    } catch {
        return [];
    }
}

/**
 * Load user options for picklists.
 * For timesheet "Get All", prepend an "All users" option so privileged users can
 * explicitly query across all users. For other contexts (create/update, approval)
 * a specific user is required, so the empty sentinel is kept.
 */
export async function getUsers(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
    try {
        const sdk = await getSdk.call(this);
        const resource = this.getCurrentNodeParameter('resource') as string;
        const operation = this.getCurrentNodeParameter('operation') as string;

        const items = await sdk.usersList({ visible: '3' });

        // Timesheet "Get All" is user-scoped by default; add "All Users" option so
        // privileged users can explicitly fetch across all users.
        // Include empty sentinel so the default '' value is a valid option (prevents
        // n8n treating it as an unsupported value and allows authenticated-user default).
        if (resource === 'timesheet' && operation === 'getAll') {
            return [{ name: '', value: '' }, { name: 'All Users', value: 'all' }, ...mapToOptions(items)];
        }

        // For other contexts (create/update), a specific user is required.
        return [{ name: '', value: '' }, ...mapToOptions(items)];
    } catch {
        return [];
    }
}

/**
 * Load tag options for picklists. Tags API uses names, not IDs.
 * Backs a multiOptions field, so no empty sentinel is added.
 */
export async function getTags(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
    try {
        const sdk = await getSdk.call(this);
        const items = await sdk.tagsList();
        return items.map((item) => ({
            name: item.name || String(item.id),
            value: item.name || String(item.id),
        }));
    } catch {
        return [];
    }
}

/**
 * Load team options for picklists
 */
export async function getTeams(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
    try {
        const sdk = await getSdk.call(this);
        const items = await sdk.teamsList();
        return [{ name: '', value: '' }, ...mapToOptions(items)];
    } catch {
        return [];
    }
}

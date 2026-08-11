import type { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';

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

async function fetchEntities(this: ILoadOptionsFunctions, url: string, qs?: Record<string, any>): Promise<EntityItem[]> {
    try {
        const credentials = await this.getCredentials('kimaiProApi');
        const baseURL = credentials.apiUrl as string;
        const apiToken = credentials.apiToken as string;
        const response = await this.helpers.httpRequest({
            method: 'GET',
            url: `${baseURL}${url}`,
            qs: qs || {},
            headers: {
                'Authorization': `Bearer ${apiToken}`,
            },
        });
        const items = Array.isArray(response) ? response : (response.data || response.entities || []);
        return Array.isArray(items) ? items : [];
    } catch (e) {
        return [];
    }
}

/**
 * Load customer options for picklists
 */
export async function getCustomers(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
    const items = await fetchEntities.call(this, '/api/customers', { visible: '3' });
    return [{ name: '', value: '' }, ...mapToOptions(items)];
}

/**
 * Load project options for picklists.
 * Uses visible=1 for timesheet creation, visible=3 for management contexts.
 */
export async function getProjects(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
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

    const items = await fetchEntities.call(this, '/api/projects', qs);
    return [{ name: '', value: '' }, ...items.map((item: EntityItem) => ({
        name: item.parentTitle ? `${item.name} (${item.parentTitle})` : (item.name || String(item.id)),
        value: String(item.id),
    }))];
}

/**
 * Load activity options for picklists.
 * Fetches project-bound and global activities separately, then merges.
 * Only includes global activities if the selected project permits them.
 */
export async function getActivities(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
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
            fetchEntities.call(this, '/api/activities', { project: projectId }),
            fetchEntities.call(this, '/api/activities', { globals: '1' }),
        ]);

        /* Check if the selected project allows global activities */
        let allowsGlobals = false;
        try {
            const credentials = await this.getCredentials('kimaiProApi');
            const baseURL = credentials.apiUrl as string;
            const apiToken = credentials.apiToken as string;
            const projectResponse = await this.helpers.httpRequest({
                method: 'GET',
                url: `${baseURL}/api/projects/${projectId}`,
                headers: { 'Authorization': `Bearer ${apiToken}` },
            });
            const project = Array.isArray(projectResponse) ? projectResponse[0] : projectResponse;
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
        items = await fetchEntities.call(this, '/api/activities');
    }

    return [{ name: '', value: '' }, ...items.map((item: EntityItem) => ({
        name: item.parentTitle ? `${item.name} (${item.parentTitle})` : (item.name || String(item.id)),
        value: String(item.id),
    }))];
}

/**
 * Load user options for picklists
 */
export async function getUsers(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
    const items = await fetchEntities.call(this, '/api/users', { visible: '3' });
    return [{ name: '', value: '' }, ...mapToOptions(items)];
}

/**
 * Load tag options for picklists. Tags API uses names, not IDs.
 */
export async function getTags(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
    const items = await fetchEntities.call(this, '/api/tags/find');
    return [{ name: '', value: '' }, ...items.map((item) => ({
        name: item.name || String(item.id),
        value: item.name || String(item.id),
    }))];
}

/**
 * Load team options for picklists
 */
export async function getTeams(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
    const items = await fetchEntities.call(this, '/api/teams');
    return [{ name: '', value: '' }, ...mapToOptions(items)];
}

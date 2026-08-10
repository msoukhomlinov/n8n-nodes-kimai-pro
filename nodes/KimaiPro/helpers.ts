import type { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';

interface EntityItem {
    id: number | string;
    name?: string;
    username?: string;
    alias?: string;
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
        const response = await this.helpers.httpRequest({
            method: 'GET',
            url: `${baseURL}${url}`,
            qs: qs || {},
            headers: {
                Accept: 'application/json',
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
    const items = await fetchEntities.call(this, '/api/customers');
    return mapToOptions(items);
}

/**
 * Load project options for picklists. Optionally filter by customer.
 */
export async function getProjects(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
    const items = await fetchEntities.call(this, '/api/projects');
    return mapToOptions(items);
}

/**
 * Load activity options for picklists. Optionally filter by project.
 */
export async function getActivities(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
    const projectId = this.getCurrentNodeParameter('project');
    const qs: Record<string, any> = {};
    if (projectId) {
        qs.project = projectId;
    }
    const items = await fetchEntities.call(this, '/api/activities', qs);
    return mapToOptions(items);
}

/**
 * Load user options for picklists
 */
export async function getUsers(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
    const items = await fetchEntities.call(this, '/api/users');
    return mapToOptions(items);
}

/**
 * Load tag options for picklists. Tags API uses names, not IDs.
 */
export async function getTags(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
    const items = await fetchEntities.call(this, '/api/tags/find');
    return items.map((item) => ({
        name: item.name || String(item.id),
        value: item.name || String(item.id),
    }));
}

/**
 * Load team options for picklists
 */
export async function getTeams(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
    const items = await fetchEntities.call(this, '/api/teams');
    return mapToOptions(items);
}


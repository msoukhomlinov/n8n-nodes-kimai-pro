import {
	INodeType,
	INodeTypeDescription,
	INodeProperties,
	INodeExecutionData,
	NodeOperationError,
} from 'n8n-workflow';
import type { ResourceDescriptor, OperationDefinition } from './descriptors/types';
import {
	activityDescriptor,
	customerDescriptor,
	projectDescriptor,
	tagDescriptor,
	teamDescriptor,
	timesheetDescriptor,
	userDescriptor,
	invoiceDescriptor,
	defaultDescriptor,
} from './descriptors';
import {
	getCustomers,
	getProjects,
	getActivities,
	getUsers,
	getTags,
	getTeams,
} from './helpers';
import { KimaiSdk } from './sdk-wrapper';

function buildOperationProperty(descriptor: ResourceDescriptor): INodeProperties {
	const options: Array<any> = descriptor.operations.map((op: OperationDefinition) => ({
		name: op.name,
		value: op.value,
		action: op.action,
		// Keep routing for backwards compatibility with n8n's UI,
		// but execution is handled by execute() below.
		routing: op.routing,
	}));

	return {
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: [descriptor.resource],
			},
		},
		options,
		default: descriptor.defaultOperation,
	};
}

function buildProperties(descriptor: ResourceDescriptor): INodeProperties[] {
	return [buildOperationProperty(descriptor), ...descriptor.parameters];
}

const descriptors: ResourceDescriptor[] = [
	activityDescriptor,
	customerDescriptor,
	projectDescriptor,
	tagDescriptor,
	teamDescriptor,
	timesheetDescriptor,
	userDescriptor,
	invoiceDescriptor,
	defaultDescriptor,
];

/**
 * Helper to parse a numeric ID from a parameter value
 */
function parseId(value: any): number {
	const num = Number(value);
	if (isNaN(num)) {
		throw new NodeOperationError(this, `Invalid ID: ${value}`);
	}
	return num;
}

/**
 * Helper to convert SDK results to n8n execution data
 */
function toItems(data: any): INodeExecutionData[] {
	if (!data) {
		return [];
	}
	if (Array.isArray(data)) {
		return data.map((item) => ({ json: item }));
	}
	return [{ json: data }];
}

/**
 * Helper to build request body from parameters for create/update operations
 */
function buildBody(params: Record<string, any>, fields: string[]): Record<string, any> {
	const body: Record<string, any> = {};
	for (const field of fields) {
		const value = params[field];
		if (value !== undefined && value !== '' && value !== null) {
			body[field] = value;
		}
	}
	return body;
}

export class KimaiPro implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Kimai Pro',
		name: 'kimaiPro',
		icon: 'file:kimai.svg',
		group: ['organization'],
		version: 1,

		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with Kimai time-tracking API',
		defaults: {
			name: 'Kimai',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'kimaiProApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Activity',
						value: 'activity',
					},
					{
						name: 'Customer',
						value: 'customer',
					},
					{
						name: 'Default',
						value: 'default',
					},
					{
						name: 'Invoice',
						value: 'invoice',
					},
					{
						name: 'Project',
						value: 'project',
					},
					{
						name: 'Tag',
						value: 'tag',
					},
					{
						name: 'Team',
						value: 'team',
					},
					{
						name: 'Timesheet',
						value: 'timesheet',
					},
					{
						name: 'User',
						value: 'user',
					},
				],
				default: 'timesheet',
			},
			...descriptors.flatMap(buildProperties),
		],
	};

	methods = {
		loadOptions: {
			getCustomers,
			getProjects,
			getActivities,
			getUsers,
			getTags,
			getTeams,
		},
	};

	async execute(this: any): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const credentials = await this.getCredentials('kimaiProApi');
		const sdk = new KimaiSdk({
			apiUrl: credentials.apiUrl as string,
			apiToken: credentials.apiToken as string,
		});

		for (let i = 0; i < items.length; i++) {
			const item = items[i];
			const resource = this.getNodeParameter('resource', i) as string;
			const operation = this.getNodeParameter('operation', i) as string;
			const allParams = item.parameters as Record<string, any>;

			let result: any;

			try {
				// ==================== Activities ====================
				if (resource === 'activity') {
					switch (operation) {
						case 'getAll':
							result = await sdk.activitiesList(allParams);
							break;
						case 'get':
							result = await sdk.activitiesGetById(parseId.call(this, allParams.id));
							break;
						case 'create': {
							const body = buildBody(allParams, [
								'name', 'project', 'teams', 'number', 'comment',
								'visible', 'billable', 'color', 'invoiceText',
								'budget', 'timeBudget', 'budgetType',
							]);
							result = await sdk.activitiesCreate(body);
							break;
						}
						case 'update': {
							const id = parseId.call(this, allParams.id);
							const body = buildBody(allParams, [
								'name', 'project', 'teams', 'number', 'comment',
								'visible', 'billable', 'color', 'invoiceText',
								'budget', 'timeBudget', 'budgetType',
							]);
							result = await sdk.activitiesUpdate(id, body);
							break;
						}
						case 'delete':
							await sdk.activitiesDelete(parseId.call(this, allParams.id));
							result = { success: true };
							break;
						case 'updateMeta': {
							const id = parseId.call(this, allParams.id);
							const meta: Record<string, any> = {};
							meta[allParams.metaName] = allParams.metaValue;
							result = await sdk.activitiesUpdateMeta(id, meta);
							break;
						}
						case 'getRates':
							result = await sdk.activitiesGetRates(parseId.call(this, allParams.id));
							break;
						case 'addRate': {
							const id = parseId.call(this, allParams.id);
							const body = buildBody(allParams, ['rateUser', 'rate', 'internalRate', 'isFixed']);
							body.user = body.rateUser;
							delete body.rateUser;
							result = await sdk.activitiesCreateRate(id, body);
							break;
						}
						case 'deleteRate': {
							const id = parseId.call(this, allParams.id);
							const rateId = parseId.call(this, allParams.rateId);
							await sdk.activitiesDeleteRate(id, rateId);
							result = { success: true };
							break;
						}
						case 'addTeam':
							result = await sdk.activitiesAddToTeam(parseId.call(this, allParams.id));
							break;
						default:
							throw new NodeOperationError(this, `Operation "${operation}" not supported for activity`);
					}
				}
				// ==================== Customers ====================
				else if (resource === 'customer') {
					switch (operation) {
						case 'getAll':
							result = await sdk.customersList(allParams);
							break;
						case 'get':
							result = await sdk.customersGetById(parseId.call(this, allParams.id));
							break;
						case 'create': {
							const body = buildBody(allParams, [
								'name', 'number', 'comment', 'company', 'vatId', 'contact',
								'addressLine1', 'addressLine2', 'addressLine3', 'postcode',
								'city', 'country', 'currency', 'phone', 'fax', 'mobile',
								'email', 'homepage', 'timezone', 'language', 'invoiceText',
								'invoiceTemplate', 'buyerReference', 'color', 'invoiceEmail',
								'customerTeams', 'budget', 'timeBudget', 'budgetType',
								'visible', 'billable',
							]);
							body.teams = body.customerTeams;
							delete body.customerTeams;
							result = await sdk.customersCreate(body);
							break;
						}
						case 'update': {
							const id = parseId.call(this, allParams.id);
							const body = buildBody(allParams, [
								'name', 'number', 'comment', 'company', 'vatId', 'contact',
								'addressLine1', 'addressLine2', 'addressLine3', 'postcode',
								'city', 'country', 'currency', 'phone', 'fax', 'mobile',
								'email', 'homepage', 'timezone', 'language', 'invoiceText',
								'invoiceTemplate', 'buyerReference', 'color', 'invoiceEmail',
								'customerTeams', 'budget', 'timeBudget', 'budgetType',
								'visible', 'billable',
							]);
							body.teams = body.customerTeams;
							delete body.customerTeams;
							result = await sdk.customersUpdate(id, body);
							break;
						}
						case 'delete':
							await sdk.customersDelete(parseId.call(this, allParams.id));
							result = { success: true };
							break;
						case 'updateMeta': {
							const id = parseId.call(this, allParams.id);
							const meta: Record<string, any> = {};
							meta[allParams.metaName] = allParams.metaValue;
							result = await sdk.customersUpdateMeta(id, meta);
							break;
						}
						case 'getRates':
							result = await sdk.customersGetRates(parseId.call(this, allParams.id));
							break;
						case 'addRate': {
							const id = parseId.call(this, allParams.id);
							const body = buildBody(allParams, ['rateUser', 'rate', 'internalRate', 'isFixed']);
							body.user = body.rateUser;
							delete body.rateUser;
							result = await sdk.customersCreateRate(id, body);
							break;
						}
						case 'deleteRate': {
							const id = parseId.call(this, allParams.id);
							const rateId = parseId.call(this, allParams.rateId);
							await sdk.customersDeleteRate(id, rateId);
							result = { success: true };
							break;
						}
						case 'getComments':
							result = await sdk.customersListComments(parseId.call(this, allParams.id));
							break;
						case 'addComment': {
							const id = parseId.call(this, allParams.id);
							result = await sdk.customersCreateComment(id, { message: allParams.commentText });
							break;
						}
						case 'deleteComment': {
							const id = parseId.call(this, allParams.id);
							const commentId = parseId.call(this, allParams.commentId);
							await sdk.customersDeleteComment(id, commentId);
							result = { success: true };
							break;
						}
						case 'togglePin': {
							const id = parseId.call(this, allParams.id);
							const commentId = parseId.call(this, allParams.commentId);
							result = await sdk.customersPinComment(id, commentId);
							break;
						}
						case 'addTeam':
							result = await sdk.customersAddToTeam(parseId.call(this, allParams.id));
							break;
						default:
							throw new NodeOperationError(this, `Operation "${operation}" not supported for customer`);
					}
				}
				// ==================== Projects ====================
				else if (resource === 'project') {
					switch (operation) {
						case 'getAll':
							result = await sdk.projectsList(allParams);
							break;
						case 'get':
							result = await sdk.projectsGetById(parseId.call(this, allParams.id));
							break;
						case 'create': {
							const body = buildBody(allParams, [
								'name', 'customer', 'number', 'comment', 'invoiceText',
								'orderNumber', 'orderDate', 'start', 'end', 'color',
								'projectTeams', 'budget', 'timeBudget', 'budgetType',
								'globalActivities', 'visible', 'billable',
							]);
							body.teams = body.projectTeams;
							delete body.projectTeams;
							result = await sdk.projectsCreate(body);
							break;
						}
						case 'update': {
							const id = parseId.call(this, allParams.id);
							const body = buildBody(allParams, [
								'name', 'customer', 'number', 'comment', 'invoiceText',
								'orderNumber', 'orderDate', 'start', 'end', 'color',
								'projectTeams', 'budget', 'timeBudget', 'budgetType',
								'globalActivities', 'visible', 'billable',
							]);
							body.teams = body.projectTeams;
							delete body.projectTeams;
							result = await sdk.projectsUpdate(id, body);
							break;
						}
						case 'delete':
							await sdk.projectsDelete(parseId.call(this, allParams.id));
							result = { success: true };
							break;
						case 'updateMeta': {
							const id = parseId.call(this, allParams.id);
							const meta: Record<string, any> = {};
							meta[allParams.metaName] = allParams.metaValue;
							result = await sdk.projectsUpdateMeta(id, meta);
							break;
						}
						case 'getRates':
							result = await sdk.projectsGetRates(parseId.call(this, allParams.id));
							break;
						case 'addRate': {
							const id = parseId.call(this, allParams.id);
							const body = buildBody(allParams, ['rateUser', 'rate', 'internalRate', 'isFixed']);
							body.user = body.rateUser;
							delete body.rateUser;
							result = await sdk.projectsCreateRate(id, body);
							break;
						}
						case 'deleteRate': {
							const id = parseId.call(this, allParams.id);
							const rateId = parseId.call(this, allParams.rateId);
							await sdk.projectsDeleteRate(id, rateId);
							result = { success: true };
							break;
						}
						case 'getComments':
							result = await sdk.projectsListComments(parseId.call(this, allParams.id));
							break;
						case 'addComment': {
							const id = parseId.call(this, allParams.id);
							result = await sdk.projectsCreateComment(id, { message: allParams.commentText });
							break;
						}
						case 'deleteComment': {
							const id = parseId.call(this, allParams.id);
							const commentId = parseId.call(this, allParams.commentId);
							await sdk.projectsDeleteComment(id, commentId);
							result = { success: true };
							break;
						}
						case 'togglePin': {
							const id = parseId.call(this, allParams.id);
							const commentId = parseId.call(this, allParams.commentId);
							result = await sdk.projectsPinComment(id, commentId);
							break;
						}
						case 'addTeam':
							result = await sdk.projectsAddToTeam(parseId.call(this, allParams.id));
							break;
						default:
							throw new NodeOperationError(this, `Operation "${operation}" not supported for project`);
					}
				}
				// ==================== Timesheets ====================
				else if (resource === 'timesheet') {
					switch (operation) {
						case 'getAll':
							result = await sdk.timesheetsList(allParams);
							break;
						case 'get':
							result = await sdk.timesheetsGetById(parseId.call(this, allParams.id));
							break;
						case 'create': {
							const tags = allParams.tags;
							const tagsStr = tags ? Object.keys(tags).join(',') : undefined;
							const body = buildBody(allParams, [
								'begin', 'end', 'project', 'activity', 'description',
								'fixedRate', 'hourlyRate', 'user', 'exported', 'billable',
							]);
							if (tagsStr) body.tags = tagsStr;
							result = await sdk.timesheetsCreate(body, allParams.full);
							break;
						}
						case 'update': {
							const id = parseId.call(this, allParams.id);
							const tags = allParams.tags;
							const tagsStr = tags ? Object.keys(tags).join(',') : undefined;
							const body = buildBody(allParams, [
								'begin', 'end', 'project', 'activity', 'description',
								'fixedRate', 'hourlyRate', 'user', 'exported', 'billable',
							]);
							if (tagsStr) body.tags = tagsStr;
							result = await sdk.timesheetsUpdate(id, body);
							break;
						}
						case 'delete':
							await sdk.timesheetsDelete(parseId.call(this, allParams.id));
							result = { success: true };
							break;
						case 'stop':
							result = await sdk.timesheetsStop(parseId.call(this, allParams.id));
							break;
						case 'restart': {
							const id = parseId.call(this, allParams.id);
							const body = buildBody(allParams, ['copy', 'begin']);
							result = await sdk.timesheetsRestart(id, body);
							break;
						}
						case 'duplicate':
							result = await sdk.timesheetsDuplicate(parseId.call(this, allParams.id));
							break;
						case 'toggleExport':
							result = await sdk.timesheetsToggleExport(parseId.call(this, allParams.id));
							break;
						case 'updateMeta': {
							const id = parseId.call(this, allParams.id);
							const meta: Record<string, any> = {};
							meta[allParams.metaName] = allParams.metaValue;
							result = await sdk.timesheetsUpdateMeta(id, meta);
							break;
						}
						case 'getActive':
							result = await sdk.timesheetsGetActive();
							break;
						case 'getRecent':
							result = await sdk.timesheetsGetRecent(allParams);
							break;
						default:
							throw new NodeOperationError(this, `Operation "${operation}" not supported for timesheet`);
					}
				}
				// ==================== Users ====================
				else if (resource === 'user') {
					switch (operation) {
						case 'getAll':
							result = await sdk.usersList(allParams);
							break;
						case 'get':
							result = await sdk.usersGetById(parseId.call(this, allParams.id));
							break;
						case 'getMe':
							result = await sdk.usersGetMe();
							break;
						case 'create': {
							const body = buildBody(allParams, [
								'username', 'alias', 'title', 'accountNumber', 'color',
								'email', 'language', 'locale', 'timezone', 'supervisor',
								'roles', 'plainPassword', 'plainApiToken',
								'enabled', 'systemAccount', 'requiresPasswordReset',
							]);
							result = await sdk.usersCreate(body);
							break;
						}
						case 'update': {
							const id = parseId.call(this, allParams.id);
							const body = buildBody(allParams, [
								'alias', 'title', 'accountNumber', 'color', 'email',
								'language', 'locale', 'timezone', 'supervisor', 'roles',
								'enabled', 'systemAccount', 'requiresPasswordReset',
							]);
							result = await sdk.usersUpdate(id, body);
							break;
						}
						case 'updatePreferences': {
							const id = parseId.call(this, allParams.id);
							const prefs = Array.isArray(allParams.preferences)
								? allParams.preferences
								: JSON.parse(allParams.preferences || '[]');
							result = await sdk.usersUpdatePreferences(id, prefs);
							break;
						}
						case 'deleteApiToken': {
							const tokenId = parseId.call(this, allParams.tokenId);
							await sdk.usersDeleteApiToken(tokenId);
							result = { success: true };
							break;
						}
						default:
							throw new NodeOperationError(this, `Operation "${operation}" not supported for user`);
					}
				}
				// ==================== Tags ====================
				else if (resource === 'tag') {
					switch (operation) {
						case 'getAll':
							result = await sdk.tagsList(allParams);
							break;
						case 'create': {
							const body = buildBody(allParams, ['name', 'color', 'visible']);
							result = await sdk.tagsCreate(body);
							break;
						}
						case 'delete':
							await sdk.tagsDelete(parseId.call(this, allParams.id));
							result = { success: true };
							break;
						default:
							throw new NodeOperationError(this, `Operation "${operation}" not supported for tag`);
					}
				}
				// ==================== Teams ====================
				else if (resource === 'team') {
					switch (operation) {
						case 'getAll':
							result = await sdk.teamsList();
							break;
						case 'get':
							result = await sdk.teamsGetById(parseId.call(this, allParams.id));
							break;
						case 'create': {
							const members = Array.isArray(allParams.members)
								? allParams.members
								: JSON.parse(allParams.members || '[]');
							const body = buildBody(allParams, ['name', 'color']);
							body.members = members;
							result = await sdk.teamsCreate(body);
							break;
						}
						case 'update': {
							const id = parseId.call(this, allParams.id);
							const members = allParams.members
								? (Array.isArray(allParams.members)
									? allParams.members
									: JSON.parse(allParams.members || '[]'))
								: undefined;
							const body = buildBody(allParams, ['name', 'color']);
							if (members !== undefined) body.members = members;
							result = await sdk.teamsUpdate(id, body);
							break;
						}
						case 'delete':
							await sdk.teamsDelete(parseId.call(this, allParams.id));
							result = { success: true };
							break;
						case 'addMember': {
							const teamId = parseId.call(this, allParams.id);
							const userId = parseId.call(this, allParams.userId);
							result = await sdk.teamsAddMember(teamId, userId);
							break;
						}
						case 'removeMember': {
							const teamId = parseId.call(this, allParams.id);
							const userId = parseId.call(this, allParams.userId);
							await sdk.teamsRemoveMember(teamId, userId);
							result = { success: true };
							break;
						}
						case 'grantCustomer': {
							const teamId = parseId.call(this, allParams.id);
							const customerId = parseId.call(this, allParams.customerId);
							result = await sdk.teamsGrantCustomerAccess(teamId, customerId);
							break;
						}
						case 'revokeCustomer': {
							const teamId = parseId.call(this, allParams.id);
							const customerId = parseId.call(this, allParams.customerId);
							await sdk.teamsRevokeCustomerAccess(teamId, customerId);
							result = { success: true };
							break;
						}
						case 'grantProject': {
							const teamId = parseId.call(this, allParams.id);
							const projectId = parseId.call(this, allParams.projectId);
							result = await sdk.teamsGrantProjectAccess(teamId, projectId);
							break;
						}
						case 'revokeProject': {
							const teamId = parseId.call(this, allParams.id);
							const projectId = parseId.call(this, allParams.projectId);
							await sdk.teamsRevokeProjectAccess(teamId, projectId);
							result = { success: true };
							break;
						}
						case 'grantActivity': {
							const teamId = parseId.call(this, allParams.id);
							const activityId = parseId.call(this, allParams.activityId);
							result = await sdk.teamsGrantActivityAccess(teamId, activityId);
							break;
						}
						case 'revokeActivity': {
							const teamId = parseId.call(this, allParams.id);
							const activityId = parseId.call(this, allParams.activityId);
							await sdk.teamsRevokeActivityAccess(teamId, activityId);
							result = { success: true };
							break;
						}
						default:
							throw new NodeOperationError(this, `Operation "${operation}" not supported for team`);
					}
				}
				// ==================== Invoices ====================
				else if (resource === 'invoice') {
					switch (operation) {
						case 'getAll':
							result = await sdk.invoicesList(allParams);
							break;
						case 'get':
							result = await sdk.invoicesGetById(parseId.call(this, allParams.id));
							break;
						case 'updateCustomFields': {
							const id = parseId.call(this, allParams.id);
							const fields = Array.isArray(allParams.customFields)
								? allParams.customFields
								: JSON.parse(allParams.customFields || '[]');
							result = await sdk.invoicesUpdateCustomFields(id, fields);
							break;
						}
						case 'download': {
							const id = parseId.call(this, allParams.id);
							const buffer = await sdk.invoicesDownload(id);
							const binaryData = await this.helpers.prepareBinaryData(buffer, `invoice-${id}.pdf`, 'application/pdf');
							returnData.push({ json: { id }, binary: { data: binaryData } });
							continue; // Skip normal toItems conversion for binary result
						}
						default:
							throw new NodeOperationError(this, `Operation "${operation}" not supported for invoice`);
					}
				}
				// ==================== Default/System ====================
				else if (resource === 'default') {
					switch (operation) {
						case 'ping':
							result = await sdk.pingRaw();
							break;
						case 'getVersion':
							result = await sdk.getVersion();
							break;
						case 'getPlugins':
							result = await sdk.getPlugins();
							break;
						case 'getTimesheetConfig':
							result = await sdk.getTimesheetConfig();
							break;
						case 'getColors':
							result = await sdk.getColors();
							break;
						case 'getNextWeek':
							result = await sdk.nextWeek(allParams);
							break;
						case 'getOvertimeYear':
							result = await sdk.overtimeYear(allParams);
							break;
						case 'getWeekStatus':
							result = await sdk.weekStatus(allParams);
							break;
						case 'getWeeklyOvertime':
							result = await sdk.weeklyOvertime(allParams);
							break;
						case 'addToApprove': {
							const user = allParams.userId ? Number(allParams.userId) : undefined;
							result = await sdk.addToApprove({ user, date: allParams.date });
							break;
						}
						default:
							throw new NodeOperationError(this, `Operation "${operation}" not supported for default`);
					}
				}
				else {
					throw new NodeOperationError(this, `Resource "${resource}" not supported`);
				}
			} catch (error) {
				// Re-throw NodeOperationErrors as-is
				if (error instanceof NodeOperationError) {
					throw error;
				}
				// Wrap other errors
				const message = error instanceof Error ? error.message : String(error);
				throw new NodeOperationError(this, `SDK error: ${message}`);
			}

			// Convert result to n8n items (skip for binary results handled above)
			returnData.push(...toItems(result));
		}

		return [returnData];
	}
}

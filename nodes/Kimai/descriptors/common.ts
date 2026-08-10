import type { INodeProperties } from 'n8n-workflow';

/**
 * Creates an ID parameter for a resource
 */
export function createIdParameter(
	displayName: string,
	resource: string,
	operations: string[],
): INodeProperties {
	return {
		displayName,
		name: 'id',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: [resource],
				operation: operations,
			},
		},
		default: '',
	};
}

/**
 * Creates a string parameter
 */
export function createStringParameter(
	displayName: string,
	name: string,
	resource: string,
	operations: string[],
	options?: {
		required?: boolean;
		description?: string;
		defaultValue?: string;
	},
): INodeProperties {
	const param: INodeProperties = {
		displayName,
		name,
		type: 'string',
		displayOptions: {
			show: {
				resource: [resource],
				operation: operations,
			},
		},
		default: options?.defaultValue ?? '',
	};
	if (options?.required) {
		param.required = true;
	}
	if (options?.description) {
		param.description = options.description;
	}
	return param;
}

/**
 * Creates a boolean parameter
 */
export function createBooleanParameter(
	displayName: string,
	name: string,
	resource: string,
	operations: string[],
	defaultValue: boolean,
): INodeProperties {
	return {
		displayName,
		name,
		type: 'boolean',
		displayOptions: {
			show: {
				resource: [resource],
				operation: operations,
			},
		},
		default: defaultValue,
	};
}

/**
 * Creates common query parameters for list operations
 */
export function createCommonQueryParams(
	resource: string,
	operation: string,
	orderByOptions: Array<{ name: string; value: string }>,
): INodeProperties[] {
	return [
		{
			displayName: 'Order By',
			name: 'orderBy',
			type: 'options',
			options: orderByOptions,
			displayOptions: {
				show: {
					resource: [resource],
					operation: [operation],
				},
			},
			default: 'name',
		},
		{
			displayName: 'Order',
			name: 'order',
			type: 'options',
			options: [
				{ name: 'Ascending', value: 'ASC' },
				{ name: 'Descending', value: 'DESC' },
			],
			displayOptions: {
				show: {
					resource: [resource],
					operation: [operation],
				},
			},
			default: 'ASC',
		},
		{
			displayName: 'Search Term',
			name: 'term',
			type: 'string',
			displayOptions: {
				show: {
					resource: [resource],
					operation: [operation],
				},
			},
			default: '',
		},
	];
}

/**
 * Creates budget-related parameters
 */
export function createBudgetParameters(resource: string, operations: string[]): INodeProperties[] {
	return [
		{
			displayName: 'Budget',
			name: 'budget',
			type: 'string',
			description: 'The money budget',
			displayOptions: {
				show: {
					resource: [resource],
					operation: operations,
				},
			},
			default: '',
		},
		{
			displayName: 'Time Budget',
			name: 'timeBudget',
			type: 'string',
			description: 'Duration (e.g., 01:30 for 1 hour 30 minutes)',
			displayOptions: {
				show: {
					resource: [resource],
					operation: operations,
				},
			},
			default: '',
		},
		{
			displayName: 'Budget Type',
			name: 'budgetType',
			type: 'options',
			description: 'The type of budget (only submit if monthly budget)',
			options: [
				{ name: 'Default', value: '' },
				{ name: 'Monthly', value: 'month' },
			],
			displayOptions: {
				show: {
					resource: [resource],
					operation: operations,
				},
			},
			default: '',
		},
	];
}

/**
 * Creates rate-related parameters for addRate operations
 */
export function createRateParameters(resource: string, operations: string[]): INodeProperties[] {
	return [
		{
			displayName: 'Rate',
			name: 'rate',
			type: 'number',
			required: true,
			displayOptions: {
				show: {
					resource: [resource],
					operation: operations,
				},
			},
			default: 0,
		},
		{
			displayName: 'Rate User ID',
			name: 'rateUser',
			type: 'string',
			displayOptions: {
				show: {
					resource: [resource],
					operation: operations,
				},
			},
			default: '',
		},
		{
			displayName: 'Internal Rate',
			name: 'internalRate',
			type: 'number',
			displayOptions: {
				show: {
					resource: [resource],
					operation: operations,
				},
			},
			default: 0,
		},
		{
			displayName: 'Is Fixed',
			name: 'isFixed',
			type: 'boolean',
			displayOptions: {
				show: {
					resource: [resource],
					operation: operations,
				},
			},
			default: false,
		},
	];
}

/**
 * Creates rate ID parameter for deleteRate operations
 */
export function createRateIdParameter(resource: string, operations: string[]): INodeProperties {
	return {
		displayName: 'Rate ID',
		name: 'rateId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: [resource],
				operation: operations,
			},
		},
		default: '',
	};
}

/**
 * Creates meta field parameters for updateMeta operations
 */
export function createMetaParameters(resource: string, operations: string[]): INodeProperties[] {
	return [
		{
			displayName: 'Meta Field Name',
			name: 'metaName',
			type: 'string',
			required: true,
			displayOptions: {
				show: {
					resource: [resource],
					operation: operations,
				},
			},
			default: '',
		},
		{
			displayName: 'Meta Field Value',
			name: 'metaValue',
			type: 'string',
			required: true,
			displayOptions: {
				show: {
					resource: [resource],
					operation: operations,
				},
			},
			default: '',
		},
	];
}

/**
 * Creates comment-related parameters
 */
export function createCommentParameters(
	resource: string,
	addCommentOps: string[],
	deleteOrPinOps: string[],
): INodeProperties[] {
	return [
		{
			displayName: 'Comment Text',
			name: 'commentText',
			type: 'string',
			required: true,
			displayOptions: {
				show: {
					resource: [resource],
					operation: addCommentOps,
				},
			},
			default: '',
		},
		{
			displayName: 'Comment ID',
			name: 'commentId',
			type: 'string',
			required: true,
			displayOptions: {
				show: {
					resource: [resource],
					operation: deleteOrPinOps,
				},
			},
			default: '',
		},
	];
}

/**
 * Creates team ID parameter
 */
export function createTeamIdParameter(resource: string, operations: string[]): INodeProperties {
	return {
		displayName: 'Team ID',
		name: 'teamId',
		type: 'string',
		displayOptions: {
			show: {
				resource: [resource],
				operation: operations,
			},
		},
		default: '',
	};
}

/**
 * Creates visible options parameter for getAll operations
 */
export function createVisibleOptions(
	resource: string,
	operation: string,
	values: Array<{ name: string; value: string }>,
	defaultValue: string,
): INodeProperties {
	return {
		displayName: 'Visible',
		name: 'visible',
		type: 'options',
		options: values,
		displayOptions: {
			show: {
				resource: [resource],
				operation: [operation],
			},
		},
		default: defaultValue,
	};
}

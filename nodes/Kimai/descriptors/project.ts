import type { INodeProperties } from 'n8n-workflow';
import type { ResourceDescriptor } from './types';
import {
	createIdParameter,
	createBudgetParameters,
	createRateParameters,
	createRateIdParameter,
	createMetaParameters,
	createCommentParameters,
	createTeamIdParameter,
} from './common';

const resource = 'project';

export const projectDescriptor: ResourceDescriptor = {
	resource,
	defaultOperation: 'getAll',
	operations: [
		{
			name: 'Create',
			value: 'create',
			action: 'Create a project',
			routing: {
				request: {
					method: 'POST',
					url: '/api/projects',
					body: {
						name: '={{$parameter["name"]}}',
						customer: '={{$parameter["customer"]}}',
						number: '={{$parameter["number"] || undefined}}',
						comment: '={{$parameter["comment"] || undefined}}',
						invoiceText: '={{$parameter["invoiceText"] || undefined}}',
						orderNumber: '={{$parameter["orderNumber"] || undefined}}',
						orderDate: '={{$parameter["orderDate"] || undefined}}',
						start: '={{$parameter["start"] || undefined}}',
						end: '={{$parameter["end"] || undefined}}',
						color: '={{$parameter["color"] || undefined}}',
						teams: '={{$parameter["projectTeams"] || undefined}}',
						budget: '={{$parameter["budget"] || undefined}}',
						timeBudget: '={{$parameter["timeBudget"] || undefined}}',
						budgetType: '={{$parameter["budgetType"] || undefined}}',
						globalActivities: '={{$parameter["globalActivities"] ?? true}}',
						visible: '={{$parameter["visible"] ?? true}}',
						billable: '={{$parameter["billable"] ?? true}}',
					},
				},
			},
		},
		{
			name: 'Delete',
			value: 'delete',
			action: 'Delete a project',
			routing: {
				request: {
					method: 'DELETE',
					url: '=/api/projects/{{$parameter["id"]}}',
				},
			},
		},
		{
			name: 'Get',
			value: 'get',
			action: 'Get a project',
			routing: {
				request: {
					method: 'GET',
					url: '=/api/projects/{{$parameter["id"]}}',
				},
			},
		},
		{
			name: 'Get All',
			value: 'getAll',
			action: 'Get all projects',
			routing: {
				request: {
					method: 'GET',
					url: '/api/projects',
					qs: {
						customer: '={{$parameter["customer"] || undefined}}',
						visible: '={{$parameter["visible"] || undefined}}',
						start: '={{$parameter["start"] || undefined}}',
						end: '={{$parameter["end"] || undefined}}',
						ignoreDates: '={{$parameter["ignoreDates"] || undefined}}',
						globalActivities: '={{$parameter["globalActivities"] ?? undefined}}',
						order: '={{$parameter["order"] || undefined}}',
						orderBy: '={{$parameter["orderBy"] || undefined}}',
						term: '={{$parameter["term"] || undefined}}',
					},
				},
			},
		},
		{
			name: 'Update',
			value: 'update',
			action: 'Update a project',
			routing: {
				request: {
					method: 'PATCH',
					url: '=/api/projects/{{$parameter["id"]}}',
					body: {
						name: '={{$parameter["name"] || undefined}}',
						customer: '={{$parameter["customer"] || undefined}}',
						number: '={{$parameter["number"] || undefined}}',
						comment: '={{$parameter["comment"] || undefined}}',
						invoiceText: '={{$parameter["invoiceText"] || undefined}}',
						orderNumber: '={{$parameter["orderNumber"] || undefined}}',
						orderDate: '={{$parameter["orderDate"] || undefined}}',
						start: '={{$parameter["start"] || undefined}}',
						end: '={{$parameter["end"] || undefined}}',
						color: '={{$parameter["color"] || undefined}}',
						teams: '={{$parameter["projectTeams"] || undefined}}',
						budget: '={{$parameter["budget"] ?? undefined}}',
						timeBudget: '={{$parameter["timeBudget"] || undefined}}',
						budgetType: '={{$parameter["budgetType"] ?? undefined}}',
						globalActivities: '={{$parameter["globalActivities"] ?? undefined}}',
						visible: '={{$parameter["visible"] ?? undefined}}',
						billable: '={{$parameter["billable"] ?? undefined}}',
					},
				},
			},
		},
		{
			name: 'Update Meta',
			value: 'updateMeta',
			action: 'Update project custom field',
			routing: {
				request: {
					method: 'PATCH',
					url: '=/api/projects/{{$parameter["id"]}}/meta',
					body: {
						name: '={{$parameter["metaName"]}}',
						value: '={{$parameter["metaValue"]}}',
					},
				},
			},
		},
		{
			name: 'Get Rates',
			value: 'getRates',
			action: 'Get project rates',
			routing: {
				request: {
					method: 'GET',
					url: '=/api/projects/{{$parameter["id"]}}/rates',
				},
			},
		},
		{
			name: 'Add Rate',
			value: 'addRate',
			action: 'Add rate for project',
			routing: {
				request: {
					method: 'POST',
					url: '=/api/projects/{{$parameter["id"]}}/rates',
					body: {
						user: '={{$parameter["rateUser"] || undefined}}',
						rate: '={{$parameter["rate"]}}',
						internalRate: '={{$parameter["internalRate"] || undefined}}',
						isFixed: '={{$parameter["isFixed"] ?? false}}',
					},
				},
			},
		},
		{
			name: 'Get Comments',
			value: 'getComments',
			action: 'Get comments for project',
			routing: {
				request: {
					method: 'GET',
					url: '=/api/projects/{{$parameter["id"]}}/comments',
				},
			},
		},
		{
			name: 'Add Comment',
			value: 'addComment',
			action: 'Add comment for project',
			routing: {
				request: {
					method: 'POST',
					url: '=/api/projects/{{$parameter["id"]}}/comments',
					body: {
						message: '={{$parameter["commentText"]}}',
					},
				},
			},
		},
		{
			name: 'Delete Comment',
			value: 'deleteComment',
			action: 'Delete project comment',
			routing: {
				request: {
					method: 'DELETE',
					url: '=/api/projects/{{$parameter["id"]}}/comments/{{$parameter["commentId"]}}',
				},
			},
		},
		{
			name: 'Toggle Pin Comment',
			value: 'togglePin',
			action: 'Toggle comment pin state',
			routing: {
				request: {
					method: 'PATCH',
					url: '=/api/projects/{{$parameter["id"]}}/comments/{{$parameter["commentId"]}}/pin',
				},
			},
		},
		{
			name: 'Add Team',
			value: 'addTeam',
			action: 'Create default team for project',
			routing: {
				request: {
					method: 'POST',
					url: '=/api/projects/{{$parameter["id"]}}/team',
				},
			},
		},
		{
			name: 'Delete Rate',
			value: 'deleteRate',
			action: 'Delete rate for project',
			routing: {
				request: {
					method: 'DELETE',
					url: '=/api/projects/{{$parameter["id"]}}/rates/{{$parameter["rateId"]}}',
				},
			},
		},
	],
	parameters: [
		createIdParameter('Project ID', resource, [
			'get',
			'update',
			'delete',
			'updateMeta',
			'getRates',
			'addRate',
			'deleteRate',
			'getComments',
			'addComment',
			'deleteComment',
			'togglePin',
			'addTeam',
		]),
		{
			displayName: 'Name',
			name: 'name',
			type: 'string',
			required: true,
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['create', 'update'],
				},
			},
			default: '',
		},
		{
			displayName: 'Customer ID',
			name: 'customer',
			type: 'string',
			required: true,
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['create'],
				},
			},
			default: '',
		},
		{
			displayName: 'Customer ID',
			name: 'customer',
			type: 'string',
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['getAll', 'update'],
				},
			},
			default: '',
		},
		{
			displayName: 'Customers',
			name: 'customers',
			type: 'string',
			description: 'Comma-separated list of customer IDs',
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['getAll'],
				},
			},
			default: '',
			routing: {
				send: {
					type: 'query',
					property: 'customers[]',
					value: '={{$value ? $value.split(",").map(v => v.trim()).filter(v => v) : undefined}}',
				},
			},
		},
		{
			displayName: 'Visible',
			name: 'visible',
			type: 'options',
			options: [
				{ name: 'Visible', value: '1' },
				{ name: 'Hidden', value: '2' },
				{ name: 'Both', value: '3' },
			],
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['getAll'],
				},
			},
			default: '1',
		},
		{
			displayName: 'Start Date',
			name: 'start',
			type: 'dateTime',
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['getAll', 'create', 'update'],
				},
			},
			default: '',
		},
		{
			displayName: 'End Date',
			name: 'end',
			type: 'dateTime',
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['getAll', 'create', 'update'],
				},
			},
			default: '',
		},
		{
			displayName: 'Ignore Dates',
			name: 'ignoreDates',
			type: 'boolean',
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['getAll'],
				},
			},
			default: false,
			routing: {
				send: {
					type: 'query',
					property: 'ignoreDates',
					value: '={{$value ? "1" : ""}}',
				},
			},
		},
		{
			displayName: 'Global Activities',
			name: 'globalActivities',
			type: 'boolean',
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['getAll', 'create', 'update'],
				},
			},
			default: true,
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
					operation: ['getAll'],
				},
			},
			default: 'ASC',
		},
		{
			displayName: 'Order By',
			name: 'orderBy',
			type: 'options',
			options: [
				{ name: 'ID', value: 'id' },
				{ name: 'Name', value: 'name' },
				{ name: 'Customer', value: 'customer' },
			],
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['getAll'],
				},
			},
			default: 'name',
		},
		{
			displayName: 'Search Term',
			name: 'term',
			type: 'string',
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['getAll'],
				},
			},
			default: '',
		},
		{
			displayName: 'Number',
			name: 'number',
			type: 'string',
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['create', 'update'],
				},
			},
			default: '',
		},
		{
			displayName: 'Comment',
			name: 'comment',
			type: 'string',
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['create', 'update'],
				},
			},
			default: '',
		},
		{
			displayName: 'Invoice Text',
			name: 'invoiceText',
			type: 'string',
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['create', 'update'],
				},
			},
			default: '',
		},
		{
			displayName: 'Order Number',
			name: 'orderNumber',
			type: 'string',
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['create', 'update'],
				},
			},
			default: '',
		},
		{
			displayName: 'Order Date',
			name: 'orderDate',
			type: 'dateTime',
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['create', 'update'],
				},
			},
			default: '',
		},
		{
			displayName: 'Color',
			name: 'color',
			type: 'string',
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['create', 'update'],
				},
			},
			default: '',
		},
		{
			displayName: 'Visible',
			name: 'visible',
			type: 'boolean',
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['create', 'update'],
				},
			},
			default: true,
		},
		{
			displayName: 'Billable',
			name: 'billable',
			type: 'boolean',
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['create', 'update'],
				},
			},
			default: true,
		},
		{
			displayName: 'Teams',
			name: 'projectTeams',
			type: 'json',
			description: 'Array of Team IDs',
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['create', 'update'],
				},
			},
			default: '',
		},
		...createBudgetParameters(resource, ['create', 'update']),
		...createMetaParameters(resource, ['updateMeta']),
		...createRateParameters(resource, ['addRate']),
		createRateIdParameter(resource, ['deleteRate']),
		...createCommentParameters(resource, ['addComment'], ['deleteComment', 'togglePin']),
		createTeamIdParameter(resource, ['addTeam']),
	],
};

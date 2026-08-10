import type { INodeProperties } from 'n8n-workflow';
import type { ResourceDescriptor } from './types';
import {
	createIdParameter,
	createBudgetParameters,
	createRateParameters,
	createRateIdParameter,
	createMetaParameters,
	createTeamIdParameter,
} from './common';

const resource = 'activity';

export const activityDescriptor: ResourceDescriptor = {
	resource,
	defaultOperation: 'getAll',
	operations: [
		{
			name: 'Create',
			value: 'create',
			action: 'Create an activity',
			routing: {
				request: {
					method: 'POST',
					url: '/api/activities',
					body: {
						name: '={{$parameter["name"]}}',
						project: '={{$parameter["project"] || undefined}}',
						teams: '={{$parameter["teams"] || undefined}}',
						number: '={{$parameter["number"] || undefined}}',
						comment: '={{$parameter["comment"] || undefined}}',
						visible: '={{$parameter["visible"] ?? true}}',
						billable: '={{$parameter["billable"] ?? true}}',
						color: '={{$parameter["color"] || undefined}}',
						invoiceText: '={{$parameter["invoiceText"] || undefined}}',
						budget: '={{$parameter["budget"] || undefined}}',
						timeBudget: '={{$parameter["timeBudget"] || undefined}}',
						budgetType: '={{$parameter["budgetType"] || undefined}}',
					},
				},
			},
		},
		{
			name: 'Delete',
			value: 'delete',
			action: 'Delete an activity',
			routing: {
				request: {
					method: 'DELETE',
					url: '=/api/activities/{{$parameter["id"]}}',
				},
			},
		},
		{
			name: 'Get',
			value: 'get',
			action: 'Get an activity',
			routing: {
				request: {
					method: 'GET',
					url: '=/api/activities/{{$parameter["id"]}}',
				},
			},
		},
		{
			name: 'Get All',
			value: 'getAll',
			action: 'Get all activities',
			routing: {
				request: {
					method: 'GET',
					url: '/api/activities',
					qs: {
						project: '={{$parameter["project"] || undefined}}',
						visible: '={{$parameter["visible"] || undefined}}',
						globals: '={{$parameter["globals"] || undefined}}',
						orderBy: '={{$parameter["orderBy"] || undefined}}',
						order: '={{$parameter["order"] || undefined}}',
						term: '={{$parameter["term"] || undefined}}',
					},
				},
			},
		},
		{
			name: 'Update',
			value: 'update',
			action: 'Update an activity',
			routing: {
				request: {
					method: 'PATCH',
					url: '=/api/activities/{{$parameter["id"]}}',
					body: {
						name: '={{$parameter["name"] || undefined}}',
						project: '={{$parameter["project"] || undefined}}',
						teams: '={{$parameter["teams"] || undefined}}',
						number: '={{$parameter["number"] || undefined}}',
						comment: '={{$parameter["comment"] || undefined}}',
						visible: '={{$parameter["visible"] ?? undefined}}',
						billable: '={{$parameter["billable"] ?? undefined}}',
						color: '={{$parameter["color"] || undefined}}',
						invoiceText: '={{$parameter["invoiceText"] || undefined}}',
						budget: '={{$parameter["budget"] ?? undefined}}',
						timeBudget: '={{$parameter["timeBudget"] || undefined}}',
						budgetType: '={{$parameter["budgetType"] ?? undefined}}',
					},
				},
			},
		},
		{
			name: 'Update Meta',
			value: 'updateMeta',
			action: 'Update activity custom field',
			routing: {
				request: {
					method: 'PATCH',
					url: '=/api/activities/{{$parameter["id"]}}/meta',
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
			action: 'Get activity rates',
			routing: {
				request: {
					method: 'GET',
					url: '=/api/activities/{{$parameter["id"]}}/rates',
				},
			},
		},
		{
			name: 'Add Rate',
			value: 'addRate',
			action: 'Add rate for activity',
			routing: {
				request: {
					method: 'POST',
					url: '=/api/activities/{{$parameter["id"]}}/rates',
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
			name: 'Add Team',
			value: 'addTeam',
			action: 'Create default team for activity',
			routing: {
				request: {
					method: 'POST',
					url: '=/api/activities/{{$parameter["id"]}}/team',
				},
			},
		},
		{
			name: 'Delete Rate',
			value: 'deleteRate',
			action: 'Delete rate for activity',
			routing: {
				request: {
					method: 'DELETE',
					url: '=/api/activities/{{$parameter["id"]}}/rates/{{$parameter["rateId"]}}',
				},
			},
		},
	],
	parameters: [
		createIdParameter('Activity ID', resource, [
			'get',
			'update',
			'delete',
			'updateMeta',
			'getRates',
			'addRate',
			'deleteRate',
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
			displayName: 'Project ID',
			name: 'project',
			type: 'string',
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['create', 'update', 'getAll'],
				},
			},
			default: '',
		},
		{
			displayName: 'Team ID',
			name: 'teams',
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
		{
			displayName: 'Projects',
			name: 'projects',
			type: 'string',
			description: 'Comma-separated list of project IDs',
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
					property: 'projects[]',
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
				{ name: 'All', value: '3' },
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
			displayName: 'Globals',
			name: 'globals',
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
					property: 'globals',
					value: '={{$value ? "1" : "0"}}',
				},
			},
		},
		{
			displayName: 'Order By',
			name: 'orderBy',
			type: 'options',
			options: [
				{ name: 'ID', value: 'id' },
				{ name: 'Name', value: 'name' },
				{ name: 'Project', value: 'project' },
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
		...createMetaParameters(resource, ['updateMeta']),
		...createBudgetParameters(resource, ['create', 'update']),
		...createRateParameters(resource, ['addRate']),
		createRateIdParameter(resource, ['deleteRate']),
		createTeamIdParameter(resource, ['addTeam']),
	],
};

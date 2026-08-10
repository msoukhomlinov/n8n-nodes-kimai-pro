import type { INodeProperties } from 'n8n-workflow';
import type { ResourceDescriptor } from './types';
import { createIdParameter, createMetaParameters } from './common';

const resource = 'timesheet';

export const timesheetDescriptor: ResourceDescriptor = {
	resource,
	defaultOperation: 'getAll',
	operations: [
		{
			name: 'Create',
			value: 'create',
			action: 'Create a timesheet',
			routing: {
				request: {
					method: 'POST',
					url: '/api/timesheets',
					qs: {
						full: '={{$parameter["full"]}}',
					},
					body: {
						begin: '={{$parameter["begin"]}}',
						end: '={{$parameter["end"] || undefined}}',
						project: '={{$parameter["project"]}}',
						activity: '={{$parameter["activity"]}}',
						description: '={{$parameter["description"] || undefined}}',
						fixedRate: '={{$parameter["fixedRate"] || undefined}}',
						hourlyRate: '={{$parameter["hourlyRate"] || undefined}}',
						user: '={{$parameter["user"] || undefined}}',
						tags: '={{Object.keys($parameter["tags"]).join(",") || undefined}}',
						exported: '={{$parameter["exported"] || undefined}}',
						billable: '={{$parameter["billable"] ?? true}}',
					},
				},
			},
		},
		{
			name: 'Delete',
			value: 'delete',
			action: 'Delete a timesheet',
			routing: {
				request: {
					method: 'DELETE',
					url: '=/api/timesheets/{{$parameter["id"]}}',
				},
			},
		},
		{
			name: 'Get',
			value: 'get',
			action: 'Get a timesheet',
			routing: {
				request: {
					method: 'GET',
					url: '=/api/timesheets/{{$parameter["id"]}}',
				},
			},
		},
		{
			name: 'Get All',
			value: 'getAll',
			action: 'Get all timesheets',
			routing: {
				request: {
					method: 'GET',
					url: '/api/timesheets',
					qs: {
						user: '={{$parameter["user"] || undefined}}',
						customer: '={{$parameter["customer"] || undefined}}',
						project: '={{$parameter["project"] || undefined}}',
						activity: '={{$parameter["activity"] || undefined}}',
						page: '={{$parameter["page"] || undefined}}',
						size: '={{$parameter["size"] || undefined}}',
						orderBy: '={{$parameter["orderBy"] || undefined}}',
						order: '={{$parameter["order"] || undefined}}',
						begin: '={{$parameter["begin"] || undefined}}',
						end: '={{$parameter["end"] || undefined}}',
						exported: '={{$parameter["exported"] || undefined}}',
						active: '={{$parameter["active"] || undefined}}',
						billable: '={{$parameter["billable"] || undefined}}',
						full: '={{$parameter["full"] || undefined}}',
						term: '={{$parameter["term"] || undefined}}',
						modified_after: '={{$parameter["modifiedAfter"] || undefined}}',
					},
				},
			},
		},
		{
			name: 'Update',
			value: 'update',
			action: 'Update a timesheet',
			routing: {
				request: {
					method: 'PATCH',
					url: '=/api/timesheets/{{$parameter["id"]}}',
					body: {
						begin: '={{$parameter["begin"] || undefined}}',
						end: '={{$parameter["end"] || undefined}}',
						project: '={{$parameter["project"] || undefined}}',
						activity: '={{$parameter["activity"] || undefined}}',
						description: '={{$parameter["description"] || undefined}}',
						fixedRate: '={{$parameter["fixedRate"] || undefined}}',
						hourlyRate: '={{$parameter["hourlyRate"] || undefined}}',
						user: '={{$parameter["user"] || undefined}}',
						tags: '={{Object.keys($parameter["tags"]).join(",") || undefined}}',
						exported: '={{$parameter["exported"] || undefined}}',
						billable: '={{$parameter["billable"] ?? undefined}}',
					},
				},
			},
		},
		{
			name: 'Stop',
			value: 'stop',
			action: 'Stop active timesheet',
			routing: {
				request: {
					method: 'PATCH',
					url: '=/api/timesheets/{{$parameter["id"]}}/stop',
				},
			},
		},
		{
			name: 'Restart',
			value: 'restart',
			action: 'Restart timesheet',
			routing: {
				request: {
					method: 'PATCH',
					url: '=/api/timesheets/{{$parameter["id"]}}/restart',
					body: {
						copy: '={{$parameter["copy"] || undefined}}',
						begin: '={{$parameter["begin"] || undefined}}',
					},
				},
			},
		},
		{
			name: 'Duplicate',
			value: 'duplicate',
			action: 'Duplicate timesheet',
			routing: {
				request: {
					method: 'PATCH',
					url: '=/api/timesheets/{{$parameter["id"]}}/duplicate',
				},
			},
		},
		{
			name: 'Toggle Export',
			value: 'toggleExport',
			action: 'Toggle timesheet export state',
			routing: {
				request: {
					method: 'PATCH',
					url: '=/api/timesheets/{{$parameter["id"]}}/export',
				},
			},
		},
		{
			name: 'Update Meta',
			value: 'updateMeta',
			action: 'Update timesheet custom field',
			routing: {
				request: {
					method: 'PATCH',
					url: '=/api/timesheets/{{$parameter["id"]}}/meta',
					body: {
						name: '={{$parameter["metaName"]}}',
						value: '={{$parameter["metaValue"]}}',
					},
				},
			},
		},
		{
			name: 'Get Recent',
			value: 'getRecent',
			action: 'Get recent timesheets',
			routing: {
				request: {
					method: 'GET',
					url: '/api/timesheets/recent',
					qs: {
						begin: '={{$parameter["begin"]}}',
						size: '={{$parameter["size"]}}',
					},
				},
			},
		},
		{
			name: 'Get Active',
			value: 'getActive',
			action: 'Get active timesheets',
			routing: {
				request: {
					method: 'GET',
					url: '/api/timesheets/active',
				},
			},
		},
	],
	parameters: [
		createIdParameter('Timesheet ID', resource, [
			'get',
			'update',
			'delete',
			'stop',
			'restart',
			'duplicate',
			'toggleExport',
			'updateMeta',
		]),
		{
			displayName: 'Project ID',
			name: 'project',
			type: 'options',
			typeOptions: {
				loadOptionsMethod: 'getProjects',
				loadOptionsDependsOn: ['begin'],
			},
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
			displayName: 'Activity ID',
			name: 'activity',
			type: 'options',
			typeOptions: {
				loadOptionsMethod: 'getActivities',
				loadOptionsDependsOn: ['project'],
			},
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
			displayName: 'Begin',
			name: 'begin',
			type: 'dateTime',
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['create', 'update', 'restart', 'getAll', 'getRecent'],
				},
			},
			default: '',
		},
		{
			displayName: 'End',
			name: 'end',
			type: 'dateTime',
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['create', 'update', 'getAll'],
				},
			},
			default: '',
		},
		{
			displayName: 'Description',
			name: 'description',
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
			displayName: 'Fixed Rate',
			name: 'fixedRate',
			type: 'number',
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['create', 'update'],
				},
			},
			default: 0,
		},
		{
			displayName: 'Hourly Rate',
			name: 'hourlyRate',
			type: 'number',
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['create', 'update'],
				},
			},
			default: 0,
		},
		{
			displayName: 'User ID',
			name: 'user',
			type: 'options',
			typeOptions: {
				loadOptionsMethod: 'getUsers',
			},
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['create', 'update', 'getAll'],
				},
			},
			default: '',
		},
		{
			displayName: 'Users',
			name: 'users',
			type: 'string',
			description: 'Comma-separated list of user IDs',
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
					property: 'users[]',
					value: '={{$value ? $value.split(",").map(v => v.trim()).filter(v => v) : undefined}}',
				},
			},
		},
		{
			displayName: 'Customer ID',
			name: 'customer',
			type: 'options',
			typeOptions: {
				loadOptionsMethod: 'getCustomers',
			},
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['getAll'],
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
			displayName: 'Project ID',
			name: 'project',
			type: 'options',
			typeOptions: {
				loadOptionsMethod: 'getProjects',
			},
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['getAll'],
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
			displayName: 'Activity ID',
			name: 'activity',
			type: 'options',
			typeOptions: {
				loadOptionsMethod: 'getActivities',
				loadOptionsDependsOn: ['project'],
			},
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['getAll'],
				},
			},
			default: '',
		},
		{
			displayName: 'Activities',
			name: 'activities',
			type: 'string',
			description: 'Comma-separated list of activity IDs',
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
					property: 'activities[]',
					value: '={{$value ? $value.split(",").map(v => v.trim()).filter(v => v) : undefined}}',
				},
			},
		},
		{
			displayName: 'Page',
			name: 'page',
			type: 'number',
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['getAll'],
				},
			},
			default: 1,
		},
		{
			displayName: 'Size',
			name: 'size',
			type: 'number',
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['getAll', 'getRecent'],
				},
			},
			default: 50,
		},
		{
			displayName: 'Tags',
			name: 'tags',
			type: 'multiOptions',
			typeOptions: {
				loadOptionsMethod: 'getTags',
			},
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['create', 'update', 'getAll'],
				},
			},
			default: {},
			routing: {
				send: {
					type: 'query',
					property: 'tags[]',
					value: '={{Object.keys($parameter["tags"])}}',
				},
			},
		},
		{
			displayName: 'Order By',
			name: 'orderBy',
			type: 'options',
			options: [
				{ name: 'ID', value: 'id' },
				{ name: 'Begin', value: 'begin' },
				{ name: 'End', value: 'end' },
				{ name: 'Rate', value: 'rate' },
			],
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['getAll'],
				},
			},
			default: 'begin',
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
			default: 'DESC',
		},
		{
			displayName: 'Exported',
			name: 'exported',
			type: 'options',
			options: [
				{ name: 'All', value: '' },
				{ name: 'Not Exported', value: '0' },
				{ name: 'Exported', value: '1' },
			],
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['getAll'],
				},
			},
			default: '',
		},
		{
			displayName: 'Active',
			name: 'active',
			type: 'options',
			options: [
				{ name: 'All', value: '' },
				{ name: 'Stopped', value: '0' },
				{ name: 'Active', value: '1' },
			],
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['getAll'],
				},
			},
			default: '',
		},
		{
			displayName: 'Billable',
			name: 'billable',
			type: 'options',
			options: [
				{ name: 'All', value: '' },
				{ name: 'Non-Billable', value: '0' },
				{ name: 'Billable', value: '1' },
			],
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['getAll'],
				},
			},
			default: '',
		},
		{
			displayName: 'Full',
			name: 'full',
			type: 'boolean',
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['create', 'getAll'],
				},
			},
			default: false,
			routing: {
				send: {
					type: 'query',
					property: 'full',
					value: '={{$value ? "1" : "0"}}',
				},
			},
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
			displayName: 'Modified After',
			name: 'modifiedAfter',
			type: 'dateTime',
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['getAll'],
				},
			},
			default: '',
		},
		{
			displayName: 'Exported',
			name: 'exported',
			type: 'boolean',
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['create', 'update'],
				},
			},
			default: false,
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
			displayName: 'Copy',
			name: 'copy',
			type: 'string',
			description: 'Set to "all" to copy all data',
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['restart'],
				},
			},
			default: '',
		},
		...createMetaParameters(resource, ['updateMeta']),
	],
};

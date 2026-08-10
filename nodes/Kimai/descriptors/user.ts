import type { INodeProperties } from 'n8n-workflow';
import type { ResourceDescriptor } from './types';
import { createIdParameter } from './common';

const resource = 'user';

export const userDescriptor: ResourceDescriptor = {
	resource,
	defaultOperation: 'getAll',
	operations: [
		{
			name: 'Create',
			value: 'create',
			action: 'Create a user',
			routing: {
				request: {
					method: 'POST',
					url: '/api/users',
					body: {
						username: '={{$parameter["username"]}}',
						alias: '={{$parameter["alias"] || undefined}}',
						title: '={{$parameter["title"] || undefined}}',
						accountNumber: '={{$parameter["accountNumber"] || undefined}}',
						color: '={{$parameter["color"] || undefined}}',
						email: '={{$parameter["email"]}}',
						language: '={{$parameter["language"]}}',
						locale: '={{$parameter["locale"]}}',
						timezone: '={{$parameter["timezone"]}}',
						supervisor: '={{$parameter["supervisor"] || undefined}}',
						roles: '={{$parameter["roles"] || undefined}}',
						plainPassword: '={{$parameter["plainPassword"]}}',
						plainApiToken: '={{$parameter["plainApiToken"] || undefined}}',
						enabled: '={{$parameter["enabled"] ?? true}}',
						systemAccount: '={{$parameter["systemAccount"] ?? false}}',
						requiresPasswordReset: '={{$parameter["requiresPasswordReset"] ?? false}}',
					},
				},
			},
		},
		{
			name: 'Get',
			value: 'get',
			action: 'Get a user',
			routing: {
				request: {
					method: 'GET',
					url: '=/api/users/{{$parameter["id"]}}',
				},
			},
		},
		{
			name: 'Get All',
			value: 'getAll',
			action: 'Get all users',
			routing: {
				request: {
					method: 'GET',
					url: '/api/users',
					qs: {
						visible: '={{$parameter["visible"] || undefined}}',
						orderBy: '={{$parameter["orderBy"] || undefined}}',
						order: '={{$parameter["order"] || undefined}}',
						term: '={{$parameter["term"] || undefined}}',
						full: '={{$parameter["full"] || undefined}}',
					},
				},
			},
		},
		{
			name: 'Get Me',
			value: 'getMe',
			action: 'Get current user',
			routing: {
				request: {
					method: 'GET',
					url: '/api/users/me',
				},
			},
		},
		{
			name: 'Update',
			value: 'update',
			action: 'Update a user',
			routing: {
				request: {
					method: 'PATCH',
					url: '=/api/users/{{$parameter["id"]}}',
					body: {
						alias: '={{$parameter["alias"] || undefined}}',
						title: '={{$parameter["title"] || undefined}}',
						accountNumber: '={{$parameter["accountNumber"] || undefined}}',
						color: '={{$parameter["color"] || undefined}}',
						email: '={{$parameter["email"] || undefined}}',
						language: '={{$parameter["language"] ?? undefined}}',
						locale: '={{$parameter["locale"] || undefined}}',
						timezone: '={{$parameter["timezone"] || undefined}}',
						supervisor: '={{$parameter["supervisor"] || undefined}}',
						roles: '={{$parameter["roles"] || undefined}}',
						enabled: '={{$parameter["enabled"] ?? undefined}}',
						systemAccount: '={{$parameter["systemAccount"] ?? undefined}}',
						requiresPasswordReset: '={{$parameter["requiresPasswordReset"] ?? undefined}}',
					},
				},
			},
		},
		{
			name: 'Update Preferences',
			value: 'updatePreferences',
			action: 'Update user preferences',
			routing: {
				request: {
					method: 'PATCH',
					url: '=/api/users/{{$parameter["id"]}}/preferences',
					body: '={{$parameter["preferences"]}}',
				},
			},
		},
		{
			name: 'Delete API Token',
			value: 'deleteApiToken',
			action: 'Delete API token',
			routing: {
				request: {
					method: 'DELETE',
					url: '=/api/users/api-token/{{$parameter["tokenId"]}}',
				},
			},
		},
	],
	parameters: [
		createIdParameter('User ID', resource, ['get', 'update', 'updatePreferences']),
		{
			displayName: 'Username',
			name: 'username',
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
			displayName: 'Email',
			name: 'email',
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
			displayName: 'Language',
			name: 'language',
			type: 'string',
			required: true,
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['create', 'update'],
				},
			},
			default: 'en',
		},
		{
			displayName: 'Locale',
			name: 'locale',
			type: 'string',
			required: true,
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['create', 'update'],
				},
			},
			default: 'en_US',
		},
		{
			displayName: 'Timezone',
			name: 'timezone',
			type: 'string',
			required: true,
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['create', 'update'],
				},
			},
			default: 'Europe/Berlin',
		},
		{
			displayName: 'Plain Password',
			name: 'plainPassword',
			type: 'string',
			typeOptions: {
				password: true,
			},
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
			displayName: 'Order By',
			name: 'orderBy',
			type: 'options',
			options: [
				{ name: 'ID', value: 'id' },
				{ name: 'Username', value: 'username' },
				{ name: 'Alias', value: 'alias' },
				{ name: 'Email', value: 'email' },
			],
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['getAll'],
				},
			},
			default: 'username',
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
			displayName: 'Full',
			name: 'full',
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
					property: 'full',
					value: '={{$value ? "1" : "0"}}',
				},
			},
		},
		{
			displayName: 'Alias',
			name: 'alias',
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
			displayName: 'Title',
			name: 'title',
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
			displayName: 'Account Number',
			name: 'accountNumber',
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
			displayName: 'Supervisor',
			name: 'supervisor',
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
			displayName: 'Roles',
			name: 'roles',
			type: 'json',
			description: 'Array of role names',
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['create', 'update'],
				},
			},
			default: '[]',
		},
		{
			displayName: 'Plain API Token',
			name: 'plainApiToken',
			type: 'string',
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['create'],
				},
			},
			default: '',
		},
		{
			displayName: 'Enabled',
			name: 'enabled',
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
			displayName: 'System Account',
			name: 'systemAccount',
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
			displayName: 'Requires Password Reset',
			name: 'requiresPasswordReset',
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
			displayName: 'Preferences',
			name: 'preferences',
			type: 'json',
			required: true,
			description: 'Array of preference objects with name and value',
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['updatePreferences'],
				},
			},
			default: '[{"name": "preference_name", "value": "preference_value"}]',
		},
		{
			displayName: 'Token ID',
			name: 'tokenId',
			type: 'string',
			required: true,
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['deleteApiToken'],
				},
			},
			default: '',
		},
	],
};

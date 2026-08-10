import type { ResourceDescriptor } from './types';
import { createIdParameter } from './common';

const resource = 'tag';

export const tagDescriptor: ResourceDescriptor = {
	resource,
	defaultOperation: 'getAll',
	operations: [
		{
			name: 'Create',
			value: 'create',
			action: 'Create a tag',
			routing: {
				request: {
					method: 'POST',
					url: '/api/tags',
					body: {
						name: '={{$parameter["name"]}}',
						color: '={{$parameter["color"] || undefined}}',
						visible: '={{$parameter["visible"] ?? true}}',
					},
				},
			},
		},
		{
			name: 'Delete',
			value: 'delete',
			action: 'Delete a tag',
			routing: {
				request: {
					method: 'DELETE',
					url: '=/api/tags/{{$parameter["id"]}}',
				},
			},
		},
		{
			name: 'Get All',
			value: 'getAll',
			action: 'Get all tags',
			routing: {
				request: {
					method: 'GET',
					url: '/api/tags/find',
					qs: {
						name: '={{$parameter["name"]}}',
					},
				},
			},
		},
	],
	parameters: [
		createIdParameter('Tag ID', resource, ['delete']),
		{
			displayName: 'Name',
			name: 'name',
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
			displayName: 'Name',
			name: 'name',
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
			displayName: 'Color',
			name: 'color',
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
			displayName: 'Visible',
			name: 'visible',
			type: 'boolean',
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['create'],
				},
			},
			default: true,
		},
	],
};

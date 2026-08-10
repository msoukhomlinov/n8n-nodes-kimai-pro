import type { INodeProperties } from 'n8n-workflow';
import type { ResourceDescriptor } from './types';
import { createIdParameter } from './common';

const resource = 'invoice';

export const invoiceDescriptor: ResourceDescriptor = {
	resource,
	defaultOperation: 'getAll',
	operations: [
		{
			name: 'Get',
			value: 'get',
			action: 'Get an invoice',
			routing: {
				request: {
					method: 'GET',
					url: '=/api/invoices/{{$parameter["id"]}}',
				},
			},
		},
		{
			name: 'Get All',
			value: 'getAll',
			action: 'Get all invoices',
			routing: {
				request: {
					method: 'GET',
					url: '/api/invoices',
					qs: {
						begin: '={{$parameter["begin"]}}',
						end: '={{$parameter["end"]}}',
						'customers[]': '={{$parameter["customers"]}}',
						'status[]': '={{$parameter["status"]}}',
						page: '={{$parameter["page"]}}',
						size: '={{$parameter["size"]}}',
					},
				},
			},
		},
		{
			name: 'Update Custom Fields',
			value: 'updateCustomFields',
			action: 'Update invoice custom fields',
			routing: {
				request: {
					method: 'PATCH',
					url: '=/api/invoices/{{$parameter["id"]}}/custom-fields',
					body: '={{$parameter["customFields"]}}',
				},
			},
		},
		{
			name: 'Download',
			value: 'download',
			action: 'Download invoice',
			routing: {
				request: {
					method: 'GET',
					url: '=/api/invoices/{{$parameter["id"]}}/download',
					encoding: 'arraybuffer',
				},
				output: {
					postReceive: [
						{
							type: 'binaryData',
							properties: {
								destinationProperty: 'data',
							},
						},
					],
				},
			},
		},
	],
	parameters: [
		createIdParameter('Invoice ID', resource, ['get', 'updateCustomFields', 'download']),
		{
			displayName: 'Begin',
			name: 'begin',
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
			displayName: 'End',
			name: 'end',
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
			displayName: 'Customers',
			name: 'customers',
			type: 'multiOptions',
			typeOptions: {
				loadOptionsMethod: 'getCustomers',
			},
			description: 'Select customers to filter invoices',
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['getAll'],
				},
			},
			default: {},
		},
		{
			displayName: 'Status',
			name: 'status',
			type: 'string',
			description: 'Comma-separated list: pending, paid, canceled, new',
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
					property: 'status[]',
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
					operation: ['getAll'],
				},
			},
			default: 50,
		},
		{
			displayName: 'Custom Fields',
			name: 'customFields',
			type: 'json',
			required: true,
			description: 'Array of {name, value} objects for invoice custom fields',
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['updateCustomFields'],
				},
			},
			default: '[]',
		},
	],
};

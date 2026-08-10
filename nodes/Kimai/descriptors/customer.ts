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

const resource = 'customer';

export const customerDescriptor: ResourceDescriptor = {
	resource,
	defaultOperation: 'getAll',
	operations: [
		{
			name: 'Create',
			value: 'create',
			action: 'Create a customer',
			routing: {
				request: {
					method: 'POST',
					url: '/api/customers',
					body: {
						name: '={{$parameter["name"]}}',
						number: '={{$parameter["number"] || undefined}}',
						comment: '={{$parameter["comment"] || undefined}}',
						company: '={{$parameter["company"] || undefined}}',
						vatId: '={{$parameter["vatId"] || undefined}}',
						contact: '={{$parameter["contact"] || undefined}}',
						addressLine1: '={{$parameter["addressLine1"] || undefined}}',
						addressLine2: '={{$parameter["addressLine2"] || undefined}}',
						addressLine3: '={{$parameter["addressLine3"] || undefined}}',
						postCode: '={{$parameter["postcode"] || undefined}}',
						city: '={{$parameter["city"] || undefined}}',
						country: '={{$parameter["country"]}}',
						currency: '={{$parameter["currency"]}}',
						phone: '={{$parameter["phone"] || undefined}}',
						fax: '={{$parameter["fax"] || undefined}}',
						mobile: '={{$parameter["mobile"] || undefined}}',
						email: '={{$parameter["email"] || undefined}}',
						homepage: '={{$parameter["homepage"] || undefined}}',
						timezone: '={{$parameter["timezone"]}}',
						language: '={{$parameter["language"]}}',
						invoiceText: '={{$parameter["invoiceText"] || undefined}}',
						invoiceTemplate: '={{$parameter["invoiceTemplate"] || undefined}}',
						buyerReference: '={{$parameter["buyerReference"] || undefined}}',
						color: '={{$parameter["color"] || undefined}}',
						invoiceEmail: '={{$parameter["invoiceEmail"] || undefined}}',
						teams: '={{$parameter["customerTeams"] || undefined}}',
						budget: '={{$parameter["budget"] || undefined}}',
						timeBudget: '={{$parameter["timeBudget"] || undefined}}',
						budgetType: '={{$parameter["budgetType"] ?? undefined}}',
						visible: '={{$parameter["visible"] ?? true}}',
						billable: '={{$parameter["billable"] ?? true}}',
					},
				},
			},
		},
		{
			name: 'Delete',
			value: 'delete',
			action: 'Delete a customer',
			routing: {
				request: {
					method: 'DELETE',
					url: '=/api/customers/{{$parameter["id"]}}',
				},
			},
		},
		{
			name: 'Get',
			value: 'get',
			action: 'Get a customer',
			routing: {
				request: {
					method: 'GET',
					url: '=/api/customers/{{$parameter["id"]}}',
				},
			},
		},
		{
			name: 'Get All',
			value: 'getAll',
			action: 'Get all customers',
			routing: {
				request: {
					method: 'GET',
					url: '/api/customers',
					qs: {
						visible: '={{$parameter["visible"] || undefined}}',
						order: '={{$parameter["order"] || undefined}}',
						orderBy: '={{$parameter["orderBy"] || undefined}}',
						term: '={{$parameter["term"] || undefined}}',
						full: '={{$parameter["full"] || undefined}}',
					},
				},
			},
		},
		{
			name: 'Update',
			value: 'update',
			action: 'Update a customer',
			routing: {
				request: {
					method: 'PATCH',
					url: '=/api/customers/{{$parameter["id"]}}',
					body: {
						name: '={{$parameter["name"] || undefined}}',
						number: '={{$parameter["number"] || undefined}}',
						comment: '={{$parameter["comment"] || undefined}}',
						company: '={{$parameter["company"] || undefined}}',
						vatId: '={{$parameter["vatId"] || undefined}}',
						contact: '={{$parameter["contact"] || undefined}}',
						addressLine1: '={{$parameter["addressLine1"] || undefined}}',
						addressLine2: '={{$parameter["addressLine2"] || undefined}}',
						addressLine3: '={{$parameter["addressLine3"] || undefined}}',
						postCode: '={{$parameter["postcode"] || undefined}}',
						city: '={{$parameter["city"] || undefined}}',
						country: '={{$parameter["country"] || undefined}}',
						currency: '={{$parameter["currency"] || undefined}}',
						phone: '={{$parameter["phone"] || undefined}}',
						fax: '={{$parameter["fax"] || undefined}}',
						mobile: '={{$parameter["mobile"] || undefined}}',
						email: '={{$parameter["email"] || undefined}}',
						homepage: '={{$parameter["homepage"] || undefined}}',
						timezone: '={{$parameter["timezone"] || undefined}}',
						language: '={{$parameter["language"] ?? undefined}}',
						invoiceText: '={{$parameter["invoiceText"] || undefined}}',
						invoiceTemplate: '={{$parameter["invoiceTemplate"] || undefined}}',
						buyerReference: '={{$parameter["buyerReference"] || undefined}}',
						color: '={{$parameter["color"] || undefined}}',
						invoiceEmail: '={{$parameter["invoiceEmail"] || undefined}}',
						teams: '={{$parameter["customerTeams"] || undefined}}',
						budget: '={{$parameter["budget"] || undefined}}',
						timeBudget: '={{$parameter["timeBudget"] || undefined}}',
						budgetType: '={{$parameter["budgetType"] ?? undefined}}',
						visible: '={{$parameter["visible"] ?? undefined}}',
						billable: '={{$parameter["billable"] ?? undefined}}',
					},
				},
			},
		},
		{
			name: 'Update Meta',
			value: 'updateMeta',
			action: 'Update customer custom field',
			routing: {
				request: {
					method: 'PATCH',
					url: '=/api/customers/{{$parameter["id"]}}/meta',
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
			action: 'Get customer rates',
			routing: {
				request: {
					method: 'GET',
					url: '=/api/customers/{{$parameter["id"]}}/rates',
				},
			},
		},
		{
			name: 'Add Rate',
			value: 'addRate',
			action: 'Add rate for customer',
			routing: {
				request: {
					method: 'POST',
					url: '=/api/customers/{{$parameter["id"]}}/rates',
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
			action: 'Get comments for customer',
			routing: {
				request: {
					method: 'GET',
					url: '=/api/customers/{{$parameter["id"]}}/comments',
				},
			},
		},
		{
			name: 'Add Comment',
			value: 'addComment',
			action: 'Add comment for customer',
			routing: {
				request: {
					method: 'POST',
					url: '=/api/customers/{{$parameter["id"]}}/comments',
					body: {
						message: '={{$parameter["commentText"]}}',
					},
				},
			},
		},
		{
			name: 'Delete Comment',
			value: 'deleteComment',
			action: 'Delete customer comment',
			routing: {
				request: {
					method: 'DELETE',
					url: '=/api/customers/{{$parameter["id"]}}/comments/{{$parameter["commentId"]}}',
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
					url: '=/api/customers/{{$parameter["id"]}}/comments/{{$parameter["commentId"]}}/pin',
				},
			},
		},
		{
			name: 'Add Team',
			value: 'addTeam',
			action: 'Create default team for customer',
			routing: {
				request: {
					method: 'POST',
					url: '=/api/customers/{{$parameter["id"]}}/team',
				},
			},
		},
		{
			name: 'Delete Rate',
			value: 'deleteRate',
			action: 'Delete rate for customer',
			routing: {
				request: {
					method: 'DELETE',
					url: '=/api/customers/{{$parameter["id"]}}/rates/{{$parameter["rateId"]}}',
				},
			},
		},
	],
	parameters: [
		createIdParameter('Customer ID', resource, [
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
			displayName: 'Country',
			name: 'country',
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
			displayName: 'Currency',
			name: 'currency',
			type: 'string',
			required: true,
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['create'],
				},
			},
			default: 'EUR',
		},
		{
			displayName: 'Timezone',
			name: 'timezone',
			type: 'string',
			required: true,
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['create'],
				},
			},
			default: 'Europe/Berlin',
		},
		{
			displayName: 'Language',
			name: 'language',
			type: 'options',
			required: true,
			options: [
				{ name: 'Arabic', value: 'ar' },
				{ name: 'Bulgarian', value: 'bg' },
				{ name: 'Catalan', value: 'ca' },
				{ name: 'Czech', value: 'cs' },
				{ name: 'Danish', value: 'da' },
				{ name: 'German', value: 'de' },
				{ name: 'German (CH)', value: 'de_CH' },
				{ name: 'Greek', value: 'el' },
				{ name: 'English', value: 'en' },
				{ name: 'Esperanto', value: 'eo' },
				{ name: 'Spanish', value: 'es' },
				{ name: 'Basque', value: 'eu' },
				{ name: 'Persian', value: 'fa' },
				{ name: 'Finnish', value: 'fi' },
				{ name: 'Faroese', value: 'fo' },
				{ name: 'French', value: 'fr' },
				{ name: 'Hebrew', value: 'he' },
				{ name: 'Croatian', value: 'hr' },
				{ name: 'Hungarian', value: 'hu' },
				{ name: 'Indonesian', value: 'id' },
				{ name: 'Italian', value: 'it' },
				{ name: 'Japanese', value: 'ja' },
				{ name: 'Korean', value: 'ko' },
				{ name: 'Norwegian', value: 'nb_NO' },
				{ name: 'Dutch', value: 'nl' },
				{ name: 'Punjabi', value: 'pa' },
				{ name: 'Polish', value: 'pl' },
				{ name: 'Portuguese', value: 'pt' },
				{ name: 'Portuguese (BR)', value: 'pt_BR' },
				{ name: 'Romanian', value: 'ro' },
				{ name: 'Russian', value: 'ru' },
				{ name: 'Slovak', value: 'sk' },
				{ name: 'Slovenian', value: 'sl' },
				{ name: 'Swedish', value: 'sv' },
				{ name: 'Tamil', value: 'ta' },
				{ name: 'Turkish', value: 'tr' },
				{ name: 'Ukrainian', value: 'uk' },
				{ name: 'Vietnamese', value: 'vi' },
				{ name: 'Chinese (Simplified)', value: 'zh_CN' },
				{ name: 'Chinese (Traditional)', value: 'zh_Hant' },
				{ name: 'Chinese (Traditional TW)', value: 'zh_Hant_TW' },
			],
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['create', 'update'],
				},
			},
			default: 'en',
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
			displayName: 'Full',
			name: 'full',
			type: 'options',
			options: [
				{ name: 'No', value: '0' },
				{ name: 'Yes', value: '1' },
			],
			description: 'Include full customer data',
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['getAll'],
				},
			},
			default: '0',
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
			displayName: 'Company',
			name: 'company',
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
			displayName: 'VAT ID',
			name: 'vatId',
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
			displayName: 'Contact',
			name: 'contact',
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
			displayName: 'Address Line 1',
			name: 'addressLine1',
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
			displayName: 'Address Line 2',
			name: 'addressLine2',
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
			displayName: 'Address Line 3',
			name: 'addressLine3',
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
			displayName: 'Postcode',
			name: 'postcode',
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
			displayName: 'City',
			name: 'city',
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
			displayName: 'Country',
			name: 'country',
			type: 'string',
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['update'],
				},
			},
			default: '',
		},
		{
			displayName: 'Currency',
			name: 'currency',
			type: 'string',
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['update'],
				},
			},
			default: 'EUR',
		},
		{
			displayName: 'Phone',
			name: 'phone',
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
			displayName: 'Fax',
			name: 'fax',
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
			displayName: 'Mobile',
			name: 'mobile',
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
			displayName: 'Email',
			name: 'email',
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
			displayName: 'Homepage',
			name: 'homepage',
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
			displayName: 'Timezone',
			name: 'timezone',
			type: 'string',
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['update'],
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
			displayName: 'Invoice Template',
			name: 'invoiceTemplate',
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
			displayName: 'Buyer Reference',
			name: 'buyerReference',
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
			displayName: 'Invoice Email',
			name: 'invoiceEmail',
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
			displayName: 'Teams',
			name: 'customerTeams',
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

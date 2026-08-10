import type { INodeProperties } from 'n8n-workflow';
import type { ResourceDescriptor } from './types';
import { createIdParameter } from './common';

const resource = 'team';

export const teamDescriptor: ResourceDescriptor = {
	resource,
	defaultOperation: 'getAll',
	operations: [
		{
			name: 'Create',
			value: 'create',
			action: 'Create a team',
			routing: {
				request: {
					method: 'POST',
					url: '/api/teams',
					body: {
						name: '={{$parameter["name"]}}',
						members: '={{$parameter["members"]}}',
						color: '={{$parameter["color"] || undefined}}',
					},
				},
			},
		},
		{
			name: 'Delete',
			value: 'delete',
			action: 'Delete a team',
			routing: {
				request: {
					method: 'DELETE',
					url: '=/api/teams/{{$parameter["id"]}}',
				},
			},
		},
		{
			name: 'Get',
			value: 'get',
			action: 'Get a team',
			routing: {
				request: {
					method: 'GET',
					url: '=/api/teams/{{$parameter["id"]}}',
				},
			},
		},
		{
			name: 'Get All',
			value: 'getAll',
			action: 'Get all teams',
			routing: {
				request: {
					method: 'GET',
					url: '/api/teams',
				},
			},
		},
		{
			name: 'Update',
			value: 'update',
			action: 'Update a team',
			routing: {
				request: {
					method: 'PATCH',
					url: '=/api/teams/{{$parameter["id"]}}',
					body: {
						name: '={{$parameter["name"] || undefined}}',
						members: '={{$parameter["members"] || undefined}}',
						color: '={{$parameter["color"] || undefined}}',
					},
				},
			},
		},
		{
			name: 'Add Member',
			value: 'addMember',
			action: 'Add team member',
			routing: {
				request: {
					method: 'POST',
					url: '=/api/teams/{{$parameter["id"]}}/members/{{$parameter["userId"]}}',
				},
			},
		},
		{
			name: 'Remove Member',
			value: 'removeMember',
			action: 'Remove team member',
			routing: {
				request: {
					method: 'DELETE',
					url: '=/api/teams/{{$parameter["id"]}}/members/{{$parameter["userId"]}}',
				},
			},
		},
		{
			name: 'Grant Customer Access',
			value: 'grantCustomer',
			action: 'Grant team access to customer',
			routing: {
				request: {
					method: 'POST',
					url: '=/api/teams/{{$parameter["id"]}}/customers/{{$parameter["customerId"]}}',
				},
			},
		},
		{
			name: 'Revoke Customer Access',
			value: 'revokeCustomer',
			action: 'Revoke customer access from team',
			routing: {
				request: {
					method: 'DELETE',
					url: '=/api/teams/{{$parameter["id"]}}/customers/{{$parameter["customerId"]}}',
				},
			},
		},
		{
			name: 'Grant Project Access',
			value: 'grantProject',
			action: 'Grant team access to project',
			routing: {
				request: {
					method: 'POST',
					url: '=/api/teams/{{$parameter["id"]}}/projects/{{$parameter["projectId"]}}',
				},
			},
		},
		{
			name: 'Revoke Project Access',
			value: 'revokeProject',
			action: 'Revoke project access from team',
			routing: {
				request: {
					method: 'DELETE',
					url: '=/api/teams/{{$parameter["id"]}}/projects/{{$parameter["projectId"]}}',
				},
			},
		},
		{
			name: 'Grant Activity Access',
			value: 'grantActivity',
			action: 'Grant team access to activity',
			routing: {
				request: {
					method: 'POST',
					url: '=/api/teams/{{$parameter["id"]}}/activities/{{$parameter["activityId"]}}',
				},
			},
		},
		{
			name: 'Revoke Activity Access',
			value: 'revokeActivity',
			action: 'Revoke activity access from team',
			routing: {
				request: {
					method: 'DELETE',
					url: '=/api/teams/{{$parameter["id"]}}/activities/{{$parameter["activityId"]}}',
				},
			},
		},
	],
	parameters: [
		createIdParameter('Team ID', resource, ['get', 'update', 'delete', 'addMember', 'removeMember', 'grantCustomer', 'revokeCustomer', 'grantProject', 'revokeProject', 'grantActivity', 'revokeActivity']),
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
			displayName: 'Members',
			name: 'members',
			type: 'json',
			required: true,
			description: 'Array of team members with user ID and teamlead flag',
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['create', 'update'],
				},
			},
			default: '[{"user": 1, "teamlead": false}]',
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
			displayName: 'User ID',
			name: 'userId',
			type: 'string',
			required: true,
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['addMember', 'removeMember'],
				},
			},
			default: '',
		},
		{
			displayName: 'Customer ID',
			name: 'customerId',
			type: 'string',
			required: true,
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['grantCustomer', 'revokeCustomer'],
				},
			},
			default: '',
		},
		{
			displayName: 'Project ID',
			name: 'projectId',
			type: 'string',
			required: true,
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['grantProject', 'revokeProject'],
				},
			},
			default: '',
		},
		{
			displayName: 'Activity ID',
			name: 'activityId',
			type: 'string',
			required: true,
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['grantActivity', 'revokeActivity'],
				},
			},
			default: '',
		},
	],
};

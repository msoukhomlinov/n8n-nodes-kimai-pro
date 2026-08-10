import { INodeType, INodeTypeDescription, INodeProperties, ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
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

function buildOperationProperty(descriptor: ResourceDescriptor): INodeProperties {
	const options: Array<any> = descriptor.operations.map((op: OperationDefinition) => ({
		name: op.name,
		value: op.value,
		action: op.action,
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

export class KimaiPro implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Kimai Pro',
		name: 'kimaiPro',
		icon: 'file:kimai.svg',
		group: ['organization'],
		version: [1, 3],

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
		requestDefaults: {
			baseURL: '={{$credentials?.apiUrl}}',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
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
		__loadOptionsMethods: ['getCustomers', 'getProjects', 'getActivities', 'getUsers', 'getTags', 'getTeams', ],
	};

	async getCustomers(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
		return getCustomers.call(this);
	}

	async getProjects(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
		return getProjects.call(this);
	}

	async getActivities(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
		return getActivities.call(this);
	}

	async getUsers(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
		return getUsers.call(this);
	}

	async getTags(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
		return getTags.call(this);
	}

	async getTeams(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
		return getTeams.call(this);
	}

}

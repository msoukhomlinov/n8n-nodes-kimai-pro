import type { INodePropertyOptions, INodeProperties } from 'n8n-workflow';

export interface OperationDefinition {
	name: string;
	value: string;
	action: string;
	routing: {
		request: {
			method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
			url: string;
			body?: Record<string, string> | string;
			qs?: Record<string, string>;
			encoding?: string;
		};
		output?: {
			postReceive: Array<{
				type: string;
				properties: Record<string, string>;
			}>;
		};
	};
}

export interface ResourceDescriptor {
	resource: string;
	operations: OperationDefinition[];
	parameters: INodeProperties[];
	defaultOperation: string;
}

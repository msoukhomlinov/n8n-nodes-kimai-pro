import type { INodePropertyOptions, INodeProperties } from 'n8n-workflow';

export interface OperationDefinition {
	name: string;
	value: string;
	action: string;
	// Routing is kept for backwards compatibility with n8n's declarative routing,
	// but execution is now handled by the node's execute() method using the SDK.
	routing?: {
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

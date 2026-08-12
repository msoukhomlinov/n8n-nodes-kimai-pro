// nodes/KimaiPro/ai-tools/KimaiProAiTools.node.ts
import { NodeOperationError } from 'n8n-workflow';
import type {
    IDataObject, IExecuteFunctions, ILoadOptionsFunctions,
    INodeType, INodeTypeDescription, INodePropertyOptions, INodeExecutionData,
    ISupplyDataFunctions, SupplyData,
} from 'n8n-workflow';
import { executeAiTool, WRITE_OPERATIONS } from './tool-executor';
import { RESOURCE_OPS } from './schema-generator';
import { buildUnifiedDescription } from './description-builders';
import { getRuntimeSchemaBuilders, OPERATION_LABELS } from './schema-generator';
import { RuntimeDynamicStructuredTool, runtimeZod, getLazyLogWrapper } from './runtime';
import { wrapError, ERROR_TYPES } from './error-formatter';

// Resource labels for UI
const RESOURCE_LABELS: Record<string, string> = {
    activity: 'Activity',
    customer: 'Customer',
    project: 'Project',
    timesheet: 'Timesheet',
    user: 'User',
    tag: 'Tag',
    team: 'Team',
    invoice: 'Invoice',
    default: 'Default/System',
};

function getDefaultOperation(operations: string[]): string {
    if (operations.includes('getAll')) return 'getAll';
    if (operations.includes('get')) return 'get';
    return operations[0] ?? '';
}

function parseToolResult(resultJson: string): IDataObject {
    try { return JSON.parse(resultJson) as IDataObject; }
    catch { return { error: resultJson }; }
}

// Lazy-initialized schema builders — resolved at first tool invocation, not module load time
let _runtimeSchemas: ReturnType<typeof getRuntimeSchemaBuilders> | null = null;
function getRuntimeSchemas() {
    if (!_runtimeSchemas) {
        _runtimeSchemas = getRuntimeSchemaBuilders(runtimeZod);
    }
    return _runtimeSchemas;
}

export class KimaiProAiTools implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'Kimai Pro AI Tools',
        name: 'kimaiProAiTools',
        icon: 'file:kimai.svg',
        group: ['output'],
        version: 1,
        description: 'Expose Kimai Pro operations as AI tools for the AI Agent and MCP Server Trigger',
        defaults: { name: 'Kimai Pro AI Tools' },
        inputs: [],
        outputs: [{ type: 'ai_tool', displayName: 'Tools' }],
        credentials: [{ name: 'kimaiProApi', required: true }],
        properties: [
            {
                displayName: 'Resource',
                name: 'resource',
                type: 'options',
                required: true,
                noDataExpression: true,
                typeOptions: { loadOptionsMethod: 'getToolResources' },
                default: 'timesheet',
                description: 'Choose the Kimai resource to expose as AI tools',
            },
            {
                displayName: 'Operations',
                name: 'operations',
                type: 'multiOptions',
                required: true,
                typeOptions: {
                    loadOptionsMethod: 'getToolResourceOperations',
                    loadOptionsDependsOn: ['resource', 'allowWrites'],
                },
                default: [],
                description: 'Select operations to expose. Write operations require "Allow Writes" enabled.',
            },
            {
                displayName: 'Allow Writes',
                name: 'allowWrites',
                type: 'boolean',
                default: false,
                description: 'Enable write operations (create, update, delete, etc.). When disabled, only read operations are available.',
            },
        ],
    };

    methods = {
        loadOptions: {
            async getToolResources(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
                return Object.entries(RESOURCE_OPS)
                    .map(([value, ops]) => ({
                        name: RESOURCE_LABELS[value] ?? value,
                        value,
                        description: `${(ops as string[]).length} operations available`,
                    }))
                    .sort((a, b) => a.name.localeCompare(b.name));
            },
            async getToolResourceOperations(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
                const resource = this.getCurrentNodeParameter('resource') as string;
                const allowWrites = (this.getCurrentNodeParameter('allowWrites') ?? false) as boolean;
                if (!resource) return [];
                const ops = RESOURCE_OPS[resource];
                if (!ops) return [];
                return ops
                    .filter(op => allowWrites || !WRITE_OPERATIONS.has(op))
                    .map(op => ({
                        name: OPERATION_LABELS[op] ?? op,
                        value: op,
                        description: `${op} operation`,
                    }));
            },
        },
    };

    async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
        const resource = this.getNodeParameter('resource', itemIndex) as string;
        const operations = this.getNodeParameter('operations', itemIndex) as string[];
        const allowWrites = this.getNodeParameter('allowWrites', itemIndex, false) as boolean;

        if (!resource) throw new NodeOperationError(this.getNode(), 'Resource is required');
        if (!operations?.length) throw new NodeOperationError(this.getNode(), 'At least one operation must be selected');

        const configOps = RESOURCE_OPS[resource];
        if (!configOps) throw new NodeOperationError(this.getNode(), `Unknown resource: ${resource}`);

        // Filter to only valid and permitted operations
        const enabledOperations = operations.filter((op) => {
            if (WRITE_OPERATIONS.has(op) && !allowWrites) return false;
            return configOps.includes(op);
        });

        if (enabledOperations.length === 0) {
            throw new NodeOperationError(this.getNode(),
                'No tools to expose. Select operations and enable "Allow Writes" if needed.');
        }

        const unifiedSchema = getRuntimeSchemas().buildUnifiedSchema(resource, enabledOperations);
        const unifiedDescription = buildUnifiedDescription(
            RESOURCE_LABELS[resource] ?? resource,
            resource,
            enabledOperations,
        );

        // Tool name: kimaiPro_{resource}
        const toolName = `kimaiPro_${resource}`;

        const unifiedTool = new RuntimeDynamicStructuredTool({
            name: toolName,
            description: unifiedDescription,
                        schema: unifiedSchema as any,
            func: async (params: Record<string, unknown>) => {
                const operationFromArgs = params.operation;
                const operation = typeof operationFromArgs === 'string' ? operationFromArgs : undefined;

                // Layer 2 write safety — re-check after schema parsing
                if (operation && WRITE_OPERATIONS.has(operation) && !allowWrites) {
                    return JSON.stringify(wrapError(
                        resource, operation, ERROR_TYPES.WRITE_OPERATION_BLOCKED,
                        'Write operations are disabled for this tool.',
                        'Enable allowWrites on this node to use mutating operations.',
                    ));
                }

                if (!operation || !enabledOperations.includes(operation)) {
                    return JSON.stringify(wrapError(
                        resource, operationFromArgs as string ?? 'unknown',
                        ERROR_TYPES.INVALID_OPERATION,
                        'Missing or unsupported operation for this tool call.',
                        `Allowed operations: ${enabledOperations.join(', ')}.`,
                    ));
                }

                // Cast ISupplyDataFunctions to IExecuteFunctions — safe because executeAiTool
                // only uses methods that exist on both interfaces (getCredentialsSync, etc.)
                return executeAiTool(this as unknown as IExecuteFunctions, resource, operation, params, {
                    allAllowedOps: enabledOperations,
                    allowWrites,
                });
            },
        });

        // Wrap with logWrapper for n8n execution view visibility
        const logWrapFn = getLazyLogWrapper();
        const wrappedTool = logWrapFn ? logWrapFn(unifiedTool, this) : unifiedTool;

        return { response: wrappedTool };
    }

    /**
     * execute() handles Agent V3 (n8n ~1.116+) EngineRequest-based tool execution.
     * Agent V3 routes ALL tool calls through execute() with params in item.json.
     * The supplyData() → func() path is still used by MCP Trigger and legacy Agent V2.
     */
    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const resource = this.getNodeParameter('resource', 0) as string;
        const operations = this.getNodeParameter('operations', 0) as string[];
        const allowWrites = this.getNodeParameter('allowWrites', 0, false) as boolean;

        if (!resource || !operations?.length) {
            throw new NodeOperationError(this.getNode(), 'Resource and at least one operation must be configured.');
        }

        const configOps = RESOURCE_OPS[resource];
        if (!configOps) throw new NodeOperationError(this.getNode(), `Unknown resource: ${resource}`);

        const effectiveOps = operations.filter((op) => !WRITE_OPERATIONS.has(op) || allowWrites);
        if (effectiveOps.length === 0) {
            throw new NodeOperationError(this.getNode(), 'No permitted operations. Enable "Allow Writes" if needed.');
        }

        const items = this.getInputData();

        // Detect real tool invocation vs "Test step" in the editor
        const firstItem = items[0]?.json ?? {};
        const hasToolCall = !!(firstItem['tool'] || firstItem['operation']);
        if (!hasToolCall) {
            return [[{
                json: {
                    message: 'This is an AI Tool node. Connect it to an AI Agent node to use it.',
                    configured: { resource, operations },
                },
                pairedItem: { item: 0 },
            }]];
        }

        const allAllowedOps = [...new Set(effectiveOps)];
        const response: INodeExecutionData[] = [];

        for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
            const item = items[itemIndex];
            if (!item) continue;

            const requestedOp = item.json.operation as string | undefined;

            // Layer 2 write safety — execute() path
            if (requestedOp && WRITE_OPERATIONS.has(requestedOp) && !allowWrites) {
                response.push({
                    json: parseToolResult(JSON.stringify(wrapError(
                        resource, requestedOp, ERROR_TYPES.WRITE_OPERATION_BLOCKED,
                        'Write operations are disabled.',
                        'Enable allowWrites on this node to use mutating operations.',
                    ))),
                    pairedItem: { item: itemIndex },
                });
                continue;
            }

            // Validate operation against allowed set
            if (requestedOp && !allAllowedOps.includes(requestedOp)) {
                response.push({
                    json: parseToolResult(JSON.stringify(wrapError(
                        resource, requestedOp, ERROR_TYPES.INVALID_OPERATION,
                        `Operation '${requestedOp}' is not configured for this node.`,
                        `Use one of: ${allAllowedOps.join(', ')}`,
                    ))),
                    pairedItem: { item: itemIndex },
                });
                continue;
            }

            const effectiveOp = requestedOp ?? getDefaultOperation(effectiveOps);

            try {
                const resultJson = await executeAiTool(this, resource, effectiveOp, item.json as Record<string, unknown>, {
                    allAllowedOps,
                    allowWrites,
                });
                response.push({ json: parseToolResult(resultJson), pairedItem: { item: itemIndex } });
            } catch (error) {
                throw new NodeOperationError(
                    this.getNode(),
                    error instanceof Error ? error.message : String(error),
                    { itemIndex },
                );
            }
        }

        return [response];
    }
}

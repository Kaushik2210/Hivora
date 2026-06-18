import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import type { ILockStore } from '../lock/types';

export interface OrchestratorMcpServerOptions {
  lockStore: ILockStore;
  name?: string;
  version?: string;
}

export class OrchestratorMcpServer {
  private server: Server;
  private lockStore: ILockStore;

  constructor(opts: OrchestratorMcpServerOptions) {
    this.lockStore = opts.lockStore;
    this.server = new Server(
      {
        name: opts.name ?? 'hivora-orchestrator',
        version: opts.version ?? '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    this.setupToolHandlers();

    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'get_locks',
          description: 'Get all currently active symbol locks across the project.',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'lock_symbol',
          description: 'Lock a file or a specific function/symbol to prevent other agents from editing it concurrently.',
          inputSchema: {
            type: 'object',
            properties: {
              file: { type: 'string', description: 'File path' },
              symbol: { type: 'string', description: 'Function or symbol name' },
              agentId: { type: 'string', description: 'Unique ID of the AI agent requesting the lock' },
            },
            required: ['file', 'symbol', 'agentId'],
          },
        },
        {
          name: 'unlock_symbol',
          description: 'Release a lock on a file or symbol.',
          inputSchema: {
            type: 'object',
            properties: {
              file: { type: 'string', description: 'File path' },
              symbol: { type: 'string', description: 'Function or symbol name' },
              agentId: { type: 'string', description: 'Unique ID of the AI agent releasing the lock' },
            },
            required: ['file', 'symbol', 'agentId'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case 'get_locks': {
          const locks = await this.lockStore.getLocks();
          return {
            content: [{ type: 'text', text: JSON.stringify(locks, null, 2) }],
          };
        }

        case 'lock_symbol': {
          const { file, symbol, agentId } = request.params.arguments as any;
          if (!file || !symbol || !agentId) {
            throw new McpError(ErrorCode.InvalidParams, 'Missing required arguments');
          }
          const result = await this.lockStore.lock(file, symbol, agentId);
          return {
            content: [{ type: 'text', text: JSON.stringify(result) }],
            isError: !result.success,
          };
        }

        case 'unlock_symbol': {
          const { file, symbol, agentId } = request.params.arguments as any;
          if (!file || !symbol || !agentId) {
            throw new McpError(ErrorCode.InvalidParams, 'Missing required arguments');
          }
          const result = await this.lockStore.unlock(file, symbol, agentId);
          return {
            content: [{ type: 'text', text: JSON.stringify(result) }],
            isError: !result.success,
          };
        }

        default:
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${request.params.name}`,
          );
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Hivora Orchestrator MCP server running on stdio');
  }
}

export async function runMcpServer(lockStore: ILockStore) {
  const server = new OrchestratorMcpServer({ lockStore });
  await server.run();
}

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import type { ILockStore } from '../lock/types';
import { applyChangeWithLock } from '../operations/applyChange';
import type { HivoraTaskClient } from '../api/taskClient';

export interface OrchestratorMcpServerOptions {
  lockStore: ILockStore;
  taskClient?: HivoraTaskClient;
  name?: string;
  version?: string;
}

export class OrchestratorMcpServer {
  private server: Server;
  private lockStore: ILockStore;
  private taskClient?: HivoraTaskClient;

  constructor(opts: OrchestratorMcpServerOptions) {
    this.lockStore = opts.lockStore;
    this.taskClient = opts.taskClient;
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
    const taskTools = this.taskClient ? [
      {
        name: 'get_pending_tasks',
        description: 'List all unassigned tasks with status "todo" in this project. Use this to find work to pick up.',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'list_tasks',
        description: 'List all tasks in this project (all statuses).',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'claim_task',
        description: 'Claim a task by ID — sets it to "doing" and assigns it to this agent. Do this before starting work on a task.',
        inputSchema: {
          type: 'object',
          properties: {
            taskId: { type: 'string', description: 'The ID of the task to claim' },
          },
          required: ['taskId'],
        },
      },
      {
        name: 'complete_task',
        description: 'Mark a task as "done" after finishing the work. Always call this when you finish a task.',
        inputSchema: {
          type: 'object',
          properties: {
            taskId: { type: 'string', description: 'The ID of the completed task' },
          },
          required: ['taskId'],
        },
      },
    ] : [];

    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        ...taskTools,
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
        {
          name: 'apply_change',
          description: 'Apply a change under lock using a per-agent worktree. Arguments: file, symbol, agentId, patch (string or omitted).',
          inputSchema: {
            type: 'object',
            properties: {
              file: { type: 'string' },
              symbol: { type: 'string' },
              agentId: { type: 'string' },
              patchText: { type: 'string' },
            },
            required: ['file', 'symbol', 'agentId'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case 'get_pending_tasks': {
          if (!this.taskClient) throw new McpError(ErrorCode.MethodNotFound, 'Task client not configured');
          const tasks = await this.taskClient.getPendingTasks();
          return { content: [{ type: 'text', text: JSON.stringify(tasks, null, 2) }] };
        }

        case 'list_tasks': {
          if (!this.taskClient) throw new McpError(ErrorCode.MethodNotFound, 'Task client not configured');
          const tasks = await this.taskClient.listTasks();
          return { content: [{ type: 'text', text: JSON.stringify(tasks, null, 2) }] };
        }

        case 'claim_task': {
          if (!this.taskClient) throw new McpError(ErrorCode.MethodNotFound, 'Task client not configured');
          const { taskId } = request.params.arguments as { taskId: string };
          if (!taskId) throw new McpError(ErrorCode.InvalidParams, 'taskId is required');
          const task = await this.taskClient.claimTask(taskId);
          return { content: [{ type: 'text', text: JSON.stringify(task, null, 2) }] };
        }

        case 'complete_task': {
          if (!this.taskClient) throw new McpError(ErrorCode.MethodNotFound, 'Task client not configured');
          const { taskId } = request.params.arguments as { taskId: string };
          if (!taskId) throw new McpError(ErrorCode.InvalidParams, 'taskId is required');
          const task = await this.taskClient.completeTask(taskId);
          return { content: [{ type: 'text', text: JSON.stringify(task, null, 2) }] };
        }

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

        case 'apply_change': {
          const { file, symbol, agentId, patchText } = request.params.arguments as any;
          if (!file || !symbol || !agentId) {
            throw new McpError(ErrorCode.InvalidParams, 'Missing required arguments');
          }
          const repoPath = process.cwd();
          const patchFn = (current: string) => {
            if (typeof patchText === 'string') return patchText;
            return current + `\n// patched by ${agentId} [${symbol}]`;
          };
          const result = await applyChangeWithLock({ repoPath, lockStore: this.lockStore, agentId, file, symbol, patch: patchFn });
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

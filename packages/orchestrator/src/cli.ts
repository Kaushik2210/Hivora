#!/usr/bin/env node
import { CloudLockStore } from './lock/cloudLockStore.js';
import { OrchestratorMcpServer } from './mcp/server.js';
import { HivoraTaskClient } from './api/taskClient.js';

const command = process.argv[2] ?? 'start';

if (command === '--help' || command === '-h') {
  console.log(`
Hivora MCP Server — AI agent coordination via Model Context Protocol

Usage:
  npx @hivora/orchestrator@latest start [options]

Environment variables (required):
  HIVORA_TOKEN    Your Hivora API token (from project settings)
  HIVORA_PROJECT  Your Hivora project ID

Environment variables (optional):
  HIVORA_API      API base URL (default: https://api.hivora.com)
  HIVORA_AGENT    Agent identifier (default: anonymous)

IDE Integration:
  Claude Desktop / Cline / Cursor — add to mcp.json:
  {
    "mcpServers": {
      "hivora": {
        "command": "npx",
        "args": ["@hivora/orchestrator@latest", "start"],
        "env": {
          "HIVORA_TOKEN": "<your-token>",
          "HIVORA_PROJECT": "<your-project-id>"
        }
      }
    }
  }
`);
  process.exit(0);
}

if (command !== 'start') {
  console.error(`Unknown command: ${command}`);
  console.error('Usage: npx @hivora/orchestrator@latest start');
  console.error('       npx @hivora/orchestrator@latest --help');
  process.exit(1);
}

const apiBase = process.env.HIVORA_API ?? 'https://api.hivora.com';
const token = process.env.HIVORA_TOKEN ?? '';
const projectId = process.env.HIVORA_PROJECT ?? '';
const agentId = process.env.HIVORA_AGENT ?? 'anonymous';

if (!token) {
  console.error('Error: HIVORA_TOKEN environment variable is required.');
  console.error('  Get your token from https://app.hivora.com/settings');
  process.exit(1);
}

if (!projectId) {
  console.error('Error: HIVORA_PROJECT environment variable is required.');
  console.error('  Find your project ID in the project settings.');
  process.exit(1);
}

const lockStore = new CloudLockStore({
  apiBaseUrl: apiBase,
  projectId,
  getAccessToken: () => token,
});

const taskClient = new HivoraTaskClient({
  apiBase,
  token,
  projectId,
  agentId,
});

const server = new OrchestratorMcpServer({
  lockStore,
  taskClient,
  name: `hivora-mcp-${agentId}`,
  version: '0.1.0',
});

console.error(`Hivora MCP server starting...`);
console.error(`  API:     ${apiBase}`);
console.error(`  Project: ${projectId}`);
console.error(`  Agent:   ${agentId}`);

server.run().catch((err: Error) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});

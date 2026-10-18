#!/usr/bin/env node
import { CloudLockStore } from './lock/cloudLockStore.js';
import { OrchestratorMcpServer } from './mcp/server.js';
import { HivoraTaskClient } from './api/taskClient.js';
import { io } from 'socket.io-client';

const command = process.argv[2] ?? 'start';

const allowedCommands = ['start', 'tasks', 'diff', 'approve', 'reject', 'agent-mode', 'logs'];

if (command === '--help' || command === '-h' || !allowedCommands.includes(command)) {
  console.log(`
Hivora CLI & MCP Server — AI agent coordination tool

Usage:
  npx @hivora/orchestrator@latest <command> [options]

Commands:
  start                         Start the MCP Server (default)
  tasks                         List all tasks in the project
  diff <task-id>                Show proposed file changes for a task
  approve <task-id>             Approve the proposed changes for a task
  reject <task-id>              Reject the proposed changes and reset the task to todo
  agent-mode <agent-id> <mode>  Change agent mode ('thinking' or 'fast')
  logs                          Watch live agent coordination log stream

Environment variables (required):
  HIVORA_TOKEN    Your Hivora API token (from project settings)
  HIVORA_PROJECT  Your Hivora project ID

Environment variables (optional):
  HIVORA_API      API base URL (default: https://api.hivora.com)
  HIVORA_AGENT    Agent identifier (default: anonymous)

IDE Integration (MCP):
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
  process.exit(command === '--help' || command === '-h' ? 0 : 1);
}

import { localLockStore } from './lock/localLockStore.js';

const apiBase = process.env.HIVORA_API ?? 'https://api.hivora.com';
const token = process.env.HIVORA_TOKEN ?? '';
const projectId = process.env.HIVORA_PROJECT ?? '';
const agentId = process.env.HIVORA_AGENT ?? 'anonymous';

const isLocalMode = !token || !projectId || process.env.HIVORA_MODE === 'local';

if (isLocalMode && command !== 'start') {
  console.error('Error: Cloud synchronization commands require HIVORA_TOKEN and HIVORA_PROJECT.');
  console.error('  For local development, use "npx @hivora/orchestrator start"');
  process.exit(1);
}

const lockStore = isLocalMode
  ? localLockStore
  : new CloudLockStore({
      apiBaseUrl: apiBase,
      projectId,
      getAccessToken: () => token,
    });

const taskClient = isLocalMode
  ? undefined
  : new HivoraTaskClient({
      apiBase,
      token,
      projectId,
      agentId,
    });

// Helper for diff generation
function diffLines(oldStr: string, newStr: string): { type: 'added' | 'removed' | 'unchanged', text: string }[] {
  const oldLines = oldStr.split(/\r?\n/);
  const newLines = newStr.split(/\r?\n/);
  
  const dp: number[][] = Array.from({ length: oldLines.length + 1 }, () => Array(newLines.length + 1).fill(0));
  
  for (let i = 1; i <= oldLines.length; i++) {
    for (let j = 1; j <= newLines.length; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  const result: { type: 'added' | 'removed' | 'unchanged', text: string }[] = [];
  let i = oldLines.length;
  let j = newLines.length;
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      result.unshift({ type: 'unchanged', text: oldLines[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'added', text: newLines[j - 1] });
      j--;
    } else {
      result.unshift({ type: 'removed', text: oldLines[i - 1] });
      i--;
    }
  }
  
  return result;
}

function printDiff(fileName: string, original: string, proposed: string) {
  const diffs = diffLines(original, proposed);
  console.log(`\n\x1b[36m--- a/${fileName}\x1b[0m`);
  console.log(`\x1b[36m+++ b/${fileName}\x1b[0m`);
  console.log(`\x1b[90m@@ -1,${original.split('\n').length} +1,${proposed.split('\n').length} @@\x1b[0m`);
  
  for (const line of diffs) {
    if (line.type === 'unchanged') {
      console.log(`  ${line.text}`);
    } else if (line.type === 'added') {
      console.log(`\x1b[32m+ ${line.text}\x1b[0m`);
    } else if (line.type === 'removed') {
      console.log(`\x1b[31m- ${line.text}\x1b[0m`);
    }
  }
  console.log('\n');
}

// Commands router
if (command === 'start') {
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
} else if (command === 'tasks') {
  console.log(`Fetching tasks for project ${projectId}...`);
  taskClient.listTasks().then((tasks) => {
    if (tasks.length === 0) {
      console.log('No tasks found.');
      process.exit(0);
    }
    
    // Print a clean, formatted table
    const idHeader = 'ID'.padEnd(26);
    const statusHeader = 'STATUS'.padEnd(16);
    const priorityHeader = 'PRIORITY'.padEnd(10);
    const assigneeHeader = 'ASSIGNEE'.padEnd(20);
    const durationHeader = 'DURATION'.padEnd(10);
    const costHeader = 'COST'.padEnd(8);
    const titleHeader = 'TITLE';
    
    console.log(`\n${idHeader} ${statusHeader} ${priorityHeader} ${assigneeHeader} ${durationHeader} ${costHeader} ${titleHeader}`);
    console.log('=' .repeat(110));
    
    tasks.forEach((t: any) => {
      let statusColor = '\x1b[0m'; // default
      if (t.status === 'done') statusColor = '\x1b[32m'; // green
      else if (t.status === 'review_pending') statusColor = '\x1b[33m'; // yellow
      else if (t.status === 'doing') statusColor = '\x1b[34m'; // blue
      else if (t.status === 'conflict') statusColor = '\x1b[31m'; // red
      else statusColor = '\x1b[90m'; // gray
      
      const paddedStatus = t.status.padEnd(16);
      const statusStr = `${statusColor}${paddedStatus}\x1b[0m`;
      
      const assigneeStr = (t.assigneeId || 'unassigned').padEnd(20);
      const durationStr = (t.duration != null ? `${t.duration}s` : '-').padEnd(10);
      const costStr = (t.cost != null ? `$${t.cost.toFixed(3)}` : '-').padEnd(8);
      
      console.log(
        `${t.id.padEnd(26)} ` +
        `${statusStr} ` +
        `${t.priority.padEnd(10)} ` +
        `${assigneeStr} ` +
        `${durationStr} ` +
        `${costStr} ` +
        ` ${t.title}`
      );
    });
    console.log('\n');
    process.exit(0);
  }).catch((err) => {
    console.error('Error listing tasks:', err.message);
    process.exit(1);
  });
} else if (command === 'diff') {
  const taskId = process.argv[3];
  if (!taskId) {
    console.error('Error: task-id is required.');
    console.error('Usage: npx @hivora/orchestrator@latest diff <task-id>');
    process.exit(1);
  }
  
  console.log(`Fetching diff for task ${taskId}...`);
  taskClient.getTaskDiff(taskId).then((res) => {
    printDiff(res.file, res.original, res.proposed);
    process.exit(0);
  }).catch((err) => {
    console.error('Error fetching diff:', err.message);
    process.exit(1);
  });
} else if (command === 'approve') {
  const taskId = process.argv[3];
  if (!taskId) {
    console.error('Error: task-id is required.');
    console.error('Usage: npx @hivora/orchestrator@latest approve <task-id>');
    process.exit(1);
  }
  
  console.log(`Approving task ${taskId}...`);
  taskClient.approveTask(taskId).then(() => {
    console.log(`\n\x1b[32m✔ Task ${taskId} approved successfully! Changes written and committed.\x1b[0m\n`);
    process.exit(0);
  }).catch((err) => {
    console.error('Error approving task:', err.message);
    process.exit(1);
  });
} else if (command === 'reject') {
  const taskId = process.argv[3];
  if (!taskId) {
    console.error('Error: task-id is required.');
    console.error('Usage: npx @hivora/orchestrator@latest reject <task-id>');
    process.exit(1);
  }
  
  console.log(`Rejecting task ${taskId}...`);
  taskClient.rejectTask(taskId).then(() => {
    console.log(`\n\x1b[33m✔ Task ${taskId} rejected. Status reset to todo.\x1b[0m\n`);
    process.exit(0);
  }).catch((err) => {
    console.error('Error rejecting task:', err.message);
    process.exit(1);
  });
} else if (command === 'agent-mode') {
  const agentId = process.argv[3];
  const mode = process.argv[4] as 'thinking' | 'fast';
  if (!agentId || !mode || (mode !== 'thinking' && mode !== 'fast')) {
    console.error('Error: agent-id and mode (thinking|fast) are required.');
    console.error('Usage: npx @hivora/orchestrator@latest agent-mode <agent-id> <thinking|fast>');
    process.exit(1);
  }
  
  console.log(`Updating mode of agent ${agentId} to ${mode}...`);
  taskClient.updateAgentMode(agentId, mode).then(() => {
    console.log(`\n\x1b[32m✔ Agent ${agentId} mode set to ${mode} successfully.\x1b[0m\n`);
    process.exit(0);
  }).catch((err) => {
    console.error('Error updating agent mode:', err.message);
    process.exit(1);
  });
} else if (command === 'logs') {
  console.log(`Connecting to live log stream for project ${projectId}...`);
  
  const socket = io(apiBase, {
    auth: { token },
    query: { projectId }
  });
  
  socket.on('connect', () => {
    console.log(`\n\x1b[32m✔ Connected to live logs stream.\x1b[0m Watching for events... (Press Ctrl+C to exit)\n`);
  });
  
  socket.on('connect_error', (err: Error) => {
    console.error('\x1b[31mConnection error:\x1b[0m', err.message);
  });

  socket.on('event', (event: any) => {
    if (event.type === 'agent:log') {
      const { agentId, message, timestamp, level } = event.payload;
      const timeStr = new Date(timestamp).toLocaleTimeString();
      
      let levelColor = '\x1b[0m'; // reset
      let levelTag = '[INFO]';
      if (level === 'success') {
        levelColor = '\x1b[32m'; // green
        levelTag = '[SUCCESS]';
      } else if (level === 'warning') {
        levelColor = '\x1b[33m'; // yellow
        levelTag = '[WARNING]';
      } else if (level === 'error') {
        levelColor = '\x1b[31m'; // red
        levelTag = '[ERROR]';
      }
      
      console.log(`[${timeStr}] ${levelColor}${levelTag.padEnd(9)}\x1b[0m [Agent: ${agentId}] ${message}`);
    }
  });
}

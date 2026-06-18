import { runMcpServer } from './server';
import { localLockStore } from '../lock/localLockStore';

runMcpServer(localLockStore).catch((err: unknown) => {
  console.error('Failed to start MCP server:', err);
  process.exit(1);
});

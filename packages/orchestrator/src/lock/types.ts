export interface LockEntry {
  id?: string;
  projectId?: string;
  file: string;
  symbol: string;
  agentId: string;
  lockedAt: number | string;
}

export interface LockResult {
  success: boolean;
  message: string;
  lock?: LockEntry;
}

export interface ILockStore {
  lock(file: string, symbol: string, agentId: string): Promise<LockResult>;
  unlock(file: string, symbol: string, agentId: string): Promise<LockResult>;
  getLocks(): Promise<LockEntry[]>;
}

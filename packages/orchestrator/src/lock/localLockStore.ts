import type { ILockStore, LockEntry, LockResult } from './types';

interface LocalLock extends LockEntry {
  lockedAt: number;
}

const locks: LocalLock[] = [];

export class LocalLockStore implements ILockStore {
  async lock(file: string, symbol: string, agentId: string): Promise<LockResult> {
    const existing = locks.find((l) => l.file === file && l.symbol === symbol);
    if (existing) {
      if (existing.agentId === agentId) {
        return { success: true, message: 'Already locked by this agent.', lock: existing };
      }
      return {
        success: false,
        message: `Conflict! Locked by ${existing.agentId}.`,
      };
    }

    const entry: LocalLock = {
      file,
      symbol,
      agentId,
      lockedAt: Date.now(),
    };
    locks.push(entry);
    return { success: true, message: 'Locked successfully.', lock: entry };
  }

  async unlock(file: string, symbol: string, agentId: string): Promise<LockResult> {
    const index = locks.findIndex((l) => l.file === file && l.symbol === symbol);
    const lock = locks[index];
    if (!lock) {
      return { success: false, message: 'Not locked.' };
    }
    if (lock.agentId !== agentId) {
      return { success: false, message: `Cannot unlock. Locked by ${lock.agentId}.` };
    }
    locks.splice(index, 1);
    return { success: true, message: 'Unlocked successfully.' };
  }

  async getLocks(): Promise<LockEntry[]> {
    return locks.map((l) => ({ ...l }));
  }
}

export const localLockStore = new LocalLockStore();

export function lockSymbol(file: string, symbol: string, agentId: string) {
  return localLockStore.lock(file, symbol, agentId);
}

export function unlockSymbol(file: string, symbol: string, agentId: string) {
  return localLockStore.unlock(file, symbol, agentId);
}

export function getLocks() {
  return localLockStore.getLocks();
}

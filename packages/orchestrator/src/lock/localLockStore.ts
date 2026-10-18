import type { ILockStore, LockEntry, LockResult } from './types';

interface LocalLock extends LockEntry {
  lockedAt: number;
  ttlMs: number;
}

const DEFAULT_LOCK_TTL_MS = 15 * 60 * 1000; // 15 minutes timeout
let locks: LocalLock[] = [];

export class LocalLockStore implements ILockStore {
  private cleanExpiredLocks() {
    const now = Date.now();
    locks = locks.filter((l) => now - l.lockedAt < l.ttlMs);
  }

  async lock(file: string, symbol: string, agentId: string, ttlMs: number = DEFAULT_LOCK_TTL_MS): Promise<LockResult> {
    this.cleanExpiredLocks();
    const existing = locks.find((l) => l.file === file && l.symbol === symbol);
    if (existing) {
      if (existing.agentId === agentId) {
        existing.lockedAt = Date.now(); // refresh heartbeat
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
      ttlMs,
    };
    locks.push(entry);
    return { success: true, message: 'Locked successfully.', lock: entry };
  }

  async unlock(file: string, symbol: string, agentId: string): Promise<LockResult> {
    this.cleanExpiredLocks();
    const index = locks.findIndex((l) => l.file === file && l.symbol === symbol);
    const lock = locks[index];
    if (!lock) {
      return { success: false, message: 'Not locked or lock expired.' };
    }
    if (lock.agentId !== agentId) {
      return { success: false, message: `Cannot unlock. Locked by ${lock.agentId}.` };
    }
    locks.splice(index, 1);
    return { success: true, message: 'Unlocked successfully.' };
  }

  async getLocks(): Promise<LockEntry[]> {
    this.cleanExpiredLocks();
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

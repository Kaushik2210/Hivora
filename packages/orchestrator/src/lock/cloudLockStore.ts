import type { ILockStore, LockEntry, LockResult } from './types';

export interface CloudLockStoreOptions {
  apiBaseUrl: string;
  projectId: string;
  getAccessToken: () => string | null;
  getRefreshToken?: () => string | null;
  onUnauthorized?: () => void;
}

interface ApiLockResponse {
  id: string;
  projectId: string;
  file: string;
  symbol: string;
  agentId: string;
  lockedAt: string;
}

export class CloudLockStore implements ILockStore {
  constructor(private opts: CloudLockStoreOptions) {}

  private async request(path: string, body: unknown): Promise<unknown> {
    const token = this.opts.getAccessToken();
    const res = await fetch(`${this.opts.apiBaseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
      credentials: 'include',
    });

    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { message?: string };
      throw new Error(err.message ?? `Cloud lock request failed: ${res.status}`);
    }
    return res.json();
  }

  async lock(file: string, symbol: string, agentId: string): Promise<LockResult> {
    try {
      const data = await this.request(
        `/api/projects/${this.opts.projectId}/locks/lock`,
        { file, symbol, agentId },
      );
      const lock = data as ApiLockResponse;
      return { success: true, message: 'Locked successfully.', lock };
    } catch (e) {
      return { success: false, message: String((e as Error).message ?? e) };
    }
  }

  async unlock(file: string, symbol: string, agentId: string): Promise<LockResult> {
    try {
      await this.request(
        `/api/projects/${this.opts.projectId}/locks/unlock`,
        { file, symbol, agentId },
      );
      return { success: true, message: 'Unlocked successfully.' };
    } catch (e) {
      return { success: false, message: String((e as Error).message ?? e) };
    }
  }

  async getLocks(): Promise<LockEntry[]> {
    const token = this.opts.getAccessToken();
    const res = await fetch(
      `${this.opts.apiBaseUrl}/api/projects/${this.opts.projectId}/locks`,
      {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { data?: ApiLockResponse[] } | ApiLockResponse[];
    const arr = Array.isArray(data) ? data : data.data ?? [];
    return arr.map((l) => ({
      id: l.id,
      projectId: l.projectId,
      file: l.file,
      symbol: l.symbol,
      agentId: l.agentId,
      lockedAt: l.lockedAt,
    }));
  }
}

import type {
  ApiResponse,
  AuthTokens,
  User,
  Organization,
  Project,
  Task,
  Agent,
  Lock,
} from '../types/index.js';

export interface SdkOptions {
  baseUrl: string;
  getAccessToken?: () => string | null;
  getRefreshToken?: () => string | null;
  setTokens?: (tokens: AuthTokens) => void;
  onUnauthorized?: () => void;
}

export class HivoraApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'HivoraApiError';
  }
}

async function parseResponse<T>(res: Response): Promise<T> {
  const body = (await res.json().catch(() => ({}))) as ApiResponse<T>;
  if (body.error) {
    throw new HivoraApiError(body.code, body.message, res.status);
  }
  return body.data;
}

export class HivoraClient {
  constructor(private opts: SdkOptions) {}

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    auth = true,
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (auth) {
      const token = this.opts.getAccessToken?.();
      if (token) headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${this.opts.baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
    });

    if (res.status === 401 && auth && this.opts.getRefreshToken) {
      const refreshed = await this.refresh();
      if (refreshed) {
        return this.request<T>(method, path, body, auth);
      }
      this.opts.onUnauthorized?.();
      throw new HivoraApiError('UNAUTHORIZED', 'Session expired', 401);
    }

    if (!res.ok) {
      throw new HivoraApiError('HTTP_ERROR', `Request failed: ${res.status}`, res.status);
    }

    return parseResponse<T>(res);
  }

  async refresh(): Promise<boolean> {
    const refreshToken = this.opts.getRefreshToken?.();
    if (!refreshToken) return false;
    try {
      const res = await fetch(`${this.opts.baseUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
        credentials: 'include',
      });
      if (!res.ok) return false;
      const tokens = await parseResponse<AuthTokens>(res);
      this.opts.setTokens?.(tokens);
      return true;
    } catch {
      return false;
    }
  }

  async register(email: string, password: string, name?: string) {
    return this.request<User>('POST', '/api/auth/register', { email, password, name }, false);
  }

  async login(email: string, password: string) {
    return this.request<AuthTokens>('POST', '/api/auth/login', { email, password }, false);
  }

  async logout(refreshToken: string) {
    return this.request<{ success: boolean }>('POST', '/api/auth/logout', { refreshToken });
  }

  async me() {
    return this.request<User>('GET', '/api/auth/me');
  }

  async verifyEmail(token: string) {
    return this.request<User>('GET', `/api/auth/verify-email?token=${encodeURIComponent(token)}`, undefined, false);
  }

  async forgotPassword(email: string) {
    return this.request<{ success: boolean }>('POST', '/api/auth/forgot-password', { email }, false);
  }

  async resetPassword(token: string, password: string) {
    return this.request<{ success: boolean }>('POST', '/api/auth/reset-password', { token, password }, false);
  }

  async listOrganizations() {
    return this.request<Organization[]>('GET', '/api/organizations');
  }

  async createOrganization(name: string, slug: string) {
    return this.request<Organization>('POST', '/api/organizations', { name, slug });
  }

  async listProjects(orgId: string) {
    return this.request<Project[]>('GET', `/api/organizations/${orgId}/projects`);
  }

  async createProject(orgId: string, name: string, path?: string, description?: string) {
    return this.request<Project>('POST', `/api/organizations/${orgId}/projects`, { name, path, description });
  }

  async listTasks(projectId: string) {
    return this.request<Task[]>('GET', `/api/projects/${projectId}/tasks`);
  }

  async createTask(projectId: string, data: { title: string; description?: string; priority?: string; status?: string; assigneeId?: string }) {
    return this.request<Task>('POST', `/api/projects/${projectId}/tasks`, data);
  }

  async updateTask(projectId: string, taskId: string, data: Record<string, unknown>) {
    return this.request<Task>('PATCH', `/api/projects/${projectId}/tasks/${taskId}`, data);
  }

  async listAgents(projectId: string) {
    return this.request<Agent[]>('GET', `/api/projects/${projectId}/agents`);
  }

  async createAgent(projectId: string, data: { name: string; type: 'ai' | 'human'; provider?: string }) {
    return this.request<Agent>('POST', `/api/projects/${projectId}/agents`, data);
  }

  async listLocks(projectId: string) {
    return this.request<Lock[]>('GET', `/api/projects/${projectId}/locks`);
  }

  async lockSymbol(projectId: string, data: { file: string; symbol: string; agentId: string }) {
    return this.request<Lock>('POST', `/api/projects/${projectId}/locks/lock`, data);
  }

  async unlockSymbol(projectId: string, data: { file: string; symbol: string; agentId: string }) {
    return this.request<{ success: boolean }>('POST', `/api/projects/${projectId}/locks/unlock`, data);
  }

  async complete(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    provider: 'openai' | 'anthropic' | 'cohere' = 'anthropic',
    options?: { temperature?: number; maxTokens?: number; userApiKey?: string },
  ) {
    return this.request<{ content: string; provider: string; model: string }>(
      'POST',
      '/api/agents/complete',
      { messages, provider, ...options },
    );
  }

  async getAvailableProviders() {
    return this.request<{ available: string[]; configured: Record<string, boolean> }>(
      'GET',
      '/api/agents/providers',
    );
  }

  async getUserApiKeys() {
    return this.request<Array<{ provider: string; createdAt: string; updatedAt: string }>>(
      'GET',
      '/api/user/api-keys',
    );
  }

  async saveUserApiKey(provider: string, key: string) {
    return this.request<{ provider: string; createdAt: string; updatedAt: string }>(
      'POST',
      '/api/user/api-keys',
      { provider, key },
    );
  }

  async deleteUserApiKey(provider: string) {
    return this.request<{ deleted: boolean }>(
      'DELETE',
      `/api/user/api-keys/${provider}`,
    );
  }
}

export function createClient(opts: SdkOptions) {
  return new HivoraClient(opts);
}

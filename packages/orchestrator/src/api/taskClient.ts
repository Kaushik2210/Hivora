export interface HivoraTask {
  id: string
  projectId: string
  title: string
  description?: string | null
  status: 'todo' | 'doing' | 'done' | 'conflict'
  priority: 'low' | 'medium' | 'high'
  assigneeId?: string | null
  createdAt: string
}

export interface TaskClientOptions {
  apiBase: string
  token: string
  projectId: string
  agentId: string
}

export class HivoraTaskClient {
  constructor(private opts: TaskClientOptions) {}

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.opts.apiBase}${path}`
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.opts.token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { message?: string }
      throw new Error(err.message ?? `API error ${res.status}`)
    }
    const json = (await res.json()) as { data?: T; error?: boolean }
    return (json.data ?? json) as T
  }

  async getPendingTasks(): Promise<HivoraTask[]> {
    return this.request<HivoraTask[]>(
      'GET',
      `/api/projects/${this.opts.projectId}/tasks/pending`,
    )
  }

  async claimTask(taskId: string): Promise<HivoraTask> {
    return this.request<HivoraTask>(
      'POST',
      `/api/projects/${this.opts.projectId}/tasks/${taskId}/claim`,
      { agentId: this.opts.agentId },
    )
  }

  async completeTask(taskId: string): Promise<HivoraTask> {
    return this.request<HivoraTask>(
      'POST',
      `/api/projects/${this.opts.projectId}/tasks/${taskId}/complete`,
      { agentId: this.opts.agentId },
    )
  }

  async listTasks(): Promise<HivoraTask[]> {
    return this.request<HivoraTask[]>(
      'GET',
      `/api/projects/${this.opts.projectId}/tasks`,
    )
  }

  async getTaskDiff(taskId: string): Promise<{ file: string; original: string; proposed: string; agentId?: string }> {
    return this.request<{ file: string; original: string; proposed: string; agentId?: string }>(
      'GET',
      `/api/projects/${this.opts.projectId}/tasks/${taskId}/diff`,
    )
  }

  async approveTask(taskId: string): Promise<any> {
    return this.request<any>(
      'POST',
      `/api/projects/${this.opts.projectId}/tasks/${taskId}/approve`,
    )
  }

  async rejectTask(taskId: string): Promise<any> {
    return this.request<any>(
      'POST',
      `/api/projects/${this.opts.projectId}/tasks/${taskId}/reject`,
    )
  }

  async updateAgentMode(agentId: string, mode: 'thinking' | 'fast'): Promise<any> {
    return this.request<any>(
      'PATCH',
      `/api/projects/${this.opts.projectId}/agents/${agentId}`,
      { mode },
    )
  }
}

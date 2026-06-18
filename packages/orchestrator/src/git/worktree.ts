import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs-extra';

const execAsync = promisify(exec);

export class GitWorktreeManager {
  private repoPath: string;

  constructor(repoPath: string) {
    this.repoPath = repoPath;
  }

  async createWorktree(agentId: string, baseBranch: string = 'main'): Promise<{ path: string; branch: string }> {
    const branchName = `agent-${agentId}-${Date.now()}`;
    const worktreePath = path.join(this.repoPath, '.worktrees', agentId);

    await fs.ensureDir(path.join(this.repoPath, '.worktrees'));

    try {
      await execAsync(`git worktree add -b ${branchName} ${worktreePath} ${baseBranch}`, { cwd: this.repoPath });
      return { path: worktreePath, branch: branchName };
    } catch (error) {
      console.error('Failed to create worktree:', error);
      throw error;
    }
  }

  async removeWorktree(agentId: string): Promise<void> {
    const worktreePath = path.join(this.repoPath, '.worktrees', agentId);
    try {
      await execAsync(`git worktree remove --force ${worktreePath}`, { cwd: this.repoPath });
    } catch (error) {
      console.error('Failed to remove worktree:', error);
      throw error;
    }
  }

  async listWorktrees(): Promise<string[]> {
    try {
      const { stdout } = await execAsync('git worktree list', { cwd: this.repoPath });
      return stdout.split('\n').filter(line => line.trim().length > 0);
    } catch (error) {
      console.error('Failed to list worktrees:', error);
      throw error;
    }
  }
}

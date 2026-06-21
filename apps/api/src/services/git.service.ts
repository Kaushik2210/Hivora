import { execSync } from 'child_process';
import fs from 'fs';

export class GitService {
  /**
   * Helper to run a git command inside the given repository directory.
   */
  private static runGit(repoPath: string, command: string): string {
    if (!fs.existsSync(repoPath)) {
      throw new Error(`Repository path does not exist: ${repoPath}`);
    }
    try {
      const output = execSync(`git ${command}`, {
        cwd: repoPath,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'], // ignore stdin and stderr to prevent blocking/hanging
      });
      return output.trim();
    } catch (error) {
      console.warn(`[GitService] Error executing git ${command}:`, error instanceof Error ? error.message : error);
      throw error;
    }
  }

  /**
   * Checks out a branch for an active task. Creates it if it doesn't exist.
   */
  static checkoutTaskBranch(repoPath: string, taskId: string): void {
    try {
      const branchName = `agents/doing/task-${taskId}`;
      console.log(`[GitService] Creating & checking out branch ${branchName} in ${repoPath}`);
      // Ensure we are in a clean state, stash if dirty (optional, but keep it simple)
      this.runGit(repoPath, `checkout -b ${branchName}`);
    } catch (e) {
      // If branch already exists, just switch to it
      try {
        const branchName = `agents/doing/task-${taskId}`;
        this.runGit(repoPath, `checkout ${branchName}`);
      } catch (err) {
        console.error('[GitService] Failed to checkout task branch:', err);
      }
    }
  }

  /**
   * Commits all changes to the task branch and switches back to main/master.
   */
  static commitAndPublishTask(repoPath: string, taskId: string, taskTitle: string): void {
    try {
      const branchName = `agents/doing/task-${taskId}`;
      console.log(`[GitService] Committing task changes to ${branchName}`);
      
      // Stage files
      this.runGit(repoPath, 'add .');
      
      // Commit (ignore if nothing to commit)
      try {
        this.runGit(repoPath, `commit -m "feat: ${taskTitle} completed by AI Agent"`);
      } catch (err) {
        console.log('[GitService] Nothing to commit, index is clean.');
      }

      // Switch back to master/main
      try {
        this.runGit(repoPath, 'checkout main');
      } catch (err) {
        try {
          this.runGit(repoPath, 'checkout master');
        } catch (e) {
          console.warn('[GitService] Could not return to main or master branch.');
        }
      }
    } catch (e) {
      console.error('[GitService] Error committing task:', e);
    }
  }
}

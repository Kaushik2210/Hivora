import path from 'path'
import fs from 'fs-extra'
import { GitWorktreeManager } from '../git/worktree'
import type { ILockStore } from '../lock/types'
import { exec as _exec } from 'child_process'
import { promisify } from 'util'

const exec = promisify(_exec)

export interface ApplyChangeResult {
  success: boolean
  message: string
  commit?: { hash?: string; branch?: string }
}

export async function applyChangeWithLock(opts: {
  repoPath: string
  lockStore: ILockStore
  agentId: string
  projectId?: string
  file: string // relative to repo
  symbol: string
  patch: (current: string) => string
}): Promise<ApplyChangeResult> {
  const { repoPath, lockStore, agentId, file, symbol, patch } = opts
  // 1) try lock
  const lockRes = await lockStore.lock(file, symbol, agentId)
  if (!lockRes.success) {
    return { success: false, message: `Lock failed: ${lockRes.message}` }
  }

  const worktree = new GitWorktreeManager(repoPath)
  const agentKey = agentId.replace(/[^a-zA-Z0-9_-]/g, '-')
  let created = false
  let branchName: string | undefined
  try {
    // 2) create worktree
    const createdInfo = await worktree.createWorktree(agentKey)
    created = true
    branchName = createdInfo.branch
    const wtPath = createdInfo.path

    // 3) read target file (if missing, assume empty)
    const absPath = path.join(wtPath, file)
    await fs.ensureFile(absPath)
    const current = await fs.readFile(absPath, 'utf8')

    // 4) apply patch
    const next = patch(current)
    await fs.writeFile(absPath, next, 'utf8')

    // 5) git add & commit inside worktree
    await exec(`git add --all`, { cwd: wtPath })
    const commitMsg = `agent(${agentId}): edit ${file} [symbol=${symbol}]`
    try {
      await exec(`git commit -m "${commitMsg}"`, { cwd: wtPath })
    } catch {
      // Ignore if there is nothing new to commit
    }
    // get last commit hash
    const { stdout } = await exec('git rev-parse --short HEAD', { cwd: wtPath })
    const hash = stdout.trim()

    // 6) optionally push/merge strategy is left to operator

    // 7) cleanup worktree & branch
    await worktree.removeWorktree(agentKey, branchName)
    // 8) unlock
    await lockStore.unlock(file, symbol, agentId)

    return { success: true, message: 'Applied change', commit: { hash, branch: branchName } }
  } catch (err: any) {
    try {
      if (created) {
        await worktree.removeWorktree(agentKey, branchName)
      }
    } catch (e) {
      // ignore
    }
    // ensure unlock
    try {
      await lockStore.unlock(file, symbol, agentId)
    } catch (e) {
      // ignore
    }
    return { success: false, message: `Error applying change: ${err?.message ?? String(err)}` }
  }
}

export default applyChangeWithLock

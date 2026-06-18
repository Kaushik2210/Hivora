import path from 'path'
import { GitWorktreeManager } from '../git/worktree'

async function run() {
  const repo = path.resolve(__dirname, '../../..')
  const mgr = new GitWorktreeManager(repo)
  const agent = `test-${Date.now()}`
  const info = await mgr.createWorktree(agent)
  console.log('created', info)
  await mgr.removeWorktree(agent)
  console.log('removed')
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})

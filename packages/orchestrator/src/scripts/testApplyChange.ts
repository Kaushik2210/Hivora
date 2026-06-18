import path from 'path'
import { applyChangeWithLock } from '../operations/applyChange'
import { localLockStore } from '../lock/localLockStore'

async function main() {
  const repoRoot = path.resolve(__dirname, '../../..')
  const agentId = 'test-agent-1'
  const file = 'README.md'
  const symbol = 'testSymbol'

  const res = await applyChangeWithLock({
    repoPath: repoRoot,
    lockStore: localLockStore,
    agentId,
    file,
    symbol,
    patch: (current) => current + "\n<!-- patch from test-agent -->\n",
  })

  console.log('Result:', res)
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}

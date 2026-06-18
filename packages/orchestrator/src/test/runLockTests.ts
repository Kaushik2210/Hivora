import assert from 'assert'
import { localLockStore } from '../lock/localLockStore'

async function run() {
  const file = 'test.txt'
  const symbol = 'fn'
  const agentA = 'a'
  const agentB = 'b'

  const r1 = await localLockStore.lock(file, symbol, agentA)
  assert(r1.success, 'agentA should lock')

  const r2 = await localLockStore.lock(file, symbol, agentB)
  assert(!r2.success, 'agentB should not acquire lock')

  const r3 = await localLockStore.unlock(file, symbol, agentB)
  assert(!r3.success, 'agentB cannot unlock')

  const r4 = await localLockStore.unlock(file, symbol, agentA)
  assert(r4.success, 'agentA can unlock')

  console.log('lock tests passed')
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})

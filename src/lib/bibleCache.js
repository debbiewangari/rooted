import { openDB } from 'idb'

const DB_NAME = 'rooted-bible-cache'
const DB_VERSION = 1
const PASSAGES_STORE = 'bibleCache'

// Just a regenerable cache of bible-api.com responses — not user content, so
// it stays in local IndexedDB rather than syncing to the account.
function getDb() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(PASSAGES_STORE)) {
        db.createObjectStore(PASSAGES_STORE, { keyPath: 'reference' })
      }
    },
  })
}

export async function cachePassage(reference, data) {
  const db = await getDb()
  await db.put(PASSAGES_STORE, { reference, data, cachedAt: Date.now() })
}

export async function getCachedPassage(reference) {
  const db = await getDb()
  const row = await db.get(PASSAGES_STORE, reference)
  return row?.data ?? null
}

export async function listCachedPassages() {
  const db = await getDb()
  const rows = await db.getAll(PASSAGES_STORE)
  return rows.sort((a, b) => b.cachedAt - a.cachedAt)
}

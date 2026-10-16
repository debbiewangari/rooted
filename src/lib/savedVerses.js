const KEY = 'rooted:savedVerses'

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

export function isVerseSaved(reference) {
  return readAll().includes(reference)
}

export function toggleSavedVerse(reference) {
  const all = readAll()
  const next = all.includes(reference) ? all.filter((r) => r !== reference) : [...all, reference]
  localStorage.setItem(KEY, JSON.stringify(next))
  return next.includes(reference)
}

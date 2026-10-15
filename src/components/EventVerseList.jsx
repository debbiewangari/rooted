import { useState } from 'react'
import { FilledButton } from './Button'
import { DEFAULT_TRANSLATION, fetchPassage } from '../lib/bible'

const TRANSLATION_KEY = 'rooted:translation'

// Each saved reference starts collapsed; tapping it fetches and shows the
// actual scripture text (via the same Bible API/cache as the Bible tab).
export function EventVerseList({ verses, onAdd, onRemove }) {
  const [newRef, setNewRef] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [cache, setCache] = useState({})

  async function toggle(entry) {
    if (expandedId === entry.id) {
      setExpandedId(null)
      return
    }
    setExpandedId(entry.id)
    if (cache[entry.id]?.status === 'done') return
    setCache((c) => ({ ...c, [entry.id]: { status: 'loading' } }))
    try {
      const translation = localStorage.getItem(TRANSLATION_KEY) || DEFAULT_TRANSLATION
      const { data } = await fetchPassage(entry.reference, translation)
      setCache((c) => ({ ...c, [entry.id]: { status: 'done', text: (data.text || '').trim() } }))
    } catch (err) {
      setCache((c) => ({
        ...c,
        [entry.id]: { status: 'error', error: err.message || 'Could not load that verse.' },
      }))
    }
  }

  function handleAdd() {
    if (!newRef.trim()) return
    onAdd(newRef.trim())
    setNewRef('')
  }

  return (
    <div>
      {verses.length === 0 && <p className="font-body text-sm text-black/40">No verses added yet.</p>}

      <div className="flex flex-col gap-2">
        {verses.map((entry) => {
          const expanded = expandedId === entry.id
          const state = cache[entry.id]
          return (
            <div key={entry.id} className="rounded-card border border-black/10 bg-pure-white">
              <button
                type="button"
                onClick={() => toggle(entry)}
                className="flex w-full items-center justify-between px-3 py-2.5"
              >
                <span className="font-display text-base font-medium text-ink-black">{entry.reference}</span>
                <span className="font-label text-xs text-black/40">{expanded ? '▲' : '▼'}</span>
              </button>
              {expanded && (
                <div className="border-t border-black/10 px-3 py-3">
                  {(!state || state.status === 'loading') && (
                    <p className="font-body text-sm text-black/40">Loading…</p>
                  )}
                  {state?.status === 'error' && <p className="font-body text-sm text-burnt-orange">{state.error}</p>}
                  {state?.status === 'done' && (
                    <p className="font-body text-sm italic text-black/70">“{state.text}”</p>
                  )}
                  <button
                    type="button"
                    onClick={() => onRemove(entry.id)}
                    className="mt-2 font-label text-[10px] uppercase tracking-label text-black/30"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={newRef}
          onChange={(e) => setNewRef(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAdd()
            }
          }}
          placeholder="e.g. Daniel 4:34-35"
          className="flex-1 rounded-card border border-black/10 bg-pure-white px-3 py-2 font-body text-sm focus:outline-none"
        />
        <FilledButton type="button" onClick={handleAdd} className="px-5 py-2 text-[11px]">
          Add
        </FilledButton>
      </div>
    </div>
  )
}

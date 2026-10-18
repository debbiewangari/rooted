import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { resolveHighlightHex } from '../lib/bible'
import { listHighlights, removeHighlight } from '../lib/db'

export function SavedVerses() {
  const [rows, setRows] = useState(null)

  useEffect(() => {
    listHighlights().then((data) => setRows(data.slice().sort((a, b) => b.updatedAt - a.updatedAt)))
  }, [])

  async function handleRemove(id) {
    await removeHighlight(id)
    setRows((prev) => prev.filter((r) => r.id !== id))
  }

  return (
    <div className="min-h-screen px-6 pt-10 pb-6">
      <Link to="/bible" className="font-label text-[11px] uppercase tracking-label text-deep-indigo">
        ← Back to Bible
      </Link>
      <p className="mt-4 font-label text-xs uppercase tracking-label text-black/40">Scripture</p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-ink-black">Saved Verses</h1>

      {rows === null && <p className="mt-8 font-body text-sm text-black/50">Loading…</p>}
      {rows?.length === 0 && (
        <p className="mt-8 font-body text-sm text-black/50">
          Nothing saved yet — select a verse in the Bible tab to copy, save or highlight it.
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3">
        {rows?.map((row) => {
          const hex = resolveHighlightHex(row.color)
          return (
            <div
              key={row.id}
              className="rounded-card border border-black/10 bg-pure-white px-4 py-3"
              style={hex ? { backgroundColor: `${hex}26` } : undefined}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-label text-[11px] uppercase tracking-label text-deep-indigo">{row.reference}</p>
                <button
                  type="button"
                  onClick={() => handleRemove(row.id)}
                  className="shrink-0 font-label text-[10px] uppercase tracking-label text-black/30"
                >
                  Remove
                </button>
              </div>
              <p className="mt-1 font-body text-sm text-black/80">{row.text}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

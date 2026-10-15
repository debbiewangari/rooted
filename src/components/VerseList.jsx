import { useEffect, useState } from 'react'
import { HIGHLIGHT_COLORS, verseKey } from '../lib/bible'
import { listHighlights, removeHighlight, setHighlight } from '../lib/db'

// Renders a passage's verses with tap-to-highlight. Highlights are loaded
// from IndexedDB here so this works the same wherever a passage is shown
// (Bible reader, theme detail, ...) without duplicating the picker logic.
export function VerseList({ verses, fallbackText, className = '' }) {
  const [highlights, setHighlights] = useState({})
  const [activeVerseKey, setActiveVerseKey] = useState(null)

  useEffect(() => {
    listHighlights().then((rows) => {
      const map = {}
      rows.forEach((row) => {
        map[row.id] = row.color
      })
      setHighlights(map)
    })
  }, [])

  async function handleHighlight(v, colorId) {
    const key = verseKey(v)
    await setHighlight(key, {
      color: colorId,
      reference: `${v.book_name} ${v.chapter}:${v.verse}`,
      text: v.text.trim(),
    })
    setHighlights((prev) => ({ ...prev, [key]: colorId }))
    setActiveVerseKey(null)
  }

  async function handleClearHighlight(key) {
    await removeHighlight(key)
    setHighlights((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
    setActiveVerseKey(null)
  }

  if (!verses?.length) {
    return <p className={`font-body text-base leading-relaxed text-black/80 ${className}`}>{fallbackText}</p>
  }

  return (
    <div className={className}>
      {verses.map((v) => {
        const key = verseKey(v)
        const colorId = highlights[key]
        const color = HIGHLIGHT_COLORS.find((c) => c.id === colorId)
        const isActive = activeVerseKey === key
        return (
          <div key={v.verse}>
            <p
              onClick={() => setActiveVerseKey(isActive ? null : key)}
              className="cursor-pointer rounded px-1 py-0.5 font-body text-base leading-relaxed text-black/80"
              style={color ? { backgroundColor: `${color.hex}4d` } : undefined}
            >
              <span className="mr-1 font-label text-xs text-black/40">{v.verse}</span>
              {v.text.trim()}
            </p>
            {isActive && (
              <div className="mb-1 mt-1 flex items-center gap-2 pl-1">
                {HIGHLIGHT_COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleHighlight(v, c.id)}
                    className="h-6 w-6 rounded-full border border-black/10"
                    style={{ backgroundColor: c.hex }}
                    aria-label={`Highlight ${c.id}`}
                  />
                ))}
                {colorId && (
                  <button
                    type="button"
                    onClick={() => handleClearHighlight(key)}
                    className="font-label text-[10px] uppercase tracking-label text-black/40"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

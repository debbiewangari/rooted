import { useEffect, useRef, useState } from 'react'
import { HIGHLIGHT_COLORS, verseKey } from '../lib/bible'
import { listHighlights, removeHighlight, setHighlight } from '../lib/db'

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  )
}

function SaveIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 4h12v16l-6-4-6 4z" strokeLinejoin="round" />
    </svg>
  )
}

function HighlightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="m9 15 6-6 3 3-6 6H9z" strokeLinejoin="round" />
      <path d="m5 19 2-4 2 2z" />
    </svg>
  )
}

// Renders a passage's verses with press-and-select highlighting: select any
// stretch of text (same gesture as any native text selection) and a small
// floating toolbar offers Copy / Save / Highlight, the last expanding in
// place to the color picker. Highlights are loaded fresh here so this works
// the same wherever a passage is shown (Bible reader, theme detail, ...)
// without duplicating the picker logic.
export function VerseList({ verses, fallbackText, className = '' }) {
  const [highlights, setHighlights] = useState({})
  const [selection, setSelection] = useState(null) // { verses, text, rect }
  const [mode, setMode] = useState('menu') // 'menu' | 'colors'
  const [copied, setCopied] = useState(false)
  const containerRef = useRef(null)
  // Tapping a toolbar button is itself a mousedown outside the selected
  // text, which some browsers collapse the native selection for before the
  // click ever fires — wiping our React selection state (and the toolbar
  // with it) mid-gesture. While a toolbar interaction is in flight, the
  // selectionchange handler ignores that collapse; every action handler
  // clears this flag once it's done deciding what to do with the selection.
  const toolbarInteractingRef = useRef(false)

  useEffect(() => {
    listHighlights().then((rows) => {
      const map = {}
      rows.forEach((row) => {
        map[row.id] = row.color
      })
      setHighlights(map)
    })
  }, [])

  useEffect(() => {
    function handleSelectionChange() {
      if (toolbarInteractingRef.current) return
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
        setSelection(null)
        return
      }
      const range = sel.getRangeAt(0)
      const container = containerRef.current
      if (!container || !container.contains(range.commonAncestorContainer)) {
        setSelection(null)
        return
      }
      const touched = []
      container.querySelectorAll('[data-verse-key]').forEach((el) => {
        if (range.intersectsNode(el)) {
          const key = el.getAttribute('data-verse-key')
          const v = verses.find((vv) => verseKey(vv) === key)
          if (v) touched.push(v)
        }
      })
      if (touched.length === 0) {
        setSelection(null)
        return
      }
      setSelection({ verses: touched, text: sel.toString(), rect: range.getBoundingClientRect() })
      setMode('menu')
      setCopied(false)
    }

    document.addEventListener('selectionchange', handleSelectionChange)
    return () => document.removeEventListener('selectionchange', handleSelectionChange)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verses])

  function clearSelection() {
    window.getSelection()?.removeAllRanges()
    setSelection(null)
    setMode('menu')
    toolbarInteractingRef.current = false
  }

  function handleToolbarMouseDown() {
    toolbarInteractingRef.current = true
  }

  function handleShowColors() {
    setMode('colors')
    toolbarInteractingRef.current = false
  }

  async function handleCopy() {
    if (!selection) return
    try {
      await navigator.clipboard.writeText(selection.text)
      setCopied(true)
      setTimeout(clearSelection, 700)
    } catch {
      clearSelection()
    }
  }

  function handleSave() {
    applyColor('saved')
  }

  async function applyColor(colorId) {
    if (!selection) return
    for (const v of selection.verses) {
      const key = verseKey(v)
      await setHighlight(key, { color: colorId, reference: `${v.book_name} ${v.chapter}:${v.verse}`, text: v.text.trim() })
      setHighlights((prev) => ({ ...prev, [key]: colorId }))
    }
    clearSelection()
  }

  async function handleClear() {
    if (!selection) return
    for (const v of selection.verses) {
      const key = verseKey(v)
      if (highlights[key]) {
        await removeHighlight(key)
        setHighlights((prev) => {
          const next = { ...prev }
          delete next[key]
          return next
        })
      }
    }
    clearSelection()
  }

  if (!verses?.length) {
    return <p className={`font-body text-base leading-relaxed text-black/80 ${className}`}>{fallbackText}</p>
  }

  const hasExistingHighlight = selection?.verses.some((v) => highlights[verseKey(v)])
  const toolbarLeft = selection
    ? Math.min(Math.max(selection.rect.left + selection.rect.width / 2, 90), window.innerWidth - 90)
    : 0
  const toolbarTop = selection ? Math.max(selection.rect.top - 10, 64) : 0

  return (
    <>
      <div ref={containerRef} className={className}>
        {verses.map((v) => {
          const key = verseKey(v)
          const colorId = highlights[key]
          const color = HIGHLIGHT_COLORS.find((c) => c.id === colorId)
          return (
            <p
              key={v.verse}
              data-verse-key={key}
              className="rounded px-1 py-0.5 font-body text-base leading-relaxed text-black/80"
              style={color ? { backgroundColor: `${color.hex}4d` } : undefined}
            >
              <span className="mr-1 select-none font-label text-xs text-black/40">{v.verse}</span>
              {v.text.trim()}
            </p>
          )
        })}
      </div>

      {selection && (
        <div
          onMouseDown={handleToolbarMouseDown}
          className="fixed z-50 -translate-x-1/2 -translate-y-full rounded-pill bg-ink-black px-1 py-1 shadow-xl-2"
          style={{ left: toolbarLeft, top: toolbarTop }}
        >
          {mode === 'menu' ? (
            <div className="flex items-center">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleCopy}
                className="flex flex-col items-center gap-0.5 rounded-pill px-3 py-1.5 text-pure-white"
              >
                <CopyIcon />
                <span className="font-label text-[9px] uppercase tracking-label">{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <span className="h-6 w-px bg-pure-white/20" />
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleSave}
                className="flex flex-col items-center gap-0.5 rounded-pill px-3 py-1.5 text-pure-white"
              >
                <SaveIcon />
                <span className="font-label text-[9px] uppercase tracking-label">Save</span>
              </button>
              <span className="h-6 w-px bg-pure-white/20" />
              <button
                type="button"
                onClick={handleShowColors}
                className="flex flex-col items-center gap-0.5 rounded-pill px-3 py-1.5 text-pure-white"
              >
                <HighlightIcon />
                <span className="font-label text-[9px] uppercase tracking-label">Highlight</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-2 py-1">
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyColor(c.id)}
                  className="h-6 w-6 shrink-0 rounded-full border border-pure-white/40"
                  style={{ backgroundColor: c.hex }}
                  aria-label={`Highlight ${c.id}`}
                />
              ))}
              {hasExistingHighlight && (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleClear}
                  className="shrink-0 font-label text-[9px] uppercase tracking-label text-pure-white/70"
                >
                  Clear
                </button>
              )}
            </div>
          )}
          <div className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-[6px] border-t-[6px] border-x-transparent border-t-ink-black" />
        </div>
      )}
    </>
  )
}

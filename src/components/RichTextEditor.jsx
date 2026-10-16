import { useEffect, useRef } from 'react'

// Lightweight contentEditable editor (bold / italic / bullets) — no new
// dependency pulled in just for basic formatting. Content is stored as the
// HTML the browser produces; this surface is local-only and single-user,
// so that tradeoff is fine here.
export function RichTextEditor({ value, onChange, onBlur, placeholder }) {
  const ref = useRef(null)
  // Starts as a sentinel (never equal to a real value) rather than `value`
  // itself, so the sync effect below always writes the initial content into
  // the DOM on mount — this component can now mount pre-populated (e.g.
  // switching from a read-only view straight into edit mode), not just
  // empty-then-filled.
  const lastValue = useRef(null)

  useEffect(() => {
    if (ref.current && value !== lastValue.current && document.activeElement !== ref.current) {
      ref.current.innerHTML = value || ''
      lastValue.current = value
    }
  }, [value])

  function exec(command) {
    ref.current?.focus()
    document.execCommand(command)
    handleInput()
  }

  function handleInput() {
    const html = ref.current?.innerHTML || ''
    lastValue.current = html
    onChange(html)
  }

  return (
    <div className="rounded-card border border-black/10 bg-pure-white">
      <div className="flex gap-1 border-b border-black/10 px-2 py-1.5">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec('bold')}
          className="flex h-7 w-7 items-center justify-center rounded font-display text-sm font-bold text-deep-indigo hover:bg-cream-paper"
          aria-label="Bold"
        >
          B
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec('italic')}
          className="flex h-7 w-7 items-center justify-center rounded font-display text-sm italic text-deep-indigo hover:bg-cream-paper"
          aria-label="Italic"
        >
          i
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec('insertUnorderedList')}
          className="flex h-7 w-7 items-center justify-center rounded font-label text-sm text-deep-indigo hover:bg-cream-paper"
          aria-label="Bullet list"
        >
          •≡
        </button>
      </div>
      <div
        ref={ref}
        contentEditable
        data-placeholder={placeholder}
        onInput={handleInput}
        onBlur={onBlur}
        className="rich-text-editor min-h-[140px] px-3 py-2.5 font-body text-sm text-black/80 focus:outline-none"
        suppressContentEditableWarning
      />
    </div>
  )
}

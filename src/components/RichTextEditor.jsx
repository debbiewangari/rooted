import { useEffect, useRef, useState } from 'react'
import { HIGHLIGHT_COLORS } from '../lib/bible'
import { uploadNoteMedia } from '../lib/db'

function ImageIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="m4 17 5-5 4 4 3-3 4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function LinkGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 15 15 9" strokeLinecap="round" />
      <path
        d="M10.5 6.5 12 5a4 4 0 0 1 5.66 5.66l-1.5 1.5M13.5 17.5 12 19a4 4 0 0 1-5.66-5.66l1.5-1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function HighlightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="m9 15 6-6 3 3-6 6H9z" strokeLinejoin="round" />
      <path d="m5 19 2-4 2 2z" />
    </svg>
  )
}

function TextColorIcon() {
  return (
    <span className="flex flex-col items-center leading-none">
      <span className="font-display text-xs font-bold">A</span>
      <span className="mt-0.5 h-[3px] w-4 rounded-full bg-gradient-to-r from-[#ed7328] via-[#234386] to-[#2f6b4f]" />
    </span>
  )
}

function ChevronDown() {
  return (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const FONT_OPTIONS = [
  { label: 'Default', value: '"Plus Jakarta Sans", sans-serif' },
  { label: 'Serif', value: '"Lora", Georgia, serif' },
  { label: 'Mono', value: '"Space Mono", "Courier New", monospace' },
  { label: 'Handwritten', value: '"Caveat", cursive' },
]

// Darker/more saturated than HIGHLIGHT_COLORS on purpose — those are meant
// as pale background washes, these need to stay readable as foreground text.
const TEXT_COLORS = [
  { id: 'ink', hex: '#111111' },
  { id: 'indigo', hex: '#234386' },
  { id: 'orange', hex: '#ed7328' },
  { id: 'forest', hex: '#2f6b4f' },
  { id: 'wine', hex: '#a33b4e' },
]

const SIZE_OPTIONS = [
  { label: 'Small', value: '2' },
  { label: 'Normal', value: '3' },
  { label: 'Large', value: '5' },
  { label: 'X-Large', value: '7' },
]

const BLOCK_OPTIONS = [
  { label: 'Paragraph', value: 'P' },
  { label: 'Heading', value: 'H3' },
  { label: 'Quote', value: 'BLOCKQUOTE' },
]

function Divider() {
  return <span className="mx-0.5 h-5 w-px shrink-0 self-center bg-black/10" />
}

// Lightweight contentEditable editor (bold / italic / underline / bullets /
// numbered lists / font / size / highlight / inline media) — no new
// dependency pulled in just for formatting. Content is stored as the HTML
// the browser produces; this surface is local-only and single-user, so
// that tradeoff is fine here.
export function RichTextEditor({ value, onChange, onBlur, placeholder, onLink }) {
  const ref = useRef(null)
  const fileInputRef = useRef(null)
  const colorInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [openMenu, setOpenMenu] = useState(null) // 'font' | 'size' | 'block' | 'highlight' | 'color' | null
  // Opening the native file picker (or a native <input type="color">) blurs
  // the editable div the moment the dialog appears — without this, that
  // blur alone (before the user has picked anything) would fire `onBlur`
  // and, in callers that use it to leave edit mode, unmount this editor out
  // from under the picker.
  const suppressBlurRef = useRef(false)
  // The custom-color swatch needs real focus to open the native color
  // picker, which collapses the contentEditable's text selection the
  // moment focus moves — so the selection is captured just before that
  // happens and restored right before applying the chosen color.
  const savedRangeRef = useRef(null)
  // Which execCommand the custom-color input's result should apply to —
  // the highlight swatch and the text-color swatch share one hidden
  // <input type="color"> rather than each needing their own.
  const pendingColorCommandRef = useRef('hiliteColor')
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

  // Canceling the file dialog without picking anything fires no `change`
  // event in every browser, so this is the fallback that still clears the
  // blur guard above in that case.
  useEffect(() => {
    const input = fileInputRef.current
    if (!input) return
    function handleCancel() {
      suppressBlurRef.current = false
    }
    input.addEventListener('cancel', handleCancel)
    return () => input.removeEventListener('cancel', handleCancel)
  }, [])

  // Same fallback for the custom-color picker (shared by the highlight and
  // text-color swatches).
  useEffect(() => {
    const input = colorInputRef.current
    if (!input) return
    function handleCancel() {
      suppressBlurRef.current = false
    }
    input.addEventListener('cancel', handleCancel)
    return () => input.removeEventListener('cancel', handleCancel)
  }, [])

  function exec(command, value) {
    ref.current?.focus()
    document.execCommand(command, false, value)
    handleInput()
  }

  function handleInput() {
    const html = ref.current?.innerHTML || ''
    lastValue.current = html
    onChange(html)
  }

  function focusEnd() {
    const el = ref.current
    if (!el) return
    el.focus()
    const range = document.createRange()
    range.selectNodeContents(el)
    range.collapse(false)
    const sel = window.getSelection()
    sel.removeAllRanges()
    sel.addRange(range)
  }

  function toggleMenu(name) {
    setOpenMenu((m) => (m === name ? null : name))
  }

  function openMediaPicker() {
    suppressBlurRef.current = true
    fileInputRef.current?.click()
  }

  async function handleMediaChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) {
      suppressBlurRef.current = false
      return
    }
    setUploading(true)
    try {
      const url = await uploadNoteMedia(file)
      focusEnd()
      const html = file.type.startsWith('video/')
        ? `<video src="${url}" controls style="max-width:100%;border-radius:8px"></video><br>`
        : `<img src="${url}" alt="" style="max-width:100%;border-radius:8px" /><br>`
      document.execCommand('insertHTML', false, html)
      handleInput()
    } catch (err) {
      console.error('Media upload failed', err)
    } finally {
      setUploading(false)
      suppressBlurRef.current = false
    }
  }

  function openCustomColor(command) {
    return () => {
      pendingColorCommandRef.current = command
      const sel = window.getSelection()
      if (sel && sel.rangeCount > 0 && ref.current?.contains(sel.anchorNode)) {
        savedRangeRef.current = sel.getRangeAt(0).cloneRange()
      }
      suppressBlurRef.current = true
      colorInputRef.current?.click()
    }
  }

  function handleCustomColor(e) {
    const value = e.target.value
    suppressBlurRef.current = false
    const range = savedRangeRef.current
    if (range) {
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)
    }
    exec(pendingColorCommandRef.current, value)
    setOpenMenu(null)
  }

  function handleEditableBlur(e) {
    if (suppressBlurRef.current) return
    onBlur?.(e)
  }

  return (
    <div className="rounded-card border border-black/10 bg-pure-white">
      <div className="flex flex-wrap items-center gap-1 border-b border-black/10 px-2 py-1.5">
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => toggleMenu('font')}
            className="flex h-7 items-center gap-0.5 rounded px-1.5 font-label text-[9px] uppercase tracking-label text-deep-indigo hover:bg-cream-paper"
            aria-label="Font"
          >
            Font <ChevronDown />
          </button>
          {openMenu === 'font' && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setOpenMenu(null)} />
              <div className="absolute left-0 top-full z-40 mt-1 w-36 overflow-hidden rounded-card border border-black/8 bg-pure-white shadow-xl-2">
                {FONT_OPTIONS.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      exec('fontName', f.value)
                      setOpenMenu(null)
                    }}
                    style={{ fontFamily: f.value }}
                    className="block w-full px-3 py-2 text-left text-sm text-ink-black hover:bg-cream-paper"
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => toggleMenu('size')}
            className="flex h-7 items-center gap-0.5 rounded px-1.5 font-label text-[9px] uppercase tracking-label text-deep-indigo hover:bg-cream-paper"
            aria-label="Font size"
          >
            Size <ChevronDown />
          </button>
          {openMenu === 'size' && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setOpenMenu(null)} />
              <div className="absolute left-0 top-full z-40 mt-1 w-32 overflow-hidden rounded-card border border-black/8 bg-pure-white shadow-xl-2">
                {SIZE_OPTIONS.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      exec('fontSize', s.value)
                      setOpenMenu(null)
                    }}
                    className="block w-full px-3 py-2 text-left font-body text-sm text-ink-black hover:bg-cream-paper"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => toggleMenu('block')}
            className="flex h-7 items-center gap-0.5 rounded px-1.5 font-label text-[9px] uppercase tracking-label text-deep-indigo hover:bg-cream-paper"
            aria-label="Block style"
          >
            Block <ChevronDown />
          </button>
          {openMenu === 'block' && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setOpenMenu(null)} />
              <div className="absolute left-0 top-full z-40 mt-1 w-36 overflow-hidden rounded-card border border-black/8 bg-pure-white shadow-xl-2">
                {BLOCK_OPTIONS.map((b) => (
                  <button
                    key={b.value}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      exec('formatBlock', `<${b.value}>`)
                      setOpenMenu(null)
                    }}
                    className="block w-full px-3 py-2 text-left font-body text-sm text-ink-black hover:bg-cream-paper"
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <Divider />

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
          onClick={() => exec('underline')}
          className="flex h-7 w-7 items-center justify-center rounded font-display text-sm text-deep-indigo underline hover:bg-cream-paper"
          aria-label="Underline"
        >
          U
        </button>

        <Divider />

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec('insertUnorderedList')}
          className="flex h-7 w-7 items-center justify-center rounded font-label text-sm text-deep-indigo hover:bg-cream-paper"
          aria-label="Bullet list"
        >
          •≡
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec('insertOrderedList')}
          className="flex h-7 w-7 items-center justify-center rounded font-label text-[10px] text-deep-indigo hover:bg-cream-paper"
          aria-label="Numbered list"
        >
          1≡
        </button>

        <Divider />

        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => toggleMenu('highlight')}
            className="flex h-7 items-center gap-0.5 rounded px-1 text-deep-indigo hover:bg-cream-paper"
            aria-label="Highlight"
          >
            <HighlightIcon />
            <ChevronDown />
          </button>
          {openMenu === 'highlight' && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setOpenMenu(null)} />
              <div className="absolute left-0 top-full z-40 mt-1 w-44 overflow-hidden rounded-card border border-black/8 bg-pure-white p-3 shadow-xl-2">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      exec('hiliteColor', 'transparent')
                      setOpenMenu(null)
                    }}
                    aria-label="Clear highlight"
                    className="flex h-7 w-7 items-center justify-center rounded-pill border border-black/15 bg-pure-white font-label text-[10px] text-black/40"
                  >
                    ✕
                  </button>
                  {HIGHLIGHT_COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        exec('hiliteColor', c.hex)
                        setOpenMenu(null)
                      }}
                      aria-label={c.id}
                      className="h-7 w-7 rounded-pill border border-black/10"
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                  <button
                    type="button"
                    onMouseDown={openCustomColor('hiliteColor')}
                    aria-label="Custom highlight color"
                    className="flex h-7 w-7 items-center justify-center rounded-pill border border-black/15 bg-[conic-gradient(red,orange,yellow,green,blue,violet,red)] font-label text-[8px] text-pure-white"
                  >
                    +
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => toggleMenu('color')}
            className="flex h-7 items-center gap-0.5 rounded px-1 text-deep-indigo hover:bg-cream-paper"
            aria-label="Text color"
          >
            <TextColorIcon />
            <ChevronDown />
          </button>
          {openMenu === 'color' && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setOpenMenu(null)} />
              <div className="absolute left-0 top-full z-40 mt-1 w-44 overflow-hidden rounded-card border border-black/8 bg-pure-white p-3 shadow-xl-2">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      exec('foreColor', 'inherit')
                      setOpenMenu(null)
                    }}
                    aria-label="Clear text color"
                    className="flex h-7 w-7 items-center justify-center rounded-pill border border-black/15 bg-pure-white font-label text-[10px] text-black/40"
                  >
                    ✕
                  </button>
                  {TEXT_COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        exec('foreColor', c.hex)
                        setOpenMenu(null)
                      }}
                      aria-label={c.id}
                      className="h-7 w-7 rounded-pill border border-black/10"
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                  <button
                    type="button"
                    onMouseDown={openCustomColor('foreColor')}
                    aria-label="Custom text color"
                    className="flex h-7 w-7 items-center justify-center rounded-pill border border-black/15 bg-[conic-gradient(red,orange,yellow,green,blue,violet,red)] font-label text-[8px] text-pure-white"
                  >
                    +
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <input ref={colorInputRef} type="color" onChange={handleCustomColor} className="sr-only" />

        {onLink && (
          <>
            <Divider />
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={onLink}
              className="flex h-7 w-7 items-center justify-center rounded text-deep-indigo hover:bg-cream-paper"
              aria-label="Link to another entry"
            >
              <LinkGlyph />
            </button>
          </>
        )}

        <Divider />

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={openMediaPicker}
          disabled={uploading}
          className="flex h-7 w-7 items-center justify-center rounded text-deep-indigo hover:bg-cream-paper disabled:opacity-40"
          aria-label="Add image or video"
        >
          <ImageIcon />
        </button>
        {uploading && (
          <span className="flex items-center font-label text-[9px] uppercase tracking-label text-black/40">
            Uploading…
          </span>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleMediaChange}
          className="hidden"
        />
      </div>
      <div
        ref={ref}
        contentEditable
        data-placeholder={placeholder}
        onInput={handleInput}
        onBlur={handleEditableBlur}
        className="rich-text-editor min-h-[140px] px-3 py-2.5 font-body text-sm text-black/80 focus:outline-none"
        suppressContentEditableWarning
      />
    </div>
  )
}

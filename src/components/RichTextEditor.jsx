import { useEffect, useRef, useState } from 'react'
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

// Lightweight contentEditable editor (bold / italic / bullets / inline
// media) — no new dependency pulled in just for basic formatting. Content
// is stored as the HTML the browser produces; this surface is local-only
// and single-user, so that tradeoff is fine here.
export function RichTextEditor({ value, onChange, onBlur, placeholder }) {
  const ref = useRef(null)
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  // Opening the native file picker blurs the editable div the moment the
  // dialog appears — without this, that blur alone (before the user has
  // even picked a file) would fire `onBlur` and, in callers that use it to
  // leave edit mode, unmount this editor out from under the upload.
  const suppressBlurRef = useRef(false)
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

  function handleEditableBlur(e) {
    if (suppressBlurRef.current) return
    onBlur?.(e)
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

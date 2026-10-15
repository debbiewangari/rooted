import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { FilledButton, OutlinedButton } from '../components/Button'
import { RichTextEditor } from '../components/RichTextEditor'
import { DEFAULT_TRANSLATION, fetchPassage } from '../lib/bible'
import { LIBRARY_TYPES } from '../lib/library'
import { createEntry, createTag, deleteEntry, getEntry, listTags, updateEntry } from '../lib/db'

const TRANSLATION_KEY = 'rooted:translation'

export function JournalEntry() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [title, setTitle] = useState(searchParams.get('title') || '')
  const [body, setBody] = useState('')
  const [reference, setReference] = useState(searchParams.get('ref') || '')
  const [type, setType] = useState(searchParams.get('type') || 'reflection')
  const [tags, setTags] = useState([])
  const [allTags, setAllTags] = useState([])
  const [newTagName, setNewTagName] = useState('')
  const [referenceQuote, setReferenceQuote] = useState('')
  const [loading, setLoading] = useState(Boolean(id))

  useEffect(() => {
    listTags().then(setAllTags)
  }, [])

  useEffect(() => {
    if (!id) return
    getEntry(id).then((entry) => {
      if (!entry) {
        navigate('/journal', { replace: true })
        return
      }
      setTitle(entry.title)
      setBody(entry.body)
      setReference(entry.reference || '')
      setType(entry.type || 'reflection')
      setTags(entry.tags || [])
      setLoading(false)
    })
  }, [id, navigate])

  useEffect(() => {
    if (!reference.trim()) {
      setReferenceQuote('')
      return
    }
    const translation = localStorage.getItem(TRANSLATION_KEY) || DEFAULT_TRANSLATION
    fetchPassage(reference, translation)
      .then(({ data }) => setReferenceQuote((data.text || '').trim()))
      .catch(() => setReferenceQuote(''))
  }, [reference])

  function toggleTag(name) {
    setTags((t) => (t.includes(name) ? t.filter((x) => x !== name) : [...t, name]))
  }

  async function handleAddTag() {
    if (!newTagName.trim()) return
    const tag = await createTag(newTagName)
    setAllTags((t) => (t.some((x) => x.id === tag.id) ? t : [...t, tag]))
    setTags((t) => (t.includes(tag.name) ? t : [...t, tag.name]))
    setNewTagName('')
  }

  async function handleSave(e) {
    e.preventDefault()
    if (id) {
      await updateEntry(id, { title, body, reference: reference || null, type, tags })
    } else {
      await createEntry({ title, body, reference, type, tags })
    }
    navigate('/journal')
  }

  async function handleDelete() {
    if (!id) return
    await deleteEntry(id)
    navigate('/journal')
  }

  if (loading) {
    return <p className="px-6 pt-10 font-body text-sm text-black/50">Loading…</p>
  }

  return (
    <form onSubmit={handleSave} className="flex min-h-screen flex-col px-6 pt-10 pb-6">
      <p className="font-label text-xs uppercase tracking-label text-deep-indigo">
        {id ? 'Edit entry' : 'New entry'}
      </p>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="mt-2 w-full border-none bg-transparent font-display text-3xl uppercase text-deep-indigo placeholder:text-deep-indigo/30 focus:outline-none"
      />

      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
        {LIBRARY_TYPES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setType(t.id)}
            className={`shrink-0 rounded-pill px-4 py-2 font-label text-[11px] uppercase tracking-label ${
              type === t.id ? 'bg-deep-indigo text-pure-white' : 'border border-black/10 bg-pure-white text-deep-indigo'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <label className="mt-4 block">
        <span className="font-label text-[11px] uppercase tracking-label text-black/40">
          Reference (optional)
        </span>
        <input
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="e.g. John 3:16"
          className="mt-1 w-full rounded-card border border-black/10 bg-pure-white px-3 py-2 font-label text-xs uppercase tracking-label text-burnt-orange placeholder:text-black/30 focus:outline-none"
        />
      </label>
      {referenceQuote && (
        <p className="mt-1 font-body text-sm italic text-black/60">“{referenceQuote}”</p>
      )}

      <div className="mt-4">
        <span className="font-label text-[11px] uppercase tracking-label text-black/40">Themes</span>
        <div className="no-scrollbar mt-1.5 flex flex-wrap gap-2">
          {allTags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.name)}
              className={`rounded-pill px-3 py-1.5 font-label text-[10px] uppercase tracking-label ${
                tags.includes(tag.name)
                  ? 'bg-deep-indigo text-pure-white'
                  : 'border border-black/10 bg-pure-white text-deep-indigo'
              }`}
            >
              {tag.name}
            </button>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddTag()
              }
            }}
            placeholder="New theme name…"
            className="flex-1 rounded-card border border-black/10 bg-pure-white px-3 py-1.5 font-body text-xs focus:outline-none"
          />
          <button
            type="button"
            onClick={handleAddTag}
            className="font-label text-[10px] uppercase tracking-label text-burnt-orange"
          >
            Add
          </button>
        </div>
      </div>

      <div className="mt-4 flex-1">
        <span className="font-label text-[11px] uppercase tracking-label text-black/40">Content</span>
        <div className="mt-1">
          <RichTextEditor value={body} onChange={setBody} placeholder="Write your reflection…" />
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <FilledButton type="submit" className="flex-1">
          Save entry
        </FilledButton>
        {id && (
          <OutlinedButton type="button" onClick={handleDelete} className="flex-1">
            Delete
          </OutlinedButton>
        )}
      </div>
    </form>
  )
}

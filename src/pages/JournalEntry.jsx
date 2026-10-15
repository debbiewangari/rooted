import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { FilledButton, OutlinedButton } from '../components/Button'
import { createEntry, deleteEntry, getEntry, updateEntry } from '../lib/db'

export function JournalEntry() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [title, setTitle] = useState(searchParams.get('title') || '')
  const [body, setBody] = useState('')
  const [reference, setReference] = useState(searchParams.get('ref') || '')
  const [loading, setLoading] = useState(Boolean(id))

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
      setLoading(false)
    })
  }, [id, navigate])

  async function handleSave(e) {
    e.preventDefault()
    if (id) {
      await updateEntry(id, { title, body, reference: reference || null })
    } else {
      await createEntry({ title, body, reference })
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
    <form onSubmit={handleSave} className="flex min-h-screen flex-col px-6 pt-10">
      <p className="font-label text-xs uppercase tracking-label text-deep-indigo">
        {id ? 'Edit entry' : 'New entry'}
      </p>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="mt-2 w-full border-none bg-transparent font-display text-3xl uppercase text-deep-indigo placeholder:text-deep-indigo/30 focus:outline-none"
      />

      <input
        value={reference}
        onChange={(e) => setReference(e.target.value)}
        placeholder="Reference (e.g. John 3:16)"
        className="mt-2 w-full rounded-card border border-black/10 bg-pure-white px-3 py-2 font-label text-xs uppercase tracking-label text-burnt-orange placeholder:text-black/30 focus:outline-none"
      />

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write your reflection…"
        rows={12}
        className="mt-4 flex-1 w-full resize-none rounded-card border border-black/10 bg-pure-white p-4 font-body text-base text-black/80 placeholder:text-black/30 focus:outline-none"
      />

      <div className="mt-6 flex gap-3 pb-6">
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

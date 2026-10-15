import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../components/Card'
import { FilledButton } from '../components/Button'
import { BotanicalSprig } from '../components/BotanicalLine'
import { listEntries } from '../lib/db'

export function Journal() {
  const [entries, setEntries] = useState(null)

  useEffect(() => {
    listEntries().then(setEntries)
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden px-6 pt-10">
      <BotanicalSprig className="absolute -right-4 top-6 h-28 w-28 opacity-50" rotate={15} />

      <div className="flex items-baseline justify-between">
        <div>
          <p className="font-label text-xs uppercase tracking-label text-deep-indigo">Your reflections</p>
          <h1 className="font-display text-4xl uppercase text-deep-indigo">Journal</h1>
        </div>
        <FilledButton to="/journal/new" className="px-6 py-3 text-[11px]">
          + New
        </FilledButton>
      </div>

      <div className="relative z-10 mt-8 flex flex-col gap-3">
        {entries === null && <p className="font-body text-sm text-black/50">Loading…</p>}

        {entries?.length === 0 && (
          <Card className="text-center">
            <p className="font-body text-sm text-black/60">
              Nothing written yet. Your first entry is one tap away.
            </p>
          </Card>
        )}

        {entries?.map((entry) => (
          <Link key={entry.id} to={`/journal/${entry.id}`}>
            <Card>
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-display text-xl uppercase text-deep-indigo">{entry.title}</p>
                <p className="font-label text-[10px] uppercase tracking-label text-black/40 whitespace-nowrap">
                  {new Date(entry.updatedAt).toLocaleDateString()}
                </p>
              </div>
              {entry.reference && (
                <p className="mt-1 font-label text-[11px] uppercase tracking-label text-burnt-orange">
                  {entry.reference}
                </p>
              )}
              <p className="mt-1 line-clamp-2 font-body text-sm text-black/70">{entry.body}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

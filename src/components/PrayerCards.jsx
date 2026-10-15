import { useEffect, useState } from 'react'
import { Card } from './Card'
import { FilledButton } from './Button'
import { addPrayerItem, createPrayerCard, deletePrayerCard, listPrayerCards, removePrayerItem } from '../lib/db'

// Standing prayer lists for a challenge — e.g. a gratitude list or ongoing
// requests — separate from the per-day notes since they aren't tied to a
// single date and get prayed through repeatedly across the whole event.
export function PrayerCards({ eventId }) {
  const [cards, setCards] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [addingCard, setAddingCard] = useState(false)
  const [newCardTitle, setNewCardTitle] = useState('')
  const [newItemText, setNewItemText] = useState('')

  function refresh() {
    listPrayerCards(eventId).then(setCards)
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  function toggleCard(id) {
    setExpandedId((prev) => (prev === id ? null : id))
    setNewItemText('')
  }

  async function handleCreateCard() {
    if (!newCardTitle.trim()) return
    const card = await createPrayerCard(eventId, newCardTitle)
    setNewCardTitle('')
    setAddingCard(false)
    refresh()
    setExpandedId(card.id)
  }

  async function handleAddItem(cardId) {
    if (!newItemText.trim()) return
    await addPrayerItem(cardId, newItemText)
    setNewItemText('')
    refresh()
  }

  async function handleRemoveItem(cardId, itemId) {
    await removePrayerItem(cardId, itemId)
    refresh()
  }

  async function handleDeleteCard(cardId) {
    await deletePrayerCard(cardId)
    if (expandedId === cardId) setExpandedId(null)
    refresh()
  }

  return (
    <section className="mt-8">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-xl uppercase text-deep-indigo">Prayer Lists</h2>
        <button
          type="button"
          onClick={() => setAddingCard((v) => !v)}
          className="font-label text-[11px] uppercase tracking-label text-burnt-orange"
        >
          + New list
        </button>
      </div>

      {addingCard && (
        <div className="mt-3 flex gap-2">
          <input
            value={newCardTitle}
            onChange={(e) => setNewCardTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleCreateCard()
              }
            }}
            placeholder="e.g. Prayer Requests"
            autoFocus
            className="flex-1 rounded-card border border-black/10 bg-pure-white px-3 py-2 font-body text-sm focus:outline-none"
          />
          <FilledButton type="button" onClick={handleCreateCard} className="px-5 py-2 text-[11px]">
            Add
          </FilledButton>
        </div>
      )}

      <div className="mt-3 flex flex-col gap-3">
        {cards?.length === 0 && !addingCard && (
          <p className="font-body text-sm text-black/50">
            No prayer lists yet — add one for points you want to keep praying through the whole challenge.
          </p>
        )}

        {cards?.map((card) => {
          const expanded = expandedId === card.id
          return (
            <Card key={card.id}>
              <button
                type="button"
                onClick={() => toggleCard(card.id)}
                className="flex w-full items-center justify-between"
              >
                <p className="font-display text-lg text-deep-indigo">{card.title}</p>
                <span className="font-label text-[10px] uppercase tracking-label text-black/40">
                  {card.items.length} {expanded ? '▲' : '▼'}
                </span>
              </button>

              {expanded && (
                <div className="mt-3">
                  <ul className="flex flex-col gap-2">
                    {card.items.map((item) => (
                      <li key={item.id} className="flex items-start gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-burnt-orange" />
                        <span className="flex-1 font-body text-sm text-black/80">{item.text}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(card.id, item.id)}
                          className="font-label text-[10px] text-black/30"
                          aria-label="Remove point"
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                    {card.items.length === 0 && (
                      <p className="font-body text-sm text-black/40">No points yet.</p>
                    )}
                  </ul>

                  <div className="mt-3 flex gap-2">
                    <input
                      value={newItemText}
                      onChange={(e) => setNewItemText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddItem(card.id)
                        }
                      }}
                      placeholder="Add a point…"
                      className="flex-1 rounded-card border border-black/10 bg-cream-paper px-3 py-2 font-body text-sm focus:outline-none"
                    />
                    <FilledButton type="button" onClick={() => handleAddItem(card.id)} className="px-5 py-2 text-[11px]">
                      Add
                    </FilledButton>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteCard(card.id)}
                    className="mt-3 font-label text-[10px] uppercase tracking-label text-black/40"
                  >
                    Delete list
                  </button>
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </section>
  )
}

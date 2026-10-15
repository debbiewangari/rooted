import { DEFAULT_TRANSLATION, TRANSLATIONS, fetchPassage } from './bible'

// A small curated set rather than anything in the Bible — short, complete
// verses that read well standalone as a daily card.
const DAILY_REFERENCES = [
  'Lamentations 3:22-23',
  'Psalm 23:1',
  'Psalm 46:1',
  'Isaiah 40:31',
  'Philippians 4:6-7',
  'Proverbs 3:5-6',
  'Romans 8:28',
  'Psalm 118:24',
  'Joshua 1:9',
  'Psalm 34:8',
  '2 Corinthians 5:17',
  'Jeremiah 29:11',
  'Psalm 100:5',
  'Matthew 6:33',
  'John 14:27',
]

const TRANSLATION_KEY = 'rooted:translation'

function dayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0)
  return Math.floor((date - start) / 86400000)
}

// Same verse all day, a new one tomorrow — no stored state needed since the
// date itself is the seed.
export function getDailyReference(date = new Date()) {
  return DAILY_REFERENCES[dayOfYear(date) % DAILY_REFERENCES.length]
}

export async function fetchDailyVerse() {
  const reference = getDailyReference()
  const translationId = localStorage.getItem(TRANSLATION_KEY) || DEFAULT_TRANSLATION
  const { data } = await fetchPassage(reference, translationId)
  return {
    reference: data.reference || reference,
    text: (data.text || '').trim(),
    translation: TRANSLATIONS.find((t) => t.id === translationId)?.name || translationId.toUpperCase(),
  }
}

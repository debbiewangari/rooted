const NAME_KEY = 'rooted:name'
const DEFAULT_NAME = 'Debbie'

export function getName() {
  return localStorage.getItem(NAME_KEY) || DEFAULT_NAME
}

export function setName(name) {
  localStorage.setItem(NAME_KEY, name.trim() || DEFAULT_NAME)
}

export function getGreeting(date = new Date()) {
  const hour = date.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

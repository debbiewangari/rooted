import { Link } from 'react-router-dom'

const filledClasses =
  'inline-flex items-center justify-center gap-2 rounded-pill bg-deep-indigo px-8 py-3.5 font-body text-sm font-semibold text-pure-white transition-opacity hover:opacity-90 disabled:opacity-50'

const outlinedClasses =
  'inline-flex items-center justify-center gap-2 rounded-pill border border-black/15 bg-transparent px-8 py-3.5 font-body text-sm font-semibold text-ink-black transition-colors hover:bg-mist disabled:opacity-50'

export function FilledButton({ children, className = '', to, ...props }) {
  const classes = `${filledClasses} ${className}`
  if (to) {
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    )
  }
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  )
}

export function OutlinedButton({ children, className = '', to, ...props }) {
  const classes = `${outlinedClasses} ${className}`
  if (to) {
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    )
  }
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  )
}

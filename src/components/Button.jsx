import { Link } from 'react-router-dom'

const filledClasses =
  'inline-flex items-center justify-center gap-2 rounded-pill bg-deep-indigo px-10 py-4 font-label text-[13px] uppercase tracking-label text-pure-white transition-opacity hover:opacity-90 disabled:opacity-50'

const outlinedClasses =
  'inline-flex items-center justify-center gap-2 rounded-pill border-2 border-burnt-orange bg-transparent px-10 py-4 font-label text-sm uppercase tracking-label text-burnt-orange transition-opacity hover:opacity-80 disabled:opacity-50'

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

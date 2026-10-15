export function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`rounded-card bg-pure-white p-4 shadow-xl-2 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

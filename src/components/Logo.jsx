// Wordmark: "roo" + a cross standing in for the "t" + "ed". The cross is a
// plain stroked glyph sized in em units so it scales and inherits color
// alongside the surrounding text, rather than being a separate image asset.
export function Logo({ size = 22, className = '' }) {
  return (
    <span className={`inline-flex items-center ${className}`} style={{ fontSize: size }}>
      <span className="font-display font-semibold lowercase leading-none">roo</span>
      <svg
        width="0.5em"
        height="0.9em"
        viewBox="0 0 20 36"
        className="mx-[0.02em] shrink-0"
        aria-hidden="true"
      >
        <path d="M10 2 V31 M3 11 H17" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
      </svg>
      <span className="font-display font-semibold lowercase leading-none">ed</span>
    </span>
  )
}

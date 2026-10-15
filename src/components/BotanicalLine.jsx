// Hand-drawn style line illustrations: outline-only, no fills, meant to
// bleed off section edges rather than sit boxed in a container.
export function BotanicalLeaf({ color = 'var(--color-deep-indigo)', className = '', rotate = 0, ...props }) {
  return (
    <svg
      viewBox="0 0 120 160"
      className={className}
      style={{ transform: `rotate(${rotate}deg)` }}
      aria-hidden="true"
      {...props}
    >
      <g fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
        <path d="M60 150 C60 110 58 70 60 20" />
        <path d="M60 60 C35 55 20 35 18 12 C42 14 58 32 60 60 Z" />
        <path d="M60 90 C85 85 100 65 102 42 C78 44 62 62 60 90 Z" />
        <path d="M60 120 C42 118 28 104 25 86 C45 87 58 100 60 120 Z" />
        <path d="M60 150 C50 145 44 140 36 136" />
        <path d="M60 150 C70 145 76 140 84 136" />
      </g>
    </svg>
  )
}

export function BotanicalSprig({ color = 'var(--color-sky-blue)', className = '', rotate = 0, ...props }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      style={{ transform: `rotate(${rotate}deg)` }}
      aria-hidden="true"
      {...props}
    >
      <g fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
        <path d="M50 95 C48 65 52 35 50 5" />
        <ellipse cx="38" cy="30" rx="12" ry="7" transform="rotate(-30 38 30)" />
        <ellipse cx="62" cy="45" rx="12" ry="7" transform="rotate(30 62 45)" />
        <ellipse cx="38" cy="60" rx="12" ry="7" transform="rotate(-30 38 60)" />
        <ellipse cx="62" cy="75" rx="12" ry="7" transform="rotate(30 62 75)" />
      </g>
    </svg>
  )
}

export function WaveDivider({ color = 'var(--color-burnt-orange)', className = '', flip = false }) {
  return (
    <svg
      viewBox="0 0 1200 120"
      preserveAspectRatio="none"
      className={className}
      style={{ transform: flip ? 'scaleY(-1)' : undefined }}
      aria-hidden="true"
    >
      <path
        d="M0,40 C200,100 400,0 600,50 C800,100 1000,10 1200,55 L1200,120 L0,120 Z"
        fill={color}
      />
    </svg>
  )
}

/**
 * Landing illustrations.
 *
 * These are drawn, not generated: every coordinate sits on a 4px grid, every
 * stroke is 1.25px, and the palette below is the *only* palette.
 */

const LINE = "oklch(0.885 0.008 250)"
const LINE_SOFT = "oklch(0.935 0.005 250)"
const ACCENT = "oklch(0.55 0.21 258)"
const PAPER = "#ffffff"

const S = 1.25

type Props = { className?: string }

/** The Synapse core: a node with two orbit arcs. Used as the hub everywhere. */
export function SynapseGlyph({
  x,
  y,
  size = 28,
}: {
  x: number
  y: number
  size?: number
}) {
  const k = size / 28
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`}>
      <rect width={28} height={28} rx={9} fill={ACCENT} />
      <circle cx={14} cy={14} r={3} fill={PAPER} />
      <path
        d="M14 6.5a7.5 7.5 0 0 1 0 15"
        stroke={PAPER}
        strokeOpacity={0.75}
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M14 21.5a7.5 7.5 0 0 1 0-15"
        stroke={PAPER}
        strokeOpacity={0.35}
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
      />
    </g>
  )
}

/* ── Ring backdrop for the integrations hub ────────────────── */

export function RingBackdrop({ className }: Props) {
  return (
    <svg viewBox="0 0 400 400" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="lp-ring-fade" cx="50%" cy="50%" r="50%">
          <stop offset="55%" stopColor={ACCENT} stopOpacity={0} />
          <stop offset="100%" stopColor={ACCENT} stopOpacity={0.06} />
        </radialGradient>
      </defs>
      <circle cx={200} cy={200} r={198} fill="url(#lp-ring-fade)" />
      <circle cx={200} cy={200} r={60} fill="none" stroke={LINE} strokeWidth={S} />
      <circle
        cx={200}
        cy={200}
        r={124}
        fill="none"
        stroke={LINE}
        strokeWidth={S}
        strokeDasharray="2 6"
      />
      <circle cx={200} cy={200} r={188} fill="none" stroke={LINE_SOFT} strokeWidth={S} />
      {/* radial spokes, drawn only where the logo chips sit */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const rad = ((deg - 90) * Math.PI) / 180
        return (
          <path
            key={deg}
            d={`M${200 + Math.cos(rad) * 62} ${200 + Math.sin(rad) * 62}L${200 + Math.cos(rad) * 120} ${200 + Math.sin(rad) * 120}`}
            stroke={LINE}
            strokeWidth={S}
          />
        )
      })}
    </svg>
  )
}

/**
 * Landing illustrations.
 *
 * These are drawn, not generated: every coordinate sits on a 4px grid, every
 * stroke is 1.25px, and the palette below is the *only* palette. They describe
 * what Synapse actually does — ingest sources, trace an answer, write work back
 * — rather than decorating the page with abstract shapes.
 */

const INK = "oklch(0.21 0.02 255)"
const LINE = "oklch(0.885 0.008 250)"
const LINE_SOFT = "oklch(0.935 0.005 250)"
const FILL_SOFT = "oklch(0.972 0.004 250)"
const SLAB = "oklch(0.905 0.008 250)"
const SLAB_2 = "oklch(0.86 0.01 250)"
const ACCENT = "oklch(0.55 0.21 258)"
const ACCENT_SOFT = "oklch(0.55 0.21 258 / 0.12)"
const ACCENT_LINE = "oklch(0.55 0.21 258 / 0.35)"
const PAPER = "#ffffff"

const S = 1.25

type Props = { className?: string }

/* ── Shared bits ───────────────────────────────────────────── */

/** Text placeholder bar. Reads as copy without inventing fake copy. */
function Bar({
  x,
  y,
  w,
  h = 3,
  fill = SLAB,
}: {
  x: number
  y: number
  w: number
  h?: number
  fill?: string
}) {
  return <rect x={x} y={y} width={w} height={h} rx={h / 2} fill={fill} />
}

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

/* ── 1. Connect — sources become a searchable index ────────── */

export function ConnectIllustration({ className }: Props) {
  const cards = [
    { y: 26, glyph: "doc" as const },
    { y: 72, glyph: "branch" as const },
    { y: 118, glyph: "chat" as const },
  ]

  return (
    <svg
      viewBox="0 0 320 200"
      className={className}
      role="img"
      aria-label="Documents, repositories and conversations flowing into a single indexed knowledge base"
    >
      {/* converging connectors */}
      <g fill="none" strokeWidth={S}>
        <path d="M112 43C148 43 164 100 200 100" stroke={LINE} />
        <path d="M112 89C148 89 164 100 200 100" stroke={LINE} />
        <path d="M112 135C148 135 164 100 200 100" stroke={LINE} />
        <path
          d="M112 89C148 89 164 100 200 100"
          stroke={ACCENT}
          strokeDasharray="4 78"
          strokeLinecap="round"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="82"
            to="0"
            dur="2.4s"
            repeatCount="indefinite"
          />
        </path>
      </g>

      {/* source cards */}
      {cards.map(({ y, glyph }) => (
        <g key={y}>
          <rect
            x={8}
            y={y}
            width={104}
            height={34}
            rx={8}
            fill={PAPER}
            stroke={LINE}
            strokeWidth={S}
          />
          <rect x={18} y={y + 9} width={16} height={16} rx={5} fill={FILL_SOFT} />
          {glyph === "doc" && (
            <g stroke={SLAB_2} strokeWidth={S} strokeLinecap="round">
              <path
                d={`M22 ${y + 13}h8M22 ${y + 17}h8M22 ${y + 21}h5`}
              />
            </g>
          )}
          {glyph === "branch" && (
            <g stroke={SLAB_2} strokeWidth={S} fill="none">
              <circle cx={25} cy={y + 13} r={1.75} />
              <circle cx={25} cy={y + 21} r={1.75} />
              <circle cx={31} cy={y + 15} r={1.75} />
              <path d="M25 15v4M27 15h1.5a2.5 2.5 0 0 1 2.5 2.5v-.5" />
            </g>
          )}
          {glyph === "chat" && (
            <g stroke={SLAB_2} strokeWidth={S} fill="none" strokeLinejoin="round">
              <path d={`M22 ${y + 12}h10v7h-4l-3 3v-3h-3z`} />
            </g>
          )}
          <Bar x={42} y={y + 12} w={52} />
          <Bar x={42} y={y + 19} w={34} fill={LINE} />
        </g>
      ))}

      {/* index panel */}
      <rect
        x={200}
        y={26}
        width={112}
        height={148}
        rx={10}
        fill={PAPER}
        stroke={LINE}
        strokeWidth={S}
      />
      <path d="M200 50h112" stroke={LINE_SOFT} strokeWidth={S} />
      <SynapseGlyph x={210} y={31} size={14} />
      <Bar x={230} y={36} w={40} fill={SLAB_2} />

      {/* chunk grid — the highlighted cells are the retrieved ones */}
      {Array.from({ length: 20 }, (_, i) => {
        const col = i % 4
        const row = Math.floor(i / 4)
        const hot = [2, 5, 9, 14].includes(i)
        return (
          <rect
            key={i}
            x={219 + col * 20}
            y={62 + row * 20}
            width={14}
            height={14}
            rx={4}
            fill={hot ? ACCENT_SOFT : FILL_SOFT}
            stroke={hot ? ACCENT_LINE : "none"}
            strokeWidth={S}
          />
        )
      })}
      <Bar x={219} y={162} w={74} h={2} fill={LINE} />
    </svg>
  )
}

/* ── 2. Understand — a question traced to cited sources ────── */

export function UnderstandIllustration({ className }: Props) {
  const satellites = [
    { cx: 52, cy: 78, r: 10, hot: true },
    { cx: 106, cy: 56, r: 8, hot: true },
    { cx: 74, cy: 132, r: 9, hot: false },
    { cx: 240, cy: 66, r: 9, hot: false },
    { cx: 256, cy: 120, r: 8, hot: false },
    { cx: 196, cy: 140, r: 8, hot: false },
  ]

  return (
    <svg
      viewBox="0 0 320 200"
      className={className}
      role="img"
      aria-label="A question traced through connected sources to a cited answer"
    >
      {/* query bar */}
      <rect
        x={40}
        y={6}
        width={240}
        height={26}
        rx={13}
        fill={PAPER}
        stroke={LINE}
        strokeWidth={S}
      />
      <g stroke={SLAB_2} strokeWidth={S} fill="none" strokeLinecap="round">
        <circle cx={57} cy={18} r={4} />
        <path d="M60 21.5 63 25" />
      </g>
      <Bar x={72} y={17} w={116} />
      <rect x={252} y={13} width={14} height={12} rx={4} fill={ACCENT_SOFT} />

      {/* edges */}
      <g fill="none" strokeWidth={S}>
        {satellites.map(({ cx, cy, hot }, i) => (
          <path
            key={i}
            d={`M${cx} ${cy}Q${(cx + 160) / 2} ${(cy + 110) / 2 - 12} 160 110`}
            stroke={hot ? ACCENT_LINE : LINE}
            strokeWidth={hot ? S * 1.4 : S}
          />
        ))}
        <path d="M52 78 106 56M74 132 52 78M256 120 240 66" stroke={LINE_SOFT} />
      </g>

      {/* satellites */}
      {satellites.map(({ cx, cy, r, hot }, i) => (
        <g key={i}>
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill={hot ? ACCENT_SOFT : PAPER}
            stroke={hot ? ACCENT : LINE}
            strokeWidth={S}
          />
          <circle cx={cx} cy={cy} r={r / 3} fill={hot ? ACCENT : SLAB} />
        </g>
      ))}

      {/* core */}
      <circle cx={160} cy={110} r={26} fill={ACCENT_SOFT} />
      <SynapseGlyph x={146} y={96} size={28} />

      {/* cited answer */}
      <rect
        x={40}
        y={166}
        width={240}
        height={28}
        rx={8}
        fill={PAPER}
        stroke={LINE}
        strokeWidth={S}
      />
      <rect x={40} y={166} width={3} height={28} rx={1.5} fill={ACCENT} />
      <Bar x={54} y={173} w={132} />
      <Bar x={54} y={182} w={88} fill={LINE} />
      <rect x={214} y={174} width={26} height={12} rx={6} fill={ACCENT_SOFT} stroke={ACCENT_LINE} strokeWidth={S} />
      <rect x={244} y={174} width={26} height={12} rx={6} fill={FILL_SOFT} stroke={LINE} strokeWidth={S} />
    </svg>
  )
}

/* ── 3. Act — work written back into the board ─────────────── */

export function ActIllustration({ className }: Props) {
  const columns = [
    { x: 8, cards: [44, 80, 116], accentIndex: -1, done: false },
    { x: 112, cards: [44, 80], accentIndex: 0, done: false },
    { x: 216, cards: [44, 80], accentIndex: -1, done: true },
  ]

  return (
    <svg
      viewBox="0 0 320 200"
      className={className}
      role="img"
      aria-label="Tasks generated onto a board across backlog, in progress and done columns"
    >
      {columns.map(({ x, cards, accentIndex, done }, ci) => (
        <g key={x}>
          <rect x={x} y={8} width={96} height={150} rx={10} fill={FILL_SOFT} />
          <rect
            x={x + 10}
            y={20}
            width={ci === 1 ? 40 : 34}
            height={8}
            rx={4}
            fill={ci === 1 ? ACCENT_SOFT : SLAB}
          />
          <circle cx={x + 84} cy={24} r={2} fill={SLAB_2} />

          {cards.map((cy, i) => {
            const isAccent = i === accentIndex
            return (
              <g key={cy}>
                <rect
                  x={x + 8}
                  y={cy}
                  width={80}
                  height={28}
                  rx={7}
                  fill={PAPER}
                  stroke={isAccent ? ACCENT : LINE}
                  strokeWidth={isAccent ? S * 1.4 : S}
                />
                {/* checkbox */}
                {done ? (
                  <g>
                    <rect
                      x={x + 15}
                      y={cy + 9}
                      width={10}
                      height={10}
                      rx={3}
                      fill={ACCENT}
                    />
                    <path
                      d={`M${x + 17.5} ${cy + 14.2} ${x + 19.5} ${cy + 16.2} ${x + 22.5} ${cy + 11.8}`}
                      stroke={PAPER}
                      strokeWidth={1.4}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </g>
                ) : (
                  <rect
                    x={x + 15}
                    y={cy + 9}
                    width={10}
                    height={10}
                    rx={3}
                    fill="none"
                    stroke={isAccent ? ACCENT_LINE : LINE}
                    strokeWidth={S}
                  />
                )}
                <Bar
                  x={x + 31}
                  y={cy + 10}
                  w={46}
                  fill={done ? LINE : SLAB}
                />
                <Bar x={x + 31} y={cy + 17} w={28} fill={LINE} />
              </g>
            )
          })}
        </g>
      ))}

      {/* provenance pill: the board changed because the AI acted */}
      <g>
        <rect
          x={56}
          y={168}
          width={208}
          height={26}
          rx={13}
          fill={PAPER}
          stroke={ACCENT_LINE}
          strokeWidth={S}
        />
        <SynapseGlyph x={66} y={174} size={14} />
        <Bar x={86} y={177} w={92} fill={ACCENT} />
        <Bar x={86} y={184} w={60} fill={LINE} />
        <path
          d="M240 175v12"
          stroke={LINE}
          strokeWidth={S}
        />
        <path
          d="M248 178l4 3-4 3"
          stroke={ACCENT}
          strokeWidth={S * 1.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>
    </svg>
  )
}

/* ── 4. Ring backdrop for the integrations hub ─────────────── */

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

/* ── 5. Hero backdrop: converging field lines, cropped ─────── */

export function HeroBackdrop({ className }: Props) {
  return (
    <svg
      viewBox="0 0 1200 520"
      className={className}
      preserveAspectRatio="xMidYMin slice"
      aria-hidden="true"
    >
      <g fill="none" stroke={LINE_SOFT} strokeWidth={1}>
        {Array.from({ length: 13 }, (_, i) => {
          const x = i * 100
          return <path key={i} d={`M${x} 520C${x} 300 600 300 600 0`} />
        })}
      </g>
      <g fill="none" stroke={LINE_SOFT} strokeWidth={1}>
        {[120, 220, 320, 420].map((r) => (
          <ellipse key={r} cx={600} cy={-40} rx={r * 1.9} ry={r} />
        ))}
      </g>
    </svg>
  )
}

export { INK, ACCENT }

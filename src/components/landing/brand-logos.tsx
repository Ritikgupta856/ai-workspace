/**
 * Official brand marks, normalised to a 24×24 viewBox so they share one
 * optical size wherever they appear.
 *
 * Each brand exposes two forms:
 *   Color — the brand's own palette, used on the integrations surface.
 *   Mono  — single-path silhouette inheriting `currentColor`, used in the
 *           logo strip so a row of eight logos reads as one row.
 *
 * Trademarks belong to their respective owners; used here to identify the
 * services Synapse connects to.
 */

import type { SVGProps } from "react"

type MarkProps = SVGProps<SVGSVGElement>

const base = {
  viewBox: "0 0 24 24",
  xmlns: "http://www.w3.org/2000/svg",
  "aria-hidden": true,
  focusable: "false",
} as const

/* ── GitHub ─────────────────────────────────────────────────── */

const GITHUB_PATH =
  "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"

export function GitHubColor(props: MarkProps) {
  return (
    <svg {...base} {...props}>
      <path fill="#181717" d={GITHUB_PATH} />
    </svg>
  )
}

export function GitHubMono(props: MarkProps) {
  return (
    <svg {...base} {...props}>
      <path fill="currentColor" d={GITHUB_PATH} />
    </svg>
  )
}

/* ── Slack ──────────────────────────────────────────────────── */

export function SlackColor(props: MarkProps) {
  return (
    <svg {...base} {...props}>
      <path
        fill="#E01E5A"
        d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z"
      />
      <path
        fill="#36C5F0"
        d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z"
      />
      <path
        fill="#2EB67D"
        d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z"
      />
      <path
        fill="#ECB22E"
        d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"
      />
    </svg>
  )
}

export function SlackMono(props: MarkProps) {
  return (
    <svg {...base} {...props}>
      <path
        fill="currentColor"
        d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zm10.122 2.521a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.268 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zm-2.523 10.122a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.268a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"
      />
    </svg>
  )
}

/* ── Notion ─────────────────────────────────────────────────── */

const NOTION_PATH =
  "M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.139v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952l1.448.326s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747L1.309 19.35c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.42-1.632z"

export function NotionColor(props: MarkProps) {
  return (
    <svg {...base} {...props}>
      <path fill="#000000" d={NOTION_PATH} />
    </svg>
  )
}

export function NotionMono(props: MarkProps) {
  return (
    <svg {...base} {...props}>
      <path fill="currentColor" d={NOTION_PATH} />
    </svg>
  )
}

/* ── Linear ─────────────────────────────────────────────────── */

const LINEAR_PATH =
  "M2.886 4.18A11.982 11.982 0 0 1 11.985 0C18.61 0 24 5.39 24 12.015a11.982 11.982 0 0 1-4.18 9.099L2.887 4.18ZM1.817 5.626l16.556 16.556c-.524.33-1.075.618-1.65.86L.956 7.277c.243-.575.532-1.126.861-1.65ZM.322 9.163l14.515 14.515c-.71.172-1.443.282-2.195.322L0 11.358a11.9 11.9 0 0 1 .322-2.195Zm-.316 4.966 9.865 9.866a12.024 12.024 0 0 1-9.865-9.866Z"

export function LinearColor(props: MarkProps) {
  return (
    <svg {...base} {...props}>
      <path fill="#5E6AD2" d={LINEAR_PATH} />
    </svg>
  )
}

export function LinearMono(props: MarkProps) {
  return (
    <svg {...base} {...props}>
      <path fill="currentColor" d={LINEAR_PATH} />
    </svg>
  )
}

/* ── Figma ──────────────────────────────────────────────────── */
/* Native artboard is 38×57; scaled and centred into the 24×24 box. */

export function FigmaColor(props: MarkProps) {
  return (
    <svg {...base} {...props}>
      <g transform="translate(4 0) scale(0.421052)">
        <path fill="#1ABCFE" d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z" />
        <path fill="#0ACF83" d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0z" />
        <path fill="#FF7262" d="M19 0v19h9.5a9.5 9.5 0 1 0 0-19H19z" />
        <path fill="#F24E1E" d="M0 9.5A9.5 9.5 0 0 1 9.5 0H19v19H9.5A9.5 9.5 0 0 1 0 9.5z" />
        <path fill="#A259FF" d="M0 28.5A9.5 9.5 0 0 1 9.5 19H19v19H9.5A9.5 9.5 0 0 1 0 28.5z" />
      </g>
    </svg>
  )
}

export function FigmaMono(props: MarkProps) {
  return (
    <svg {...base} {...props}>
      <g transform="translate(4 0) scale(0.421052)" fill="currentColor">
        <path d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z" />
        <path d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0z" />
        <path d="M19 0v19h9.5a9.5 9.5 0 1 0 0-19H19z" />
        <path d="M0 9.5A9.5 9.5 0 0 1 9.5 0H19v19H9.5A9.5 9.5 0 0 1 0 9.5z" />
        <path d="M0 28.5A9.5 9.5 0 0 1 9.5 19H19v19H9.5A9.5 9.5 0 0 1 0 28.5z" />
      </g>
    </svg>
  )
}

/* ── Google Drive ───────────────────────────────────────────── */
/* Native artboard is 87.3×78; scaled and centred into the 24×24 box. */

export function GoogleDriveColor(props: MarkProps) {
  return (
    <svg {...base} {...props}>
      <g transform="translate(0 1.28) scale(0.274914)">
        <path
          fill="#0066DA"
          d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z"
        />
        <path
          fill="#00AC47"
          d="M43.65 25 29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44A9.06 9.06 0 0 0 0 53h27.45z"
        />
        <path
          fill="#EA4335"
          d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.85l5.85 11.5z"
        />
        <path fill="#00832D" d="M43.65 25 57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2z" />
        <path
          fill="#2684FC"
          d="M59.85 53H27.45L13.7 76.8c1.35.8 2.9 1.2 4.5 1.2h51.1c1.6 0 3.15-.45 4.5-1.2z"
        />
        <path
          fill="#FFBA00"
          d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25l16.2 28h27.4c0-1.55-.4-3.1-1.2-4.5z"
        />
      </g>
    </svg>
  )
}

export function GoogleDriveMono(props: MarkProps) {
  return (
    <svg {...base} {...props}>
      <g transform="translate(0 1.28) scale(0.274914)" fill="currentColor">
        <path d="M29.9 1.2 1.2 48.5A9.06 9.06 0 0 0 0 53h27.45L43.65 25z" />
        <path d="M57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2L43.65 25l16.2 28h27.4c0-1.55-.4-3.1-1.2-4.5l-12.7-22z" />
        <path d="M13.7 76.8c1.35.8 2.9 1.2 4.5 1.2h51.1c1.6 0 3.15-.45 4.5-1.2L59.85 53H27.45z" />
      </g>
    </svg>
  )
}

/* ── Discord ────────────────────────────────────────────────── */

const DISCORD_PATH =
  "M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c1.8483 1.3568 3.6396 2.1801 5.3974 2.7264a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 5.6068-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"

export function DiscordColor(props: MarkProps) {
  return (
    <svg {...base} {...props}>
      <path fill="#5865F2" d={DISCORD_PATH} />
    </svg>
  )
}

export function DiscordMono(props: MarkProps) {
  return (
    <svg {...base} {...props}>
      <path fill="currentColor" d={DISCORD_PATH} />
    </svg>
  )
}

/* ── Asana ──────────────────────────────────────────────────── */

const ASANA_PATH =
  "M18.78 12.653c-2.882 0-5.22 2.336-5.22 5.22 0 2.882 2.338 5.22 5.22 5.22 2.882 0 5.22-2.338 5.22-5.22 0-2.884-2.338-5.22-5.22-5.22zm-13.56.001c-2.881 0-5.22 2.336-5.22 5.22 0 2.882 2.339 5.22 5.22 5.22 2.883 0 5.221-2.338 5.221-5.22 0-2.884-2.339-5.22-5.22-5.22h-.001zm11.999-6.34c0 2.883-2.338 5.221-5.22 5.221-2.882 0-5.22-2.338-5.22-5.22 0-2.882 2.338-5.22 5.22-5.22 2.882 0 5.22 2.337 5.22 5.22z"

export function AsanaColor(props: MarkProps) {
  return (
    <svg {...base} {...props}>
      <path fill="#F06A6A" d={ASANA_PATH} />
    </svg>
  )
}

export function AsanaMono(props: MarkProps) {
  return (
    <svg {...base} {...props}>
      <path fill="currentColor" d={ASANA_PATH} />
    </svg>
  )
}

/* ── Vercel ─────────────────────────────────────────────────── */

const VERCEL_PATH = "M12 1.608 24 22.392H0z"

export function VercelColor(props: MarkProps) {
  return (
    <svg {...base} {...props}>
      <path fill="#000000" d={VERCEL_PATH} />
    </svg>
  )
}

export function VercelMono(props: MarkProps) {
  return (
    <svg {...base} {...props}>
      <path fill="currentColor" d={VERCEL_PATH} />
    </svg>
  )
}

/* ── Google (OAuth button) ──────────────────────────────────── */

export function GoogleColor(props: MarkProps) {
  return (
    <svg {...base} {...props}>
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
      />
      <path
        fill="#34A853"
        d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09c1.97 3.92 6.02 6.62 10.71 6.62z"
      />
      <path
        fill="#FBBC05"
        d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 0 0 0 10.76l3.98-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.69 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
      />
    </svg>
  )
}

/* ── Social marks (mono only — they sit in the footer) ──────── */

export function XMono(props: MarkProps) {
  return (
    <svg {...base} {...props}>
      <path
        fill="currentColor"
        d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"
      />
    </svg>
  )
}

export function LinkedInMono(props: MarkProps) {
  return (
    <svg {...base} {...props}>
      <path
        fill="currentColor"
        d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"
      />
    </svg>
  )
}

/* ── Registry ───────────────────────────────────────────────── */

export type Brand = {
  name: string
  Color: (props: MarkProps) => React.JSX.Element
  Mono: (props: MarkProps) => React.JSX.Element
  /** Short, concrete description of what Synapse does with this service. */
  syncs: string
}

export const BRANDS = {
  github: {
    name: "GitHub",
    Color: GitHubColor,
    Mono: GitHubMono,
    syncs: "Pull requests, issues, commits",
  },
  slack: {
    name: "Slack",
    Color: SlackColor,
    Mono: SlackMono,
    syncs: "Channel threads and decisions",
  },
  notion: {
    name: "Notion",
    Color: NotionColor,
    Mono: NotionMono,
    syncs: "Pages, databases, specs",
  },
  linear: {
    name: "Linear",
    Color: LinearColor,
    Mono: LinearMono,
    syncs: "Issues, cycles, projects",
  },
  figma: {
    name: "Figma",
    Color: FigmaColor,
    Mono: FigmaMono,
    syncs: "Files, frames, comments",
  },
  drive: {
    name: "Google Drive",
    Color: GoogleDriveColor,
    Mono: GoogleDriveMono,
    syncs: "Docs, sheets, PDFs",
  },
  discord: {
    name: "Discord",
    Color: DiscordColor,
    Mono: DiscordMono,
    syncs: "Server messages and threads",
  },
  asana: {
    name: "Asana",
    Color: AsanaColor,
    Mono: AsanaMono,
    syncs: "Tasks, sections, assignees",
  },
  vercel: {
    name: "Vercel",
    Color: VercelColor,
    Mono: VercelMono,
    syncs: "Deployments and previews",
  },
} satisfies Record<string, Brand>

export type BrandKey = keyof typeof BRANDS

/**
 * Note helpers shared by the API routes and the UI.
 *
 * Structural types only — nothing here imports Prisma or React, so the same
 * file is safe on both sides of the network boundary.
 */

type NoteRow = {
  id: string
  title: string
  content: string
  tags: string[]
  pinned: boolean
  authorId: string
  createdAt: Date
  updatedAt: Date
  author: { name: string | null }
}

/**
 * The single place the note API response shape is defined. Previously each
 * route built this by hand, which is why `createdAt` and `authorId` were
 * missing and the detail page showed the updated date under "Created".
 */
export function formatNote(note: NoteRow) {
  return {
    id: note.id,
    title: note.title,
    preview: note.content.slice(0, 200),
    content: note.content,
    tags: note.tags,
    author: note.author.name ?? "Unknown",
    authorId: note.authorId,
    pinned: note.pinned,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  }
}

/** Prisma `include` that satisfies `formatNote`. */
export const noteInclude = { author: { select: { name: true } } } as const

/* ── Client-side utilities ──────────────────────────────────── */

export function readingStats(content: string) {
  const words = content.trim() ? content.trim().split(/\s+/).length : 0
  return {
    words,
    characters: content.length,
    // 200 wpm is the usual desk-reading estimate; always show at least a minute
    // so a one-line note doesn't read "0 min".
    minutes: Math.max(1, Math.round(words / 200)),
  }
}

export function noteToMarkdown(note: {
  title: string
  content: string
  tags: string[]
  author: string
  updatedAt: string
}) {
  const front = [
    `# ${note.title}`,
    "",
    `> Author: ${note.author}`,
    `> Updated: ${new Date(note.updatedAt).toLocaleString()}`,
    note.tags.length ? `> Tags: ${note.tags.join(", ")}` : null,
    "",
    "---",
    "",
  ].filter((line) => line !== null)

  return `${front.join("\n")}${note.content}\n`
}

export function slugifyFilename(title: string) {
  return (
    title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "note"
  )
}

/** Triggers a client-side download of the note as a .md file. */
export function downloadNoteMarkdown(note: {
  title: string
  content: string
  tags: string[]
  author: string
  updatedAt: string
}) {
  const blob = new Blob([noteToMarkdown(note)], {
    type: "text/markdown;charset=utf-8",
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${slugifyFilename(note.title)}.md`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

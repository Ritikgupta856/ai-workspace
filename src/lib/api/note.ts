import type { Note } from "@/components/notes/note-card"

type ApiResponse<T> =
  | {
      success: true
      note?: T
      notes?: T[]
      message?: string
      currentUserId?: string
    }
  | { success: false; error: string }

const BASE = "/api/notes"

export async function fetchNotes(): Promise<{
  notes: Note[]
  currentUserId: string | null
}> {
  const res = await fetch(BASE)
  const json: ApiResponse<Note> = await res.json()
  if (!json.success) throw new Error(json.error)
  return { notes: json.notes ?? [], currentUserId: json.currentUserId ?? null }
}

export async function fetchNote(id: string): Promise<Note> {
  const res = await fetch(`${BASE}/${id}`)
  const json: ApiResponse<Note> = await res.json()
  if (!json.success) throw new Error(json.error)
  return json.note!
}

export async function createNote(data: {
  title: string
  tags?: string[]
  content?: string
}): Promise<Note> {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  const json: ApiResponse<Note> = await res.json()
  if (!json.success) throw new Error(json.error)
  return json.note!
}

/** Server-side copy, so the duplicate keeps its body and not just its title. */
export async function duplicateNote(note: Note): Promise<Note> {
  return createNote({
    title: `${note.title} (copy)`,
    tags: note.tags,
    content: note.content ?? "",
  })
}

export async function updateNote(
  id: string,
  data: Partial<{
    title: string
    content: string
    tags: string[]
    pinned: boolean
  }>
): Promise<Note> {
  const res = await fetch(`${BASE}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  const json: ApiResponse<Note> = await res.json()
  if (!json.success) throw new Error(json.error)
  return json.note!
}

export async function deleteNote(id: string): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, { method: "DELETE" })
  const json: ApiResponse<never> = await res.json()
  if (!json.success) throw new Error(json.error)
}

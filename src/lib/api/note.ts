import type { Note } from "@/components/notes/note-card"

type ApiResponse<T> =
  | { success: true; note?: T; notes?: T[]; message?: string }
  | { success: false; error: string }

const BASE = "/api/notes"

export async function fetchNotes(): Promise<Note[]> {
  const res = await fetch(BASE)
  const json: ApiResponse<Note> & { notes?: Note[] } = await res.json()
  if (!json.success) throw new Error(json.error)
  return json.notes ?? []
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

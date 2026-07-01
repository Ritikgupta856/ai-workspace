export interface Chunk {
  content: string
  chunkIndex: number
}

export function chunkText(
  text: string,
  options?: { maxTokens?: number; overlap?: number }
): Chunk[] {
  const maxTokens = options?.maxTokens ?? 512
  const overlap = options?.overlap ?? 64

  const words = text.split(/\s+/)
  const chunks: Chunk[] = []

  let start = 0
  while (start < words.length) {
    const end = Math.min(start + maxTokens, words.length)
    const content = words.slice(start, end).join(" ")
    chunks.push({ content, chunkIndex: chunks.length })
    start += maxTokens - overlap
  }

  return chunks
}

export function chunkTextByCharacters(
  text: string,
  options?: { maxChars?: number; overlapChars?: number }
): Chunk[] {
  const maxChars = options?.maxChars ?? 2000
  const overlapChars = options?.overlapChars ?? 200

  const chunks: Chunk[] = []

  let start = 0
  while (start < text.length) {
    const end = Math.min(start + maxChars, text.length)
    const content = text.slice(start, end)
    chunks.push({ content, chunkIndex: chunks.length })
    start += maxChars - overlapChars
  }

  return chunks
}

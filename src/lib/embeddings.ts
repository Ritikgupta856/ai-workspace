import { google } from "@ai-sdk/google"
import { embed, embedMany } from "ai"

const embeddingModel = google.embedding("gemini-embedding-001")
const EMBED_DIMS = 1536

export async function generateEmbedding(text: string): Promise<number[]> {
  const { embedding: result } = await embed({
    model: embeddingModel,
    value: text,
    providerOptions: {
      google: { outputDimensionality: EMBED_DIMS },
    },
  })
  return result
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return []

  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: texts,
    providerOptions: {
      google: { outputDimensionality: EMBED_DIMS },
    },
  })
  return embeddings
}

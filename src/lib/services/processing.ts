import { prisma } from "@/lib/prisma"
import { PDFParse } from "pdf-parse"
import mammoth from "mammoth"
import { cloudinary } from "@/lib/cloudinary"
import { ingestDocumentKnowledge } from "@/lib/knowledge/ingest"

export async function extractTextFromFile(
  buffer: Buffer,
  mediaType: string,
  filename: string
): Promise<string> {
  const extension = filename.split(".").pop()?.toLowerCase() ?? ""

  if (mediaType === "application/pdf" || extension === "pdf") {
    const parser = new PDFParse({ data: buffer })
    try {
      const result = await parser.getText()
      return result.text || ""
    } finally {
      await parser.destroy()
    }
  }

  if (
    mediaType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    extension === "docx"
  ) {
    const result = await mammoth.extractRawText({ buffer })
    return result.value || ""
  }

  if (
    mediaType === "text/plain" ||
    mediaType === "text/markdown" ||
    extension === "txt" ||
    extension === "md"
  ) {
    return buffer.toString("utf-8")
  }

  throw new Error(`Unsupported file format: ${mediaType} (${filename})`)
}

export async function processDocumentBackground(
  documentId: string,
  mediaType: string,
  filename: string,
  buffer: Buffer
): Promise<void> {
  console.log(`[RAG] 📝 Processing: documentId=${documentId} filename="${filename}" mediaType=${mediaType}`)
  try {
    await prisma.document.update({
      where: { id: documentId },
      data: {
        processingStatus: "PROCESSING",
      },
    })

    const extractedText = await extractTextFromFile(buffer, mediaType, filename)
    console.log(`[RAG] ✅ Text extraction complete: documentId=${documentId} chars=${extractedText.length}`)

    const doc = await prisma.document.update({
      where: { id: documentId },
      data: {
        extractedText,
        processingStatus: "COMPLETED",
        processedAt: new Date(),
      },
      select: { id: true, workspaceId: true, title: true, extractedText: true },
    })

    if (doc.extractedText?.trim()) {
      console.log(`[RAG] 🔗 Triggering knowledge ingestion: documentId=${doc.id} workspaceId=${doc.workspaceId}`)
      await ingestDocumentKnowledge(
        doc.workspaceId,
        doc.id,
        "DOCUMENT",
        doc.title,
        doc.extractedText,
      )
      console.log(`[RAG] ✅ Knowledge ingestion complete: documentId=${doc.id}`)
    } else {
      console.log(`[RAG] ⏭️ Skipping knowledge ingestion: no extractable text for documentId=${documentId}`)
    }
  } catch (error: any) {
    console.error(`[RAG] ❌ Error processing document ${documentId}:`, error)
    await prisma.document.update({
      where: { id: documentId },
      data: {
        processingStatus: "FAILED",
        processingError: error?.message || String(error),
      },
    }).catch((dbErr) => {
      console.error("Failed to save error status to database:", dbErr)
    })
  }
}

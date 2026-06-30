import { prisma } from "@/lib/prisma"
import { PDFParse } from "pdf-parse"
import mammoth from "mammoth"
import { cloudinary } from "@/lib/cloudinary"

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
  try {
    // 1. Mark as PROCESSING
    await prisma.document.update({
      where: { id: documentId },
      data: {
        processingStatus: "PROCESSING",
      },
    })

    // 2. Extract text based on file type directly from the passed buffer
    const extractedText = await extractTextFromFile(buffer, mediaType, filename)

    // 3. Update Document
    await prisma.document.update({
      where: { id: documentId },
      data: {
        extractedText,
        processingStatus: "COMPLETED",
        processedAt: new Date(),
      },
    })
  } catch (error: any) {
    console.error(`Error processing document ${documentId}:`, error)
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

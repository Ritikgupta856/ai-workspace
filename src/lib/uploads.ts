/**
 * Browser → Cloudinary direct uploads, shared by the chat composer and the page
 * editor. Files never pass through our API: the server signs a one-time upload
 * into the workspace's private folder, the browser sends the file straight to
 * Cloudinary, then the server verifies it with Cloudinary before trusting it.
 *
 * The limits live here so the browser can reject a file before uploading and
 * the server can enforce the same rules afterwards.
 */

export type UploadPurpose = "document" | "attachment"

/** Cloudinary's free plan caps a single file at 10 MB. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

const IMAGES = ["png", "jpg", "jpeg", "gif", "webp"]

export const ALLOWED_EXTENSIONS: Record<UploadPurpose, string[]> = {
  // Chat: readable documents feed the knowledge base; images go to the model.
  document: ["pdf", "docx", "txt", "md", "csv", "json", "html", ...IMAGES],
  // Page editor: inline images, plus common office files as downloads.
  attachment: [...IMAGES, "pdf", "docx", "xlsx", "pptx", "txt", "md", "csv", "zip"],
}

export function fileExtension(filename: string) {
  const dot = filename.lastIndexOf(".")
  return dot === -1 ? "" : filename.slice(dot + 1).toLowerCase()
}

/** Why this file can't be uploaded, or null when it can. */
export function uploadProblem(file: { name: string; size: number }, purpose: UploadPurpose) {
  const extension = fileExtension(file.name)
  if (!ALLOWED_EXTENSIONS[purpose].includes(extension)) {
    return `${extension ? `.${extension}` : "This"} files aren't supported. Allowed: ${ALLOWED_EXTENSIONS[purpose].join(", ")}.`
  }
  if (file.size > MAX_UPLOAD_BYTES) return "Files must be 10 MB or smaller."
  if (file.size === 0) return "This file is empty."
  return null
}

export type UploadedFile = {
  /** Permanent app URL (/api/files/…): checks membership, then redirects to a short-lived signed link. */
  url: string
  filename: string
  mediaType: string
  bytes: number
  /** Set when the file was indexed into the knowledge base. */
  documentId?: string
}

type SignedUpload = { uploadUrl: string; fields: Record<string, string> }

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Upload failed (${res.status})`)
  return data as T
}

/** XHR rather than fetch: it's the only browser API that reports upload progress. */
function sendToCloudinary(file: File, signed: SignedUpload, onProgress?: (percent: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const form = new FormData()
    for (const [key, value] of Object.entries(signed.fields)) form.append(key, value)
    form.append("file", file)

    const xhr = new XMLHttpRequest()
    xhr.open("POST", signed.uploadUrl)
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100))
    }
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Upload to storage failed (${xhr.status})`))
    xhr.onerror = () => reject(new Error("Network error while uploading"))
    xhr.send(form)
  })
}

export async function uploadFile(
  file: File,
  purpose: UploadPurpose,
  onProgress?: (percent: number) => void
): Promise<UploadedFile> {
  const problem = uploadProblem(file, purpose)
  if (problem) throw new Error(problem)

  const meta = { filename: file.name, size: file.size, mediaType: file.type, purpose }
  const signed = await postJson<SignedUpload & { publicId: string }>("/api/upload/sign", meta)
  await sendToCloudinary(file, signed, onProgress)
  return postJson<UploadedFile>("/api/upload/complete", { ...meta, publicId: signed.publicId })
}

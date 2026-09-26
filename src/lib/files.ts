import { randomUUID } from "node:crypto"
import { v2 as cloudinary } from "cloudinary"

import type { UploadPurpose } from "@/lib/uploads"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_SECRET_KEY!,
})

/**
 * Workspace files live privately in Cloudinary under
 * `synapse/workspaces/<workspaceId>/<documents|attachments>/<uuid>.<ext>` —
 * under `synapse/` because the Cloudinary account is shared with other projects.
 *
 * - Stored as `raw` + `private`: nothing is reachable without a signature, and
 *   signed links still serve the right Content-Type inline (images render,
 *   PDFs preview). Free plans also block plain PDF delivery; signed links don't.
 * - Pages, chats and documents store the app URL `/api/files/<publicId>`, never
 *   a Cloudinary URL: it checks membership on every open, then redirects to a
 *   link that expires in minutes, so stored content never goes stale.
 * - The workspace id in the path is what access checks and workspace deletion
 *   key off — no extra table needed.
 */

const RESOURCE = { resource_type: "raw", type: "private" } as const

export const FILE_ROUTE = "/api/files/"

const ROOT_FOLDER = "synapse/workspaces"

const PUBLIC_ID = /^synapse\/workspaces\/([\w-]+)\/(documents|attachments)\/[\w-]+\.[a-z0-9]+$/

export function fileUrl(publicId: string) {
  return `${FILE_ROUTE}${publicId}`
}

/** The public id behind an app file URL (relative or absolute), or null for anything else. */
export function publicIdFromUrl(url: string): string | null {
  const path = url.startsWith("/") ? url : URL.canParse(url) ? new URL(url).pathname : ""
  if (!path.startsWith(FILE_ROUTE)) return null
  const publicId = decodeURIComponent(path.slice(FILE_ROUTE.length))
  return PUBLIC_ID.test(publicId) ? publicId : null
}

export function workspaceOfFile(publicId: string): string | null {
  return PUBLIC_ID.exec(publicId)?.[1] ?? null
}

export function folderOf(publicId: string): UploadPurpose | null {
  const folder = PUBLIC_ID.exec(publicId)?.[2]
  return folder === "documents" ? "document" : folder === "attachments" ? "attachment" : null
}

/** A one-time, signed upload that can only write this exact private file. */
export function signUpload(workspaceId: string, purpose: UploadPurpose, extension: string) {
  const publicId = `${ROOT_FOLDER}/${workspaceId}/${purpose}s/${randomUUID()}.${extension}`
  const params = { timestamp: Math.floor(Date.now() / 1000), public_id: publicId, type: RESOURCE.type }
  const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_SECRET_KEY!)

  return {
    publicId,
    uploadUrl: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/raw/upload`,
    fields: {
      ...params,
      timestamp: String(params.timestamp),
      api_key: process.env.CLOUDINARY_API_KEY!,
      signature,
    },
  }
}

/** Asks Cloudinary what was actually stored — the browser's word isn't enough. Null if nothing is there. */
export async function inspectFile(publicId: string): Promise<{ bytes: number } | null> {
  try {
    const resource = await cloudinary.api.resource(publicId, RESOURCE)
    return { bytes: resource.bytes }
  } catch (err) {
    if ((err as { error?: { http_code?: number } }).error?.http_code === 404) return null
    throw err
  }
}

/** A link that works for `ttlSeconds` for anyone holding it — hand it out only after an access check. */
export function signedFileUrl(publicId: string, ttlSeconds = 600) {
  return cloudinary.utils.private_download_url(publicId, "", {
    ...RESOURCE,
    expires_at: Math.floor(Date.now() / 1000) + ttlSeconds,
  })
}

export async function downloadFile(publicId: string): Promise<Buffer> {
  const res = await fetch(signedFileUrl(publicId, 120))
  if (!res.ok) throw new Error(`Couldn't download ${publicId} (${res.status})`)
  return Buffer.from(await res.arrayBuffer())
}

export async function deleteFile(publicId: string) {
  await cloudinary.uploader.destroy(publicId, { ...RESOURCE, invalidate: true })
}

/**
 * The one public file per workspace: logos appear on invite pages and emails
 * to people who aren't members yet. Normalised to a small PNG, which keeps it
 * light and turns SVGs (which can carry scripts) into plain pixels. The
 * returned URL is versioned, so a replaced logo isn't served from cache.
 */
export async function uploadWorkspaceLogo(workspaceId: string, dataUrl: string): Promise<string> {
  const result = await cloudinary.uploader.upload(dataUrl, {
    resource_type: "image",
    public_id: `${ROOT_FOLDER}/${workspaceId}/logo`,
    overwrite: true,
    invalidate: true,
    format: "png",
    transformation: [{ width: 256, height: 256, crop: "limit" }],
  })
  return result.secure_url
}

/** Removes everything a workspace stored: private files and its public logo. */
export async function deleteWorkspaceFiles(workspaceId: string) {
  const prefix = `${ROOT_FOLDER}/${workspaceId}/`
  await cloudinary.api.delete_resources_by_prefix(prefix, RESOURCE)
  await cloudinary.api.delete_resources_by_prefix(prefix, { resource_type: "image", type: "upload" })
  await cloudinary.api.delete_folder(prefix.slice(0, -1)).catch(() => {}) // already gone if it never had files
}

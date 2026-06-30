import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_SECRET_KEY!,
})

export interface CloudinaryUploadResult {
  url: string
  publicId: string
  filename: string
  mediaType: string
  bytes: number
}

export async function uploadFile(
  buffer: Buffer,
  filename: string,
  mediaType: string
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "chat-attachments",
        resource_type: "auto",
        public_id: `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, "_")}`,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Upload failed"))
          return
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          filename,
          mediaType,
          bytes: result.bytes,
        })
      }
    )
    uploadStream.end(buffer)
  })
}

export { cloudinary }

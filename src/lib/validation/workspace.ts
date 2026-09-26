import { z } from "zod"

export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .min(3, "Workspace name must be at least 3 characters")
    .max(50, "Workspace name must not exceed 50 characters"),
  description: z
    .string()
    .max(200, "Description must not exceed 200 characters")
    .optional(),
  // A data URL from the create dialog; the server moves it to Cloudinary and
  // stores only the URL. ~2.8M chars is the dialog's 2 MB limit after base64.
  logo: z
    .union([
      z.literal(""),
      z
        .string()
        .regex(/^data:image\/(png|jpeg|svg\+xml);base64,/, "Logo must be a PNG, JPG or SVG image")
        .max(2_800_000, "Logo must be under 2MB"),
    ])
    .optional(),
})

export type CreateWorkspaceValues = z.infer<typeof createWorkspaceSchema>

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
  logo: z.string().optional(),
})

export type CreateWorkspaceValues = z.infer<typeof createWorkspaceSchema>

import { z } from "zod"

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(60, "Name must not exceed 60 characters"),
})

export const updateWorkspaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Workspace name must be at least 3 characters")
    .max(50, "Workspace name must not exceed 50 characters"),
  description: z
    .string()
    .trim()
    .max(200, "Description must not exceed 200 characters")
    .optional()
    .or(z.literal("")),
})

export type UpdateProfileValues = z.infer<typeof updateProfileSchema>
export type UpdateWorkspaceValues = z.infer<typeof updateWorkspaceSchema>

"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import type { MemberRoleKey } from "@/lib/constants"
import { apiRequest, jsonRequest } from "@/lib/query/fetcher"
import { queryKeys } from "@/lib/query/keys"

export type Member = {
  id: string
  userId: string
  name: string
  email: string
  role: MemberRoleKey
  avatar: string | null
  joinedAt: string
  lastActive: string
  taskCount: number
}

export type Invitation = {
  id: string
  email: string
  role: MemberRoleKey
  status: string
  token: string
  invitedBy: { name: string | null; email: string }
  createdAt: string
  expiresAt: string
}

/** Everyone in the workspace, plus what the current user is allowed to do with them. */
export function useWorkspaceMembers(options?: { enabled?: boolean }) {
  return useQuery({
    enabled: options?.enabled ?? true,
    queryKey: queryKeys.workspace.members,
    queryFn: async () => {
      const json = await apiRequest<{ members: Member[]; currentUserRole: MemberRoleKey }>("/api/workspaces/members")
      return { members: json.members, currentUserRole: json.currentUserRole }
    },
  })
}

export function useWorkspaceInvites() {
  return useQuery({
    queryKey: queryKeys.workspace.invites,
    queryFn: async () => (await apiRequest<{ invites: Invitation[] }>("/api/workspaces/invites")).invites,
  })
}

/** Invites and members change together (an accepted invite becomes a member), so both refresh. */
function useInvalidateWorkspacePeople() {
  const client = useQueryClient()
  return () => client.invalidateQueries({ queryKey: queryKeys.workspace.all })
}

export function useInviteMember() {
  const invalidate = useInvalidateWorkspacePeople()
  return useMutation({
    mutationFn: (values: { email: string; role: string; message?: string }) =>
      apiRequest("/api/workspaces/invites", jsonRequest("POST", values)),
    onSuccess: () => {
      toast.success("Invitation sent successfully")
      invalidate()
    },
    onError: (error) => toast.error(error.message || "Something went wrong"),
  })
}

export function useResendInvite() {
  const invalidate = useInvalidateWorkspacePeople()
  return useMutation({
    mutationFn: (id: string) => apiRequest("/api/workspaces/invites", jsonRequest("PUT", { id })),
    onSuccess: () => {
      toast.success("Invitation resent successfully")
      invalidate()
    },
    onError: (error) => toast.error(error.message || "Failed to resend invitation"),
  })
}

export function useCancelInvite() {
  const client = useQueryClient()
  const invalidate = useInvalidateWorkspacePeople()
  return useMutation({
    mutationFn: (id: string) => apiRequest("/api/workspaces/invites", jsonRequest("DELETE", { id })),
    // The row leaves the table at once; a failure puts it back.
    onMutate: async (id) => {
      await client.cancelQueries({ queryKey: queryKeys.workspace.invites })
      const previous = client.getQueryData<Invitation[]>(queryKeys.workspace.invites)
      client.setQueryData<Invitation[]>(queryKeys.workspace.invites, (old) => old?.filter((i) => i.id !== id))
      return { previous }
    },
    onError: (error, _id, context) => {
      client.setQueryData(queryKeys.workspace.invites, context?.previous)
      toast.error(error.message || "Failed to cancel invitation")
    },
    onSuccess: () => toast.success("Invitation cancelled"),
    onSettled: invalidate,
  })
}

/** Creates a workspace. The caller decides where to go next with the new slug. */
export function useCreateWorkspace() {
  return useMutation({
    mutationFn: async (values: { name: string; [key: string]: unknown }) =>
      (await apiRequest<{ workspace: { slug: string } }>("/api/workspaces", jsonRequest("POST", values))).workspace,
    onError: (error) => toast.error(error.message || "Something went wrong"),
  })
}

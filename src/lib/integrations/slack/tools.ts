import { tool } from "ai"
import { z } from "zod"

import { apiJson } from "../shared"

type SlackResponse<T> = { ok: boolean; error?: string } & T

async function slack<T>(
  token: string,
  method: string,
  params: Record<string, string | number | undefined> = {}
) {
  const url = new URL(`https://slack.com/api/${method}`)
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value))
  }

  const data = await apiJson<SlackResponse<T>>(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    errorLabel: `Slack ${method}`,
  })

  if (!data.ok) throw new Error(`Slack ${method} failed: ${data.error}`)
  return data
}

export function createSlackTools(token: string) {
  return {
    listSlackChannels: tool({
      description:
        "List Slack channels in the connected workspace. Use this first to find a channel id.",
      inputSchema: z.object({
        limit: z.number().min(1).max(200).optional().default(50),
        includePrivate: z.boolean().optional().default(false),
      }),
      execute: async ({ limit, includePrivate }) => {
        const data = await slack<{
          channels: {
            id: string
            name: string
            topic?: { value: string }
            purpose?: { value: string }
            num_members?: number
            is_archived?: boolean
          }[]
        }>(token, "conversations.list", {
          limit: limit ?? 50,
          exclude_archived: "true",
          types: includePrivate
            ? "public_channel,private_channel"
            : "public_channel",
        })

        return data.channels.map((c) => ({
          id: c.id,
          name: `#${c.name}`,
          topic: c.topic?.value || null,
          purpose: c.purpose?.value || null,
          members: c.num_members ?? null,
        }))
      },
    }),

    getSlackChannelHistory: tool({
      description:
        "Read recent messages from a Slack channel. Requires the channel id from listSlackChannels.",
      inputSchema: z.object({
        channelId: z.string().describe("Slack channel id, e.g. C0123456789"),
        limit: z.number().min(1).max(100).optional().default(30),
      }),
      execute: async ({ channelId, limit }) => {
        const data = await slack<{
          messages: {
            ts: string
            user?: string
            text?: string
            thread_ts?: string
            reply_count?: number
          }[]
        }>(token, "conversations.history", {
          channel: channelId,
          limit: limit ?? 30,
        })

        return data.messages.map((m) => ({
          ts: m.ts,
          userId: m.user ?? null,
          text: m.text ?? "",
          threadTs: m.thread_ts ?? null,
          replyCount: m.reply_count ?? 0,
          postedAt: new Date(Number(m.ts) * 1000).toISOString(),
        }))
      },
    }),

    getSlackThread: tool({
      description:
        "Read every reply in a Slack thread, given the channel id and the parent message timestamp.",
      inputSchema: z.object({
        channelId: z.string(),
        threadTs: z.string().describe("Timestamp of the parent message"),
        limit: z.number().min(1).max(100).optional().default(50),
      }),
      execute: async ({ channelId, threadTs, limit }) => {
        const data = await slack<{
          messages: { ts: string; user?: string; text?: string }[]
        }>(token, "conversations.replies", {
          channel: channelId,
          ts: threadTs,
          limit: limit ?? 50,
        })

        return data.messages.map((m) => ({
          ts: m.ts,
          userId: m.user ?? null,
          text: m.text ?? "",
          postedAt: new Date(Number(m.ts) * 1000).toISOString(),
        }))
      },
    }),

    listSlackUsers: tool({
      description:
        "List Slack workspace members, to resolve the user ids returned by message tools into names.",
      inputSchema: z.object({
        limit: z.number().min(1).max(200).optional().default(100),
      }),
      execute: async ({ limit }) => {
        const data = await slack<{
          members: {
            id: string
            name: string
            real_name?: string
            deleted?: boolean
            is_bot?: boolean
            profile?: { title?: string; email?: string }
          }[]
        }>(token, "users.list", { limit: limit ?? 100 })

        return data.members
          .filter((m) => !m.deleted && !m.is_bot)
          .map((m) => ({
            id: m.id,
            handle: m.name,
            name: m.real_name ?? m.name,
            title: m.profile?.title || null,
          }))
      },
    }),
  }
}

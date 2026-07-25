import type { Tool } from "ai"

import { createTokenProvider } from "../shared"
import { createSlackTools } from "./tools"

export const slackProvider = createTokenProvider({
  type: "SLACK",
  systemPrompt:
    "**Slack** — channels, messages and threads: where decisions were argued out and announced. " +
    "Resolve a channel name to an id with listSlackChannels before reading history. " +
    "When a message has replies, read the thread — the decision is usually in the replies, not the parent. " +
    "Authors come back as user ids; resolve them with listSlackUsers before naming anyone.",
  makeTools: (accessToken) =>
    createSlackTools(accessToken) as unknown as Record<string, Tool>,
})

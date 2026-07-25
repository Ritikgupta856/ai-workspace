import type { Tool } from "ai"

import { createTokenProvider } from "../shared"
import { createLinearTools } from "./tools"

export const linearProvider = createTokenProvider({
  type: "LINEAR",
  systemPrompt:
    "**Linear** — issues, cycles and project status. Identifiers look like ENG-231. " +
    "The list view omits descriptions and comments: fetch the full issue whenever the question is why " +
    "something changed, stalled or moved. Every issue has a url — cite it.",
  makeTools: (accessToken) =>
    createLinearTools(accessToken) as unknown as Record<string, Tool>,
})

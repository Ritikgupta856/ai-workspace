import type { Tool } from "ai"

import { createTokenProvider } from "../shared"
import { createFigmaTools } from "./tools"

export const figmaProvider = createTokenProvider({
  type: "FIGMA",
  systemPrompt:
    "**Figma** — design files, pages, frames and the comments left on them. " +
    "File keys and team ids come out of Figma URLs: ask for the link rather than guessing an id. " +
    "Design rationale usually lives in the file comments, not the frame names.",
  makeTools: (accessToken) =>
    createFigmaTools(accessToken) as unknown as Record<string, Tool>,
})

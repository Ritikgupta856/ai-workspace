import type { Tool } from "ai"

import { createTokenProvider } from "../shared"
import { createNotionTools } from "./tools"

export const notionProvider = createTokenProvider({
  type: "NOTION",
  systemPrompt:
    "**Notion** — specs, docs, meeting notes and databases. " +
    "Search returns titles only, never page text: always read the page content before answering from it. " +
    "Each page has a url — cite it.",
  makeTools: (accessToken) =>
    createNotionTools(accessToken) as unknown as Record<string, Tool>,
})

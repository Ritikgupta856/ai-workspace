/**
 * Page helpers shared by the API routes and the agent tools.
 *
 * `Page.content` is a Tiptap/ProseMirror-style JSON doc (see the editor in
 * src/components/pages). Nothing needed its plain-text form until the agent
 * did — this is that extractor.
 */

type RichTextNode = {
  type?: string
  text?: string
  content?: RichTextNode[]
}

export function pageContentToText(content: unknown): string {
  if (!content) return ""
  if (typeof content === "string") return content

  const parts: string[] = []

  function walk(node: unknown) {
    if (!node) return
    if (Array.isArray(node)) {
      node.forEach(walk)
      return
    }
    if (typeof node !== "object") return

    const n = node as RichTextNode
    if (typeof n.text === "string") parts.push(n.text)
    if (Array.isArray(n.content)) n.content.forEach(walk)
    // Block-level nodes (paragraphs, headings, list items...) get a line
    // break after their own content so the extracted text isn't one run-on line.
    if (n.type && n.type !== "text") parts.push("\n")
  }

  walk(content)

  return parts.join("").replace(/\n{3,}/g, "\n\n").trim()
}

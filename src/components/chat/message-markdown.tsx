"use client"

import { memo } from "react"
import { Streamdown } from "streamdown"
import { code } from "@streamdown/code"

const plugins = { code }

/**
 * Streamdown renders every element with a `data-streamdown` attribute, so the
 * reading styles are applied from the wrapper — overriding the components
 * themselves would drop the built-in copy controls on code blocks and tables.
 */
const PROSE = [
  // 15px on a 28px line; one line of space between blocks.
  "text-[15px] leading-7 text-foreground [overflow-wrap:anywhere]",
  "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
  "[&_p]:my-4",

  "[&_:is(h1,h2,h3,h4)]:font-semibold [&_:is(h1,h2,h3,h4)]:tracking-tight [&_:is(h1,h2,h3,h4)]:text-foreground",
  "[&_h1]:mt-8 [&_h1]:mb-3 [&_h1]:text-[20px] [&_h1]:leading-8",
  "[&_h2]:mt-7 [&_h2]:mb-2.5 [&_h2]:text-[17px]",
  "[&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-[15px]",
  "[&_h4]:mt-5 [&_h4]:mb-1.5 [&_h4]:text-[15px] [&_h4]:text-muted-foreground",

  // Markers hang outside the text column, as in a document.
  "[&_:is(ol,ul)]:my-4 [&_:is(ol,ul)]:list-outside [&_:is(ol,ul)]:pl-6",
  "[&_li]:my-1 [&_li]:py-0 [&_li]:pl-1 [&_li]:marker:text-muted-foreground",
  "[&_li>:is(ol,ul)]:my-1",

  "[&_strong]:font-semibold [&_strong]:text-foreground",
  "[&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:decoration-primary/30 [&_a]:underline-offset-[3px] [&_a:hover]:decoration-primary",
  "[&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:not-italic [&_blockquote]:text-muted-foreground",
  "[&_hr]:my-8 [&_hr]:border-border",

  "[&_[data-streamdown=inline-code]]:rounded-md [&_[data-streamdown=inline-code]]:bg-muted [&_[data-streamdown=inline-code]]:px-1.5 [&_[data-streamdown=inline-code]]:py-0.5 [&_[data-streamdown=inline-code]]:font-mono [&_[data-streamdown=inline-code]]:text-[0.84em]",

  // Code: one quiet container — language + copy on top, code below, no box-in-a-box.
  "[&_[data-streamdown=code-block]]:my-5 [&_[data-streamdown=code-block]]:gap-0 [&_[data-streamdown=code-block]]:rounded-xl [&_[data-streamdown=code-block]]:bg-muted/50 dark:[&_[data-streamdown=code-block]]:bg-card",
  "[&_[data-streamdown=code-block-header]]:px-2 [&_[data-streamdown=code-block-header]]:text-[12px]",
  "[&_[data-streamdown=code-block-actions]]:border-0 [&_[data-streamdown=code-block-actions]]:bg-transparent [&_[data-streamdown=code-block-actions]]:backdrop-blur-none",
  "[&_[data-streamdown=code-block-body]]:rounded-none [&_[data-streamdown=code-block-body]]:border-0 [&_[data-streamdown=code-block-body]]:bg-transparent [&_[data-streamdown=code-block-body]]:px-2 [&_[data-streamdown=code-block-body]]:pt-2 [&_[data-streamdown=code-block-body]]:pb-1 [&_[data-streamdown=code-block-body]]:text-[13px] [&_[data-streamdown=code-block-body]]:leading-6",
  "[&_[data-streamdown=code-block-body]_pre]:bg-transparent!",

  // Tables: row rules only, no card around them.
  "[&_[data-streamdown=table-wrapper]]:my-5 [&_[data-streamdown=table-wrapper]]:gap-1 [&_[data-streamdown=table-wrapper]]:rounded-none [&_[data-streamdown=table-wrapper]]:border-0 [&_[data-streamdown=table-wrapper]]:bg-transparent [&_[data-streamdown=table-wrapper]]:p-0",
  "[&_div:has(>[data-streamdown=table])]:rounded-none [&_div:has(>[data-streamdown=table])]:border-0 [&_div:has(>[data-streamdown=table])]:bg-transparent [&_[data-streamdown=table]]:border-0",
  "[&_[data-streamdown=table-header]]:bg-transparent",
  "[&_[data-streamdown=table-header-cell]]:border-b [&_[data-streamdown=table-header-cell]]:border-border [&_[data-streamdown=table-header-cell]]:px-3 [&_[data-streamdown=table-header-cell]]:py-2 [&_[data-streamdown=table-header-cell]]:text-[13px] [&_[data-streamdown=table-header-cell]]:font-medium [&_[data-streamdown=table-header-cell]]:text-muted-foreground",
  "[&_[data-streamdown=table-cell]]:border-b [&_[data-streamdown=table-cell]]:border-border/60 [&_[data-streamdown=table-cell]]:px-3 [&_[data-streamdown=table-cell]]:py-2 [&_[data-streamdown=table-cell]]:align-top [&_[data-streamdown=table-cell]]:text-[14px] [&_[data-streamdown=table-cell]]:leading-6",
  "[&_:is([data-streamdown=table-header-cell],[data-streamdown=table-cell]):first-child]:pl-0",
].join(" ")

export const MessageMarkdown = memo(
  function MessageMarkdown({ content, isStreaming = false }: { content: string; isStreaming?: boolean }) {
    return (
      <Streamdown
        className={PROSE}
        plugins={plugins}
        isAnimating={isStreaming}
        caret="circle"
        lineNumbers={false}
        shikiTheme={["github-light", "github-dark"]}
        controls={{ code: { copy: true, download: false }, table: { copy: true, download: false, fullscreen: false }, mermaid: false }}
        linkSafety={{ enabled: false }}
      >
        {content}
      </Streamdown>
    )
  },
  (prev, next) => prev.content === next.content && prev.isStreaming === next.isStreaming
)

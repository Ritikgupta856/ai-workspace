"use client"

import ReactMarkdown from "react-markdown"
import type { Components } from "react-markdown"
async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {}
}
import { CheckIcon, CopyIcon } from "lucide-react"
import { useState, useCallback } from "react"
import { cn } from "@/lib/utils"

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    await copyToClipboard(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [text])

  return (
    <button
      onClick={handleCopy}
      className="flex size-6 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-accent hover:text-foreground group-hover/code:opacity-100"
      aria-label="Copy code"
    >
      {copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
    </button>
  )
}

const components: Components = {
  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className ?? "")
    const code = String(children).replace(/\n$/, "")
    const isInline = !match || !className

    if (isInline) {
      return (
        <code
          className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono text-foreground before:hidden after:hidden"
          {...props}
        >
          {children}
        </code>
      )
    }

    return (
      <div className="group/code relative my-4 overflow-hidden rounded-lg border">
        <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-2">
          <span className="text-xs text-muted-foreground font-mono lowercase">
            {match[1]}
          </span>
          <CopyButton text={code} />
        </div>
        <div className="overflow-x-auto">
          <pre className="p-4 text-sm leading-relaxed">
            <code className="font-mono text-sm">{code}</code>
          </pre>
        </div>
      </div>
    )
  },
  pre({ children }) {
    return <>{children}</>
  },
  table({ children }) {
    return (
      <div className="my-4 overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">{children}</table>
      </div>
    )
  },
  th({ children, className, ...props }) {
    return (
      <th
        className={cn("border-b bg-muted/50 px-4 py-2 text-left font-medium text-muted-foreground", className)}
        {...props}
      >
        {children}
      </th>
    )
  },
  td({ children, className, ...props }) {
    return (
      <td className={cn("border-b px-4 py-2", className)} {...props}>
        {children}
      </td>
    )
  },
  blockquote({ children }) {
    return (
      <blockquote className="my-4 border-l-4 border-primary/30 pl-4 italic text-muted-foreground">
        {children}
      </blockquote>
    )
  },
  ul({ children }) {
    return <ul className="my-3 list-disc pl-6 space-y-1">{children}</ul>
  },
  ol({ children }) {
    return <ol className="my-3 list-decimal pl-6 space-y-1">{children}</ol>
  },
  a({ href, children }) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="text-primary underline underline-offset-2 hover:text-primary/80"
      >
        {children}
      </a>
    )
  },
  p({ children }) {
    return <p className="my-3 leading-7">{children}</p>
  },
  h1({ children }) {
    return <h1 className="my-6 text-xl font-semibold tracking-tight">{children}</h1>
  },
  h2({ children }) {
    return <h2 className="my-5 text-lg font-semibold tracking-tight">{children}</h2>
  },
  h3({ children }) {
    return <h3 className="my-4 text-base font-semibold">{children}</h3>
  },
  hr() {
    return <hr className="my-6 border-t" />
  },
}

export function MessageMarkdown({ content }: { content: string }) {
  return (
    <div className="prose prose-sm max-w-none prose-code:before:hidden prose-code:after:hidden">
      <ReactMarkdown components={components}>
        {content}
      </ReactMarkdown>
    </div>
  )
}

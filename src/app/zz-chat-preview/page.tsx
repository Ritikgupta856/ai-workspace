"use client"

// TEMPORARY visual check for the chat conversation styles — delete after review.
import { MessageMarkdown } from "@/components/chat/message-markdown"
import { ThinkingIndicator } from "@/components/chat/thinking-indicator"

const SAMPLE = `The launch is blocked on **two items**, both owned by the web team.

## What's blocking

1. **Auth migration** — the session cookie change in \`auth.ts\` breaks Safari logins ([ENG-231](https://example.com)).
2. **Billing proration** — waiting on review:
   - PR #418 needs one more approval
   - QA sign-off is scheduled for Thursday

### Status by area

| Area | Owner | Status |
| --- | --- | --- |
| Auth | Priya | Blocked |
| Billing | Sam | In review |
| Docs | Lee | Done |

A quick fix for the cookie:

\`\`\`ts
export function sessionCookie(token: string) {
  return \`session=\${token}; Path=/; SameSite=Lax; Secure\`
}
\`\`\`

> Per the **Billing migration spec**, proration ships behind a flag first.

---

Everything else is on track for Friday.`

function Column({ dark }: { dark?: boolean }) {
  return (
    <div className={dark ? "dark" : ""}>
      <div className="min-h-screen bg-background px-6 py-8 text-foreground">
        <div className="mx-auto max-w-3xl">
          <div className="flex flex-col items-end">
            <div className="max-w-[70%] rounded-2xl bg-foreground/[0.06] px-4 py-2.5 text-[15px] leading-7 whitespace-pre-wrap dark:bg-foreground/[0.1]">
              What&apos;s blocking the launch this week?
            </div>
          </div>
          <div className="pt-4">
            <MessageMarkdown content={SAMPLE} />
          </div>
          <div className="pt-8 flex flex-col items-end">
            <div className="max-w-[70%] rounded-2xl bg-foreground/[0.06] px-4 py-2.5 text-[15px] leading-7 dark:bg-foreground/[0.1]">
              And the docs?
            </div>
          </div>
          <div className="pt-4">
            <ThinkingIndicator />
          </div>
          <div className="pt-4">
            <MessageMarkdown content={"Streaming answers end with the same dot while"} isStreaming />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ChatPreview() {
  return (
    <div className="grid grid-cols-2">
      <Column />
      <Column dark />
    </div>
  )
}

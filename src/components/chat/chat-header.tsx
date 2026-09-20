"use client"

import { ChevronDown, MessageSquare, PenSquare, Trash2 } from "lucide-react"

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { formatUpdatedDate } from "@/lib/date"
import { cn } from "@/lib/utils"
import { AgentGlyph } from "./agent-glyph"
import { useChatContext } from "./chat-provider"

export function ChatHeader() {
  const { chats, chatId, activeTitle, loadingChats, newChat, openChat, deleteChat } =
    useChatContext()

  const crumb = activeTitle ?? (chatId ? "Untitled chat" : "Ask Synapse")
  const pickerLabel = chatId ? crumb : "Recent"

  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-border/70 px-5">
      {/* Breadcrumb */}
      <nav className="flex min-w-0 items-center gap-1.5 text-sm" aria-label="Breadcrumb">
        <AgentGlyph />
        <span className="ml-1 text-muted-foreground">Agent</span>
        <span className="text-muted-foreground/60">/</span>
        <span className="truncate font-medium text-foreground">{crumb}</span>
      </nav>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-2">
        {/* Conversation picker: current chat (or "Recent" for a fresh one) + history, in a slide-in sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <button
              type="button"
              className="flex h-8 items-center overflow-hidden rounded-lg border border-border/80 bg-card text-[13px] transition-colors hover:bg-accent/40"
              aria-label="Open chat history"
            >
              <span className="flex h-full max-w-56 items-center gap-2 border-r border-border/80 px-3">
                <AgentGlyph className="size-3" />
                <span className="truncate font-medium">{pickerLabel}</span>
              </span>
              <span className="flex h-full w-7 items-center justify-center text-muted-foreground">
                <ChevronDown className="size-3.5" />
              </span>
            </button>
          </SheetTrigger>

          <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-sm">
            <SheetHeader className="flex-row items-center justify-between space-y-0 border-b border-border/70 px-4 py-3.5 text-left">
              <SheetTitle className="text-[15px]">Chat history</SheetTitle>
            </SheetHeader>

            <div className="p-2">
              <SheetClose asChild>
                <button
                  type="button"
                  onClick={() => newChat()}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-[13px] text-foreground transition-colors hover:bg-accent"
                >
                  <PenSquare className="size-3.5" />
                  New chat
                </button>
              </SheetClose>
            </div>

            <div className="border-t border-border/70 px-4 pt-3 pb-1 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
              Recent
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
              {loadingChats ? (
                <p className="text-muted-foreground px-2.5 py-3 text-xs">Loading…</p>
              ) : chats.length === 0 ? (
                <p className="text-muted-foreground px-2.5 py-3 text-xs">No conversations yet.</p>
              ) : (
                chats.map((chat) => (
                  <SheetClose asChild key={chat.id}>
                    <button
                      type="button"
                      onClick={() => openChat(chat.id)}
                      className={cn(
                        "group flex w-full items-start gap-2 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-accent",
                        chat.id === chatId && "bg-accent"
                      )}
                    >
                      <MessageSquare className="text-muted-foreground mt-0.5 size-3.5 shrink-0" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px]">{chat.title ?? "Untitled chat"}</span>
                        <span className="text-muted-foreground block text-[11px]">
                          {formatUpdatedDate(chat.updatedAt)}
                        </span>
                      </span>
                      <span
                        role="button"
                        aria-label={`Delete ${chat.title ?? "chat"}`}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          deleteChat(chat.id)
                        }}
                        className="text-muted-foreground hover:text-destructive mt-0.5 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <Trash2 className="size-3.5" />
                      </span>
                    </button>
                  </SheetClose>
                ))
              )}
            </div>
          </SheetContent>
        </Sheet>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => newChat()}
          className="h-8 gap-1.5 rounded-lg px-2.5 text-[13px] font-normal text-muted-foreground hover:text-foreground"
        >
          <PenSquare className="size-3.5" />
          <span className="hidden sm:inline">New chat</span>
        </Button>
      </div>
    </header>
  )
}

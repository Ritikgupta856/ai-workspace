"use client"

import { ChevronDown, MessageSquare, PenSquare, Trash2 } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { formatUpdatedDate } from "@/lib/date"
import { cn } from "@/lib/utils"
import { AgentGlyph } from "./agent-glyph"
import { useChatContext } from "./chat-provider"

export function ChatHeader() {
  const { chats, chatId, activeTitle, loadingChats, newChat, openChat, deleteChat } =
    useChatContext()

  const crumb = activeTitle ?? (chatId ? "Untitled chat" : "Ask Synapse")
  const pickerLabel = chatId ? crumb : "Quick Chat"

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
        {/* Conversation picker: current chat (or "Quick Chat" for a fresh one) + history */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-8 items-center overflow-hidden rounded-lg border border-border/80 bg-card text-[13px] transition-colors hover:bg-accent/40"
              aria-label="Switch conversation"
            >
              <span className="flex h-full max-w-56 items-center gap-2 border-r border-border/80 px-3">
                <AgentGlyph className="size-3" />
                <span className="truncate font-medium">{pickerLabel}</span>
              </span>
              <span className="flex h-full w-7 items-center justify-center text-muted-foreground">
                <ChevronDown className="size-3.5" />
              </span>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuItem onSelect={() => newChat()} className="gap-2">
              <PenSquare className="size-3.5" />
              New chat
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
              Recent
            </DropdownMenuLabel>

            {loadingChats ? (
              <p className="text-muted-foreground px-2 py-3 text-xs">Loading…</p>
            ) : chats.length === 0 ? (
              <p className="text-muted-foreground px-2 py-3 text-xs">No conversations yet.</p>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {chats.map((chat) => (
                  <DropdownMenuItem
                    key={chat.id}
                    onSelect={() => openChat(chat.id)}
                    className={cn("group flex items-start gap-2", chat.id === chatId && "bg-accent")}
                  >
                    <MessageSquare className="text-muted-foreground mt-0.5 size-3.5 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px]">{chat.title ?? "Untitled chat"}</span>
                      <span className="text-muted-foreground block text-[11px]">
                        {formatUpdatedDate(chat.updatedAt)}
                      </span>
                    </span>
                    <button
                      type="button"
                      aria-label={`Delete ${chat.title ?? "chat"}`}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        deleteChat(chat.id)
                      }}
                      className="text-muted-foreground hover:text-destructive mt-0.5 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </DropdownMenuItem>
                ))}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

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

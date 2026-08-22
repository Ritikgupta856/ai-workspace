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
import { formatUpdatedDate } from "@/lib/date"
import { cn } from "@/lib/utils"
import { useChatContext } from "./chat-provider"

export function ChatHeader() {
  const { chats, chatId, activeTitle, loadingChats, newChat, openChat, deleteChat } =
    useChatContext()

  const label = activeTitle ?? (chatId ? "Untitled chat" : "New chat")

  return (
    <div className="flex items-center justify-start gap-4 border-b px-4 py-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="hover:bg-accent flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium transition-colors"
          >
            <span className="truncate">{label}</span>
            <ChevronDown className="text-muted-foreground size-3.5 shrink-0" />
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
            <p className="text-muted-foreground px-2 py-3 text-xs">
              No conversations yet.
            </p>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {chats.map((chat) => (
                <DropdownMenuItem
                  key={chat.id}
                  onSelect={() => openChat(chat.id)}
                  className={cn(
                    "group flex items-start gap-2",
                    chat.id === chatId && "bg-accent"
                  )}
                >
                  <MessageSquare className="text-muted-foreground mt-0.5 size-3.5 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px]">
                      {chat.title ?? "Untitled chat"}
                    </span>
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
    </div>
  )
}

"use client"

import * as React from "react"
import { Smile, Send } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatUpdatedDate } from "@/lib/date"
import { cn } from "@/lib/utils"

interface Comment {
  id: string
  author: string
  content: string
  createdAt: string
  reactions: { emoji: string; count: number }[]
}

interface TaskCommentsSectionProps {
  comments: Comment[]
  onAddComment?: (content: string) => void
  onReact?: (commentId: string, emoji: string) => void
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function TaskCommentsSection({
  comments,
  onAddComment,
  onReact,
}: TaskCommentsSectionProps) {
  const [newComment, setNewComment] = React.useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!newComment.trim()) return
    onAddComment?.(newComment.trim())
    setNewComment("")
  }

  return (
    <div className="rounded-2xl border bg-card shadow-sm">
      <div className="p-6 pb-3">
        <h3 className="text-sm font-semibold text-foreground">
          Comments
          {comments.length > 0 && (
            <span className="ml-1.5 text-muted-foreground">
              ({comments.length})
            </span>
          )}
        </h3>
      </div>

      <div className="divide-y divide-border">
        {comments.map((comment) => (
          <div key={comment.id} className="px-6 py-4">
            <div className="flex gap-3">
              <Avatar className="size-8 shrink-0">
                <AvatarFallback className="text-xs">
                  {getInitials(comment.author)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {comment.author}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatUpdatedDate(comment.createdAt)}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {comment.content}
                </p>
                {comment.reactions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {comment.reactions.map((reaction, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => onReact?.(comment.id, reaction.emoji)}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors",
                          "hover:bg-accent"
                        )}
                      >
                        <span>{reaction.emoji}</span>
                        <span className="text-muted-foreground">
                          {reaction.count}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-border p-4">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Avatar className="size-8 shrink-0">
            <AvatarFallback className="text-xs">ME</AvatarFallback>
          </Avatar>
          <Input
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-1 border-0 bg-muted px-3 py-2 text-sm focus-visible:ring-1"
          />
          <Button
            type="submit"
            size="icon-sm"
            variant="ghost"
            disabled={!newComment.trim()}
          >
            <Send className="size-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}

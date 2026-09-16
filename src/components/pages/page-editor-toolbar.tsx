"use client"

import * as React from "react"
import type { Editor } from "@tiptap/react"
import {
  Bold,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  List,
  ListChecks,
  ListOrdered,
  Loader2,
  Minus,
  Paperclip,
  Quote,
  Strikethrough,
  Table as TableIcon,
  Underline as UnderlineIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { usePageEditorCommands } from "@/components/pages/page-editor"
import { uploadPageAttachment } from "@/lib/api/page"

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
  active,
  spinning,
  disabled,
}: {
  icon: typeof Bold
  label: string
  onClick?: () => void
  active?: boolean
  spinning?: boolean
  disabled?: boolean
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onClick}
          aria-label={label}
          disabled={disabled}
          className={cn(active && "bg-accent text-accent-foreground")}
        >
          <Icon className={cn("size-4", spinning && "animate-spin")} />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  )
}

export function PageEditorToolbar({ editor }: { editor: Editor | null }) {
  const cmd = usePageEditorCommands(editor)
  const imageInputRef = React.useRef<HTMLInputElement>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = React.useState<"image" | "file" | null>(null)

  // Re-render on every editor transaction so isActive() stays current.
  const [, forceRender] = React.useReducer((x: number) => x + 1, 0)
  React.useEffect(() => {
    if (!editor) return
    editor.on("transaction", forceRender)
    editor.on("selectionUpdate", forceRender)
    return () => {
      editor.off("transaction", forceRender)
      editor.off("selectionUpdate", forceRender)
    }
  }, [editor])

  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setUploading("image")
    try {
      const { url } = await uploadPageAttachment(file)
      cmd.insertImage(url)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload image")
    } finally {
      setUploading(null)
    }
  }

  async function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setUploading("file")
    try {
      const { url, name } = await uploadPageAttachment(file)
      cmd.insertAttachment(url, name)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload attachment")
    } finally {
      setUploading(null)
    }
  }

  if (!editor) return null

  return (
    <div className="flex items-center gap-0.5 overflow-x-auto border-b px-4 py-1.5">
      <ToolbarButton
        icon={Heading1}
        label="Heading 1"
        active={editor.isActive("heading", { level: 1 })}
        onClick={() => cmd.toggleHeading(1)}
      />
      <ToolbarButton
        icon={Heading2}
        label="Heading 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => cmd.toggleHeading(2)}
      />
      <ToolbarButton
        icon={Heading3}
        label="Heading 3"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => cmd.toggleHeading(3)}
      />

      <Separator orientation="vertical" className="mx-1 h-5" />

      <ToolbarButton icon={Bold} label="Bold" active={editor.isActive("bold")} onClick={cmd.toggleBold} />
      <ToolbarButton icon={Italic} label="Italic" active={editor.isActive("italic")} onClick={cmd.toggleItalic} />
      <ToolbarButton
        icon={UnderlineIcon}
        label="Underline"
        active={editor.isActive("underline")}
        onClick={cmd.toggleUnderline}
      />
      <ToolbarButton
        icon={Strikethrough}
        label="Strikethrough"
        active={editor.isActive("strike")}
        onClick={cmd.toggleStrike}
      />

      <Separator orientation="vertical" className="mx-1 h-5" />

      <ToolbarButton
        icon={ListOrdered}
        label="Numbered list"
        active={editor.isActive("orderedList")}
        onClick={cmd.toggleOrderedList}
      />
      <ToolbarButton
        icon={List}
        label="Bulleted list"
        active={editor.isActive("bulletList")}
        onClick={cmd.toggleBulletList}
      />
      <ToolbarButton
        icon={ListChecks}
        label="Checklist"
        active={editor.isActive("taskList")}
        onClick={cmd.toggleTaskList}
      />

      <Separator orientation="vertical" className="mx-1 h-5" />

      <ToolbarButton
        icon={Quote}
        label="Quote"
        active={editor.isActive("blockquote")}
        onClick={cmd.toggleBlockquote}
      />
      <ToolbarButton
        icon={Code2}
        label="Code block"
        active={editor.isActive("codeBlock")}
        onClick={cmd.toggleCodeBlock}
      />
      <ToolbarButton icon={Minus} label="Divider" onClick={cmd.setHorizontalRule} />

      <Separator orientation="vertical" className="mx-1 h-5" />

      <ToolbarButton
        icon={uploading === "image" ? Loader2 : ImageIcon}
        label="Image"
        spinning={uploading === "image"}
        disabled={uploading !== null}
        onClick={() => imageInputRef.current?.click()}
      />
      <ToolbarButton
        icon={uploading === "file" ? Loader2 : Paperclip}
        label="Attachment"
        spinning={uploading === "file"}
        disabled={uploading !== null}
        onClick={() => fileInputRef.current?.click()}
      />
      <ToolbarButton icon={TableIcon} label="Table" onClick={cmd.insertTable} />

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImagePick}
      />
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFilePick} />
    </div>
  )
}

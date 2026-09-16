"use client"

import * as React from "react"
import { useEditor, EditorContent, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import Link from "@tiptap/extension-link"
import TaskList from "@tiptap/extension-task-list"
import TaskItem from "@tiptap/extension-task-item"
import Underline from "@tiptap/extension-underline"
import ImageExtension from "@tiptap/extension-image"
import { Table } from "@tiptap/extension-table"
import TableRow from "@tiptap/extension-table-row"
import TableHeader from "@tiptap/extension-table-header"
import TableCell from "@tiptap/extension-table-cell"

import { cn } from "@/lib/utils"

export interface PageEditorProps {
  content: unknown
  onChange?: (json: Record<string, unknown>) => void
  editable?: boolean
  className?: string
  /** Hands the live editor instance up so a parent toolbar can drive it. */
  onEditorReady?: (editor: Editor | null) => void
}

/** Doc-body typography — done by hand instead of pulling in @tailwindcss/typography for one page. */
const DOC_STYLES = cn(
  "min-h-[50vh] w-full text-base leading-relaxed outline-none",
  "[&_h1]:mt-8 [&_h1]:mb-2 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:tracking-tight [&_h1]:first:mt-0",
  "[&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight",
  "[&_h3]:mt-5 [&_h3]:mb-1.5 [&_h3]:text-xl [&_h3]:font-semibold",
  "[&_p]:my-2.5",
  "[&_ul]:my-2.5 [&_ul]:list-disc [&_ul]:pl-6",
  "[&_ol]:my-2.5 [&_ol]:list-decimal [&_ol]:pl-6",
  "[&_li]:my-1",
  "[&_blockquote]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground",
  "[&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:text-sm",
  "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.9em]",
  "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
  "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2",
  "[&_hr]:my-6 [&_hr]:border-border",
  "[&_[data-type=taskList]]:my-2.5 [&_[data-type=taskList]]:list-none [&_[data-type=taskList]]:pl-0",
  "[&_[data-type=taskItem]]:my-1 [&_[data-type=taskItem]]:flex [&_[data-type=taskItem]]:items-start [&_[data-type=taskItem]]:gap-2",
  "[&_img]:my-3 [&_img]:max-w-full [&_img]:rounded-lg [&_img]:border",
  "[&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm",
  "[&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:px-3 [&_th]:py-1.5 [&_th]:text-left [&_th]:font-medium",
  "[&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-1.5",
  "[&_p.is-editor-empty:first-child::before]:pointer-events-none [&_p.is-editor-empty:first-child::before]:float-left [&_p.is-editor-empty:first-child::before]:h-0 [&_p.is-editor-empty:first-child::before]:text-muted-foreground/40 [&_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]"
)

export function PageEditor({
  content,
  onChange,
  editable = true,
  className,
  onEditorReady,
}: PageEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({ placeholder: "Start writing…" }),
      Link.configure({ openOnClick: false, autolink: true }),
      Underline,
      ImageExtension,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: (content as Record<string, unknown>) ?? "",
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange?.(editor.getJSON()),
    editorProps: {
      attributes: {
        class: cn(DOC_STYLES, className),
      },
    },
  })

  React.useEffect(() => {
    onEditorReady?.(editor)
    return () => onEditorReady?.(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor])

  return <EditorContent editor={editor} />
}

export function usePageEditorCommands(editor: Editor | null) {
  return {
    toggleBold: () => editor?.chain().focus().toggleBold().run(),
    toggleItalic: () => editor?.chain().focus().toggleItalic().run(),
    toggleUnderline: () => editor?.chain().focus().toggleUnderline().run(),
    toggleStrike: () => editor?.chain().focus().toggleStrike().run(),
    toggleHeading: (level: 1 | 2 | 3) => editor?.chain().focus().toggleHeading({ level }).run(),
    toggleBulletList: () => editor?.chain().focus().toggleBulletList().run(),
    toggleOrderedList: () => editor?.chain().focus().toggleOrderedList().run(),
    toggleTaskList: () => editor?.chain().focus().toggleTaskList().run(),
    toggleBlockquote: () => editor?.chain().focus().toggleBlockquote().run(),
    toggleCodeBlock: () => editor?.chain().focus().toggleCodeBlock().run(),
    setHorizontalRule: () => editor?.chain().focus().setHorizontalRule().run(),
    insertImage: (url: string) => editor?.chain().focus().setImage({ src: url }).run(),
    insertTable: () =>
      editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
    /** Inserts a 📎 link — the Link extension is already registered, so it parses straight into a mark. */
    insertAttachment: (url: string, name: string) => {
      // Filenames are attacker-controlled (whatever the picked file is named)
      // and this gets parsed as HTML, so it has to be escaped like any other
      // untrusted string before going into insertContent.
      const safeName = name.replace(/[&<>"']/g, (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
      )
      const safeUrl = encodeURI(url)
      return editor
        ?.chain()
        .focus()
        .insertContent(
          `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">📎 ${safeName}</a>&nbsp;`
        )
        .run()
    },
  }
}

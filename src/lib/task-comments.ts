/**
 * The one shape a task comment leaves the server in. Shared by the comments
 * route and the task panel payload so the two can't drift apart.
 */

export const commentSelect = {
  id: true,
  taskId: true,
  content: true,
  parentId: true,
  editedAt: true,
  createdAt: true,
  author: { select: { id: true, name: true, email: true, image: true } },
} as const

export function formatComment(comment: {
  id: string
  taskId: string
  content: string
  parentId: string | null
  editedAt: Date | null
  createdAt: Date
  author: { id: string; name: string | null; email: string; image: string | null }
}) {
  return {
    id: comment.id,
    taskId: comment.taskId,
    content: comment.content,
    parentId: comment.parentId,
    edited: comment.editedAt !== null,
    createdAt: comment.createdAt.toISOString(),
    author: {
      id: comment.author.id,
      name: comment.author.name || comment.author.email,
      image: comment.author.image,
    },
  }
}

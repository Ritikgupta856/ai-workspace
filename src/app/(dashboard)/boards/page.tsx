import { redirect } from "next/navigation"

/** Boards are listed inside their project's Board section now. */
export default function BoardsRedirectPage() {
  redirect("/projects")
}

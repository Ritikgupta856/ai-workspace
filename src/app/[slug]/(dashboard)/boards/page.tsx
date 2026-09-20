import { redirect } from "next/navigation"

/** Boards are listed inside their project's Board section now. */
export default async function BoardsRedirectPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  redirect(`/${slug}/projects`)
}

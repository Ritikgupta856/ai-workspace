import { Suspense } from "react"
import InviteClient from "./invite-client"

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  return (
    <Suspense fallback={null}>
      <InviteContent params={params} />
    </Suspense>
  )
}

async function InviteContent({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  return <InviteClient token={token} />
}

"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"

/** `/projects/[projectId]` has no content of its own — Overview is the landing section. */
export default function ProjectIndexRedirect() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  React.useEffect(() => {
    router.replace(`/projects/${projectId}/overview`)
  }, [projectId, router])

  return null
}

import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type PageHeaderProps = {
  title: string
  action?: ReactNode
}

export function PageHeader({ title, action }: PageHeaderProps) {
  return (
    <div className="page-header flex flex-wrap items-center justify-between gap-4 border-b px-6 py-3">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      </div>

      {action ? <div className="flex items-center gap-2 sm:gap-4">{action}</div> : null}
    </div>
  )
}

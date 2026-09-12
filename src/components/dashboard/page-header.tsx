import type { ReactNode } from "react"

type PageHeaderProps = {
  title: string
  action?: ReactNode
}

export function PageHeader({ title, action }: PageHeaderProps) {
  return (
    <div className="page-header flex flex-wrap items-center justify-between gap-4 px-6 pt-6 pb-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      </div>

      {action ? <div className="flex items-center gap-2 sm:gap-4">{action}</div> : null}
    </div>
  )
}

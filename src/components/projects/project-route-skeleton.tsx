"use client"

import { usePathname } from "next/navigation"

import {
  DetailPageSkeleton,
  LibraryPageSkeleton,
  PageDetailSkeleton,
  ProjectOverviewSkeleton,
  TableSkeleton,
  TaskListPageSkeleton,
} from "@/components/dashboard/loading-states"

/**
 * One loading boundary covers the projects list and every project section,
 * because the project layout fetches its data before any section renders.
 * The URL is already the destination while this shows, so it picks the
 * skeleton that matches the page about to appear.
 */
export function ProjectRouteSkeleton() {
  const pathname = usePathname()
  const section = pathname.match(/\/projects\/[^/]+\/([^/]+)/)?.[1]

  if (section === "tasks") return <TaskListPageSkeleton crumbs={3} />
  if (section === "pages" || section === "board") {
    // Opening a single page or board has its own editor layout.
    if (/\/pages\/[^/]+$/.test(pathname)) return <PageDetailSkeleton />
    if (/\/board\/[^/]+$/.test(pathname)) return <DetailPageSkeleton />
    return <LibraryPageSkeleton />
  }
  if (section || /\/projects\/[^/]+$/.test(pathname)) return <ProjectOverviewSkeleton />
  return <TableSkeleton rows={6} label="Loading projects" />
}

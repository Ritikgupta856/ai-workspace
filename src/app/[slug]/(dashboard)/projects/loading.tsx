import { ProjectRouteSkeleton } from "@/components/projects/project-route-skeleton"

/**
 * Covers the projects list and, while a project's layout fetches its data,
 * every project section — so it draws whichever page is about to appear.
 */
export default function Loading() {
  return <ProjectRouteSkeleton />
}

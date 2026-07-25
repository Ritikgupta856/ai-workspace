"use client"

import {
  ProjectCard,
  type ProjectCardData,
} from "@/components/projects/project-card"
import type { ProjectStatus } from "@/lib/projects"

export interface ProjectGridProps {
  projects: ProjectCardData[]
  onView?: (id: string) => void
  onEdit?: (id: string) => void
  onDuplicate?: (id: string) => void
  onStatusChange?: (id: string, status: ProjectStatus) => void
  onDelete?: (id: string) => void
}

export function ProjectGrid({
  projects,
  onView,
  onEdit,
  onDuplicate,
  onStatusChange,
  onDelete,
}: ProjectGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onView={onView}
          onEdit={onEdit}
          onDuplicate={onDuplicate}
          onStatusChange={onStatusChange}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}

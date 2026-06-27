"use client"

import { ProjectCard, type ProjectCardProps } from "@/components/projects/project-card"

export interface ProjectGridProps {
  projects: ProjectCardProps["project"][]
  onView?: (id: string) => void
  onEdit?: (id: string) => void
  onDuplicate?: (id: string) => void
  onFavorite?: (id: string) => void
  onArchive?: (id: string) => void
  onDelete?: (id: string) => void
}

export function ProjectGrid({
  projects,
  onView,
  onEdit,
  onDuplicate,
  onFavorite,
  onArchive,
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
          onFavorite={onFavorite}
          onArchive={onArchive}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}

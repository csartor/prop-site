"use client"

import { ProjectEmptyState } from "@/components/project-empty-state"
import { ProjectCard } from "@/components/project-card"
import type { ProjectShelfItem } from "@/lib/projects"

export function ProjectShelf({
  projects,
  createHref,
  onCreate,
}: {
  projects: ProjectShelfItem[]
  createHref?: string
  onCreate?: () => void
}) {
  return (
    <section className="flex flex-wrap gap-6 px-6 pb-10 md:px-12">
      <ProjectEmptyState href={createHref} onCreate={onCreate} />
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </section>
  )
}

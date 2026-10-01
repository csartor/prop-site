"use client"

import { useState } from "react"

import { ProjectEditView } from "@/components/project-edit-view"
import { ProjectHero } from "@/components/project-hero"
import { ProjectNavigation } from "@/components/project-navigation"
import { ProjectSupportRail } from "@/components/project-support-rail"
import { ProjectUpdates } from "@/components/project-updates"
import type { ProjectPage } from "@/lib/projects"

export function ProjectDetail({ project }: { project: ProjectPage }) {
  const [editing, setEditing] = useState(false)

  if (editing && project.isOwner) {
    return <ProjectEditView onDone={() => setEditing(false)} project={project} />
  }

  return (
    <div className="flex w-full flex-col">
      <div className="mx-auto w-full max-w-6xl px-4 pt-8 sm:px-6">
        <ProjectHero onEdit={project.isOwner ? () => setEditing(true) : undefined} project={project} />
      </div>
      <div className="mt-8 w-full border-y border-border">
        <div className="mx-auto w-full max-w-6xl overflow-x-auto px-4 sm:px-6">
          <ProjectNavigation updateCount={project.updates.length} />
        </div>
      </div>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_auto]">
          <ProjectUpdates
            isOwner={project.isOwner}
            projectId={project.id}
            updates={project.updates}
          />
          <ProjectSupportRail
            onEdit={project.isOwner ? () => setEditing(true) : undefined}
            project={project}
          />
        </div>
      </div>
    </div>
  )
}

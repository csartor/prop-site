import { notFound } from "next/navigation"

import { AppFrame } from "@/components/app-frame"
import { ProjectHero } from "@/components/project-hero"
import { ProjectNavigation } from "@/components/project-navigation"
import { ProjectSupportRail } from "@/components/project-support-rail"
import { ProjectUpdates } from "@/components/project-updates"
import { getHomeViewer } from "@/lib/posts"
import { getProjectPage, listOwnedProjects } from "@/lib/projects"

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [project, viewer, projects] = await Promise.all([
    getProjectPage(id),
    getHomeViewer(),
    listOwnedProjects(),
  ])
  if (!project) notFound()

  return (
    <AppFrame projects={projects} viewer={viewer}>
      <div className="flex w-full flex-col">
        <div className="mx-auto w-full max-w-6xl px-4 pt-8 sm:px-6">
          <ProjectHero project={project} />
        </div>
        <div className="mt-8 w-full border-y border-border">
          <div className="mx-auto w-full max-w-6xl overflow-x-auto px-4 sm:px-6">
            <ProjectNavigation updateCount={project.updates.length} />
          </div>
        </div>
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
          <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_21.5rem]">
            <ProjectUpdates updates={project.updates} />
            <ProjectSupportRail project={project} />
          </div>
        </div>
      </div>
    </AppFrame>
  )
}

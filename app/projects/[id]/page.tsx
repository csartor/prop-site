import { notFound } from "next/navigation"

import { AppFrame } from "@/components/app-frame"
import { ProjectHero } from "@/components/project-hero"
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
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6">
        <ProjectHero project={project} />
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_21.5rem]">
          <ProjectUpdates updates={project.updates} />
          <ProjectSupportRail project={project} />
        </div>
      </div>
    </AppFrame>
  )
}

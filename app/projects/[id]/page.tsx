import { notFound } from "next/navigation"

import { AppFrame } from "@/components/app-frame"
import { ProjectDetail } from "@/components/project-detail"
import { getHomeViewer } from "@/lib/posts"
import { getProjectPage, listFandomOptions, listOwnedProjects } from "@/lib/projects"

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [project, viewer, projects, fandoms] = await Promise.all([
    getProjectPage(id),
    getHomeViewer(),
    listOwnedProjects(),
    listFandomOptions(),
  ])
  if (!project) notFound()

  return (
    <AppFrame projects={projects} viewer={viewer}>
      <ProjectDetail fandoms={fandoms} project={project} />
    </AppFrame>
  )
}

import { notFound } from "next/navigation"

import { AppFrame } from "@/components/app-frame"
import { ProjectDetail } from "@/components/project-detail"
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
      <ProjectDetail project={project} />
    </AppFrame>
  )
}

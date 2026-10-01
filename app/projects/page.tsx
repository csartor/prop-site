import { AppFrame } from "@/components/app-frame"
import { ProjectsIndex } from "@/components/projects-index"
import { getHomeViewer } from "@/lib/posts"
import { listExploreProjects, listFandomOptions, listOwnedProjects, listProjectShelf } from "@/lib/projects"

export default async function ProjectsPage() {
  const [viewer, projects, shelf, fandoms, exploreProjects] = await Promise.all([
    getHomeViewer(),
    listOwnedProjects(),
    listProjectShelf(),
    listFandomOptions(),
    listExploreProjects(),
  ])

  return (
    <AppFrame projects={projects} viewer={viewer}>
      <ProjectsIndex
        exploreProjects={exploreProjects}
        fandoms={fandoms}
        projects={shelf}
        viewer={viewer}
      />
    </AppFrame>
  )
}

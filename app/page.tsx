import { HomeFeed } from "@/components/home-feed"
import { getHomeViewer, listHomePosts } from "@/lib/posts"
import { listOwnedProjects } from "@/lib/projects"

export default async function Page() {
  const [viewer, result, projects] = await Promise.all([
    getHomeViewer(),
    listHomePosts(),
    listOwnedProjects(),
  ])

  if ("error" in result) {
    return (
      <HomeFeed
        loadError="Posts are unavailable right now."
        posts={[]}
        projects={projects}
        viewer={viewer}
      />
    )
  }

  return <HomeFeed posts={result.posts} projects={projects} viewer={viewer} />
}

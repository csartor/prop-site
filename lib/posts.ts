import type { GalleryPost } from "@/components/gallery-card"
import { createClient, getOptionalUser } from "@/lib/supabase/server"

export type HomeViewer =
  | { canPost: false; reason: "anonymous" | "onboarding" }
  | {
      canPost: true
      displayName: string
      username: string
      avatarUrl: string | null
    }

const postDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
})

type ProfileRow = {
  display_name: string | null
  username: string | null
  avatar_url: string | null
}

type PostRow = {
  id: string
  title: string
  body: string
  tags: string[] | null
  created_at: string
  profiles: ProfileRow | ProfileRow[] | null
  post_images: { storage_path: string; sort_order: number }[] | null
  projects:
    | { id: string; title: string; status: string; cover_path: string | null }
    | { id: string; title: string; status: string; cover_path: string | null }[]
    | null
}

function firstProfile(profiles: PostRow["profiles"]) {
  if (Array.isArray(profiles)) return profiles[0] ?? null
  return profiles
}

export async function getHomeViewer(): Promise<HomeViewer> {
  const user = await getOptionalUser()
  if (!user) return { canPost: false, reason: "anonymous" }
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, username, avatar_url, published_at")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!profile?.username || !profile.published_at) {
    return { canPost: false, reason: "onboarding" }
  }

  return {
    canPost: true,
    displayName: profile.display_name || profile.username,
    username: profile.username,
    avatarUrl: profile.avatar_url,
  }
}

export async function listHomePosts(): Promise<
  { posts: GalleryPost[] } | { error: string }
> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("posts")
    .select(
      "id, title, body, tags, created_at, profiles!inner(display_name, username, avatar_url), post_images(storage_path, sort_order), projects(id, title, status, cover_path)",
    )
    .order("created_at", { ascending: false })
    .order("sort_order", { referencedTable: "post_images", ascending: true })

  if (error) return { error: error.message }

  const posts = ((data ?? []) as unknown as PostRow[]).flatMap((post) => {
    const profile = firstProfile(post.profiles)
    const username = profile?.username
    if (!username) return []
    const imageUrls = (post.post_images ?? [])
      .slice()
      .sort((left, right) => left.sort_order - right.sort_order)
      .map(
        (image) =>
          supabase.storage.from("post-assets").getPublicUrl(image.storage_path).data
            .publicUrl,
      )
    if (!imageUrls.length) return []
    const linked = Array.isArray(post.projects) ? post.projects[0] : post.projects
    return [
      {
        id: post.id,
        imageUrl: imageUrls[0],
        imageUrls,
        author: profile?.display_name || username,
        username,
        avatarUrl: profile?.avatar_url ?? null,
        title: post.title,
        body: post.body,
        tags: post.tags ?? [],
        createdLabel: postDate.format(new Date(post.created_at)),
        project: linked
          ? {
              id: linked.id,
              title: linked.title,
              status: linked.status,
              coverUrl: linked.cover_path
                ? supabase.storage.from("post-assets").getPublicUrl(linked.cover_path).data
                    .publicUrl
                : null,
            }
          : null,
      },
    ]
  })

  return { posts }
}

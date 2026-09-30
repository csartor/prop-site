import { createClient, getOptionalUser } from "@/lib/supabase/server"
import type { HomeViewer } from "@/lib/posts"
import type { ProjectStatus } from "@/lib/project-status"

export { projectStatusLabel } from "@/lib/project-status"
export type { ProjectStatus } from "@/lib/project-status"

export type ProjectOption = {
  id: string
  title: string
}

export type OwnedProject = ProjectOption & {
  visibility: "public" | "private"
  status: ProjectStatus
}

export type OwnedPost = {
  id: string
  title: string
  projectId: string | null
  createdLabel: string
}

export type ProjectUpdate = {
  id: string
  number: number
  title: string
  body: string
  milestone: string | null
  processNote: string | null
  createdLabel: string
  imageUrls: string[]
}

export type ProjectCreator = {
  bio: string | null
  tagline: string | null
  experienceLevel: string | null
  publicBuildCount: number
}

export type ProjectPage = {
  id: string
  title: string
  description: string
  status: ProjectStatus
  visibility: "public" | "private"
  tags: string[]
  startedLabel: string
  completedLabel: string
  material: string
  scale: string
  techniques: string
  tools: string
  buildLabel: string
  coverUrl: string | null
  galleryUrls: string[]
  lastUpdatedLabel: string
  author: string
  username: string
  avatarUrl: string | null
  creator: ProjectCreator
  updates: ProjectUpdate[]
}

const postDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
})

export function assetUrl(supabase: Awaited<ReturnType<typeof createClient>>, path: string | null) {
  if (!path) return null
  return supabase.storage.from("post-assets").getPublicUrl(path).data.publicUrl
}

function formatDateOnly(value: string | null) {
  if (!value) return "—"
  const [year, month, day] = value.split("-").map(Number)
  if (!year || !month || !day) return "—"
  return postDate.format(new Date(Date.UTC(year, month - 1, day)))
}

function blank(value: string | null) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : "—"
}

export async function listOwnedProjects(): Promise<ProjectOption[]> {
  const user = await getOptionalUser()
  if (!user) return []
  const supabase = await createClient()
  const { data } = await supabase
    .from("projects")
    .select("id, title")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
  return (data ?? []) as ProjectOption[]
}

export async function getOwnerWorkspace(): Promise<
  | { status: "anonymous" | "onboarding" }
  | {
      status: "ready"
      viewer: Extract<HomeViewer, { canPost: true }>
      projects: OwnedProject[]
      posts: OwnedPost[]
    }
> {
  const user = await getOptionalUser()
  if (!user) return { status: "anonymous" }
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, username, avatar_url, published_at")
    .eq("user_id", user.id)
    .maybeSingle()
  if (!profile?.username || !profile.published_at) return { status: "onboarding" }

  const [{ data: projects }, { data: posts }] = await Promise.all([
    supabase
      .from("projects")
      .select("id, title, visibility, status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("posts")
      .select("id, title, project_id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ])

  return {
    status: "ready",
    viewer: {
      canPost: true,
      displayName: profile.display_name || profile.username,
      username: profile.username,
      avatarUrl: profile.avatar_url,
    },
    projects: (projects ?? []) as OwnedProject[],
    posts: ((posts ?? []) as { id: string; title: string; project_id: string | null; created_at: string }[]).map(
      (post) => ({
        id: post.id,
        title: post.title,
        projectId: post.project_id,
        createdLabel: postDate.format(new Date(post.created_at)),
      }),
    ),
  }
}

type ProjectPostRow = {
  id: string
  title: string
  body: string
  milestone: string | null
  process_note: string | null
  created_at: string
  post_images: { storage_path: string; sort_order: number }[] | null
}

export async function getProjectPage(id: string): Promise<ProjectPage | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("projects")
    .select(
      "id, user_id, title, description, status, visibility, tags, started_on, completed_on, material, scale, techniques, tools, build_number, cover_path, updated_at, profiles!inner(display_name, username, avatar_url, bio, specialties, experience_level)",
    )
    .eq("id", id)
    .maybeSingle()
  if (!data) return null

  const row = data as unknown as {
    id: string
    user_id: string
    title: string
    description: string
    status: ProjectStatus
    visibility: "public" | "private"
    tags: string[] | null
    started_on: string | null
    completed_on: string | null
    material: string | null
    scale: string | null
    techniques: string | null
    tools: string | null
    build_number: number
    cover_path: string | null
    updated_at: string
    profiles:
      | {
          display_name: string | null
          username: string | null
          avatar_url: string | null
          bio: string | null
          specialties: string[] | null
          experience_level: string | null
        }
      | {
          display_name: string | null
          username: string | null
          avatar_url: string | null
          bio: string | null
          specialties: string[] | null
          experience_level: string | null
        }[]
  }
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
  if (!profile?.username) return null

  const [{ data: posts }, { count }] = await Promise.all([
    supabase
      .from("posts")
      .select("id, title, body, milestone, process_note, created_at, post_images(storage_path, sort_order)")
      .eq("project_id", id)
      .order("created_at", { ascending: false })
      .order("sort_order", { referencedTable: "post_images", ascending: true }),
    supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("user_id", row.user_id)
      .eq("visibility", "public"),
  ])

  const updates = ((posts ?? []) as unknown as ProjectPostRow[]).map((post, index, all) => ({
    id: post.id,
    number: all.length - index,
    title: post.title,
    body: post.body,
    milestone: post.milestone?.trim() || null,
    processNote: post.process_note?.trim() || null,
    createdLabel: postDate.format(new Date(post.created_at)),
    imageUrls: (post.post_images ?? [])
      .slice()
      .sort((left, right) => left.sort_order - right.sort_order)
      .map((image) => assetUrl(supabase, image.storage_path))
      .filter((url): url is string => Boolean(url)),
  }))

  const coverUrl = assetUrl(supabase, row.cover_path)
  const galleryUrls = [
    ...new Set(
      [coverUrl, ...updates.flatMap((update) => update.imageUrls)].filter(
        (url): url is string => Boolean(url),
      ),
    ),
  ]

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    visibility: row.visibility,
    tags: row.tags ?? [],
    startedLabel: formatDateOnly(row.started_on),
    completedLabel: formatDateOnly(row.completed_on),
    material: blank(row.material),
    scale: blank(row.scale),
    techniques: blank(row.techniques),
    tools: blank(row.tools),
    buildLabel: `BLD-${String(row.build_number).padStart(4, "0")}`,
    coverUrl,
    galleryUrls,
    lastUpdatedLabel: updates[0]?.createdLabel ?? postDate.format(new Date(row.updated_at)),
    author: profile.display_name || profile.username,
    username: profile.username,
    avatarUrl: profile.avatar_url,
    creator: {
      bio: profile.bio?.trim() || null,
      tagline: profile.specialties?.filter(Boolean).join(" · ") || null,
      experienceLevel: profile.experience_level?.trim() || null,
      publicBuildCount: count ?? 0,
    },
    updates,
  }
}

"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { projectFormSchema } from "@/lib/project-form"
import { createClient } from "@/lib/supabase/server"

const imageTypes = new Set(["image/jpeg", "image/png", "image/webp"])
const maxImageBytes = 5 * 1024 * 1024

function extensionFor(type: string) {
  if (type === "image/png") return "png"
  if (type === "image/webp") return "webp"
  return "jpg"
}

function uniqueTags(tags: string[]) {
  const seen = new Set<string>()
  return tags.filter((tag) => {
    const key = tag.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function dateOrNull(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null
}

function textOrNull(value: string) {
  return value ? value : null
}

function readProjectForm(formData: FormData) {
  let rawTags: unknown = []
  try {
    rawTags = JSON.parse(String(formData.get("tags") ?? "[]"))
  } catch {
    return { error: "Check the tags and try again." } as const
  }

  const parsed = projectFormSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    status: formData.get("status"),
    isPublic: formData.get("isPublic") === "true",
    tags: rawTags,
    startedOn: String(formData.get("startedOn") ?? ""),
    completedOn: String(formData.get("completedOn") ?? ""),
    material: formData.get("material") ?? "",
    scale: formData.get("scale") ?? "",
    techniques: formData.get("techniques") ?? "",
    tools: formData.get("tools") ?? "",
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the project and try again." } as const
  }
  return { data: parsed.data } as const
}

function projectFields(data: z.infer<typeof projectFormSchema>) {
  return {
    title: data.title,
    description: data.description,
    status: data.status,
    visibility: data.isPublic ? "public" : "private",
    tags: uniqueTags(data.tags),
    started_on: dateOrNull(data.startedOn),
    completed_on: dateOrNull(data.completedOn),
    material: textOrNull(data.material),
    scale: textOrNull(data.scale),
    techniques: textOrNull(data.techniques),
    tools: textOrNull(data.tools),
  }
}

function coverFile(formData: FormData) {
  const cover = formData.get("cover")
  if (!(cover instanceof File) || cover.size === 0) return null
  if (!imageTypes.has(cover.type) || cover.size > maxImageBytes) {
    return { error: "Use a JPEG, PNG, or WebP cover under 5 MB." } as const
  }
  return cover
}

export async function createProject(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Sign in to create a project." }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, published_at")
    .eq("user_id", user.id)
    .maybeSingle()
  if (!profile?.username || !profile.published_at) {
    return { error: "Finish your profile before creating a project." }
  }

  const parsed = readProjectForm(formData)
  if ("error" in parsed) return { error: parsed.error }

  const cover = coverFile(formData)
  if (!cover) return { error: "Add a cover image." }
  if ("error" in cover) return { error: cover.error }

  const projectId = crypto.randomUUID()
  const coverPath = `${user.id}/projects/${projectId}/cover.${extensionFor(cover.type)}`
  const { error: uploadError } = await supabase.storage.from("post-assets").upload(coverPath, cover, {
    contentType: cover.type,
    upsert: false,
  })
  if (uploadError) return { error: uploadError.message }

  const { error: insertError } = await supabase.from("projects").insert({
    id: projectId,
    user_id: user.id,
    ...projectFields(parsed.data),
    cover_path: coverPath,
  })
  if (insertError) {
    await supabase.storage.from("post-assets").remove([coverPath])
    return { error: insertError.message }
  }

  revalidatePath("/profile")
  revalidatePath(`/projects/${projectId}`)
  return {}
}

export async function updateProject(
  projectId: string,
  formData: FormData,
): Promise<{ error?: string }> {
  const parsedId = z.string().uuid().safeParse(projectId)
  if (!parsedId.success) return { error: "That project is not available." }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Sign in to edit this project." }

  const parsed = readProjectForm(formData)
  if ("error" in parsed) return { error: parsed.error }

  const { data: existing } = await supabase
    .from("projects")
    .select("id, cover_path, profiles!inner(username)")
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .maybeSingle()
  if (!existing) return { error: "That project is not available." }

  const row = existing as unknown as {
    cover_path: string | null
    profiles: { username: string | null } | { username: string | null }[]
  }
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
  const cover = coverFile(formData)
  if (cover && "error" in cover) return { error: cover.error }

  let coverPath = row.cover_path
  if (cover) {
    coverPath = `${user.id}/projects/${parsedId.data}/cover-${crypto.randomUUID()}.${extensionFor(cover.type)}`
    const { error: uploadError } = await supabase.storage.from("post-assets").upload(coverPath, cover, {
      contentType: cover.type,
      upsert: false,
    })
    if (uploadError) return { error: uploadError.message }
  }

  const { error: updateError } = await supabase
    .from("projects")
    .update({
      ...projectFields(parsed.data),
      cover_path: coverPath,
    })
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
  if (updateError) {
    if (cover && coverPath) await supabase.storage.from("post-assets").remove([coverPath])
    return { error: updateError.message }
  }

  if (cover && row.cover_path && row.cover_path !== coverPath) {
    await supabase.storage.from("post-assets").remove([row.cover_path])
  }

  revalidatePath("/")
  revalidatePath("/profile")
  revalidatePath(`/projects/${parsedId.data}`)
  if (profile?.username) revalidatePath(`/${profile.username}`)
  return {}
}

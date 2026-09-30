"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { projectStatuses } from "@/lib/project-status"
import { createClient } from "@/lib/supabase/server"

const imageTypes = new Set(["image/jpeg", "image/png", "image/webp"])
const maxImageBytes = 5 * 1024 * 1024

const optionalText = z.string().trim().max(200, "Use 200 characters or fewer.")

const projectSchema = z.object({
  title: z.string().trim().min(1, "Enter a title.").max(160, "Use 160 characters or fewer."),
  description: z
    .string()
    .trim()
    .min(1, "Enter a description.")
    .max(2000, "Use 2000 characters or fewer."),
  status: z.enum(projectStatuses),
  isPublic: z.boolean(),
  tags: z
    .array(z.string().trim().min(1).max(40))
    .max(10, "Use 10 tags or fewer."),
  startedOn: z.string(),
  completedOn: z.string(),
  material: optionalText,
  scale: optionalText,
  techniques: optionalText,
  tools: optionalText,
})

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

  let rawTags: unknown = []
  try {
    rawTags = JSON.parse(String(formData.get("tags") ?? "[]"))
  } catch {
    return { error: "Check the tags and try again." }
  }

  const parsed = projectSchema.safeParse({
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
    return { error: parsed.error.issues[0]?.message ?? "Check the project and try again." }
  }

  const cover = formData.get("cover")
  if (!(cover instanceof File) || cover.size === 0) return { error: "Add a cover image." }
  if (!imageTypes.has(cover.type) || cover.size > maxImageBytes) {
    return { error: "Use a JPEG, PNG, or WebP cover under 5 MB." }
  }

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
    title: parsed.data.title,
    description: parsed.data.description,
    status: parsed.data.status,
    visibility: parsed.data.isPublic ? "public" : "private",
    tags: uniqueTags(parsed.data.tags),
    started_on: dateOrNull(parsed.data.startedOn),
    completed_on: dateOrNull(parsed.data.completedOn),
    material: textOrNull(parsed.data.material),
    scale: textOrNull(parsed.data.scale),
    techniques: textOrNull(parsed.data.techniques),
    tools: textOrNull(parsed.data.tools),
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

"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"

const imageTypes = new Set(["image/jpeg", "image/png", "image/webp"])
const maxImageBytes = 5 * 1024 * 1024

const postSchema = z.object({
  title: z.string().trim().min(1, "Enter a title.").max(120, "Use 120 characters or fewer."),
  body: z
    .string()
    .trim()
    .min(1, "Enter a description.")
    .max(2000, "Use 2000 characters or fewer."),
  tags: z
    .array(z.string().trim().min(1, "Enter a tag.").max(40, "Use 40 characters or fewer."))
    .max(10, "Use 10 tags or fewer."),
  projectId: z.string().uuid().nullable(),
  milestone: z.string().trim().max(40, "Use 40 characters or fewer."),
  processNote: z.string().trim().max(160, "Use 160 characters or fewer."),
})

function extensionFor(type: string) {
  if (type === "image/png") return "png"
  if (type === "image/webp") return "webp"
  return "jpg"
}

function noteOrNull(value: string) {
  return value ? value : null
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

export async function createPost(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Sign in to post." }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, published_at")
    .eq("user_id", user.id)
    .maybeSingle()
  if (!profile?.username || !profile.published_at) {
    return { error: "Finish your profile before posting." }
  }

  let rawTags: unknown = []
  try {
    rawTags = JSON.parse(String(formData.get("tags") ?? "[]"))
  } catch {
    return { error: "Check the tags and try again." }
  }

  const projectValue = String(formData.get("projectId") ?? "")
  const parsed = postSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
    tags: rawTags,
    projectId: projectValue && projectValue !== "none" ? projectValue : null,
    milestone: String(formData.get("milestone") ?? ""),
    processNote: String(formData.get("processNote") ?? ""),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the post and try again." }
  }

  const files = formData
    .getAll("images")
    .filter((file): file is File => file instanceof File && file.size > 0)
  if (!files.length) return { error: "Add a cover image." }
  if (files.some((file) => !imageTypes.has(file.type) || file.size > maxImageBytes)) {
    return { error: "Use JPEG, PNG, or WebP images under 5 MB." }
  }

  if (parsed.data.projectId) {
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", parsed.data.projectId)
      .eq("user_id", user.id)
      .maybeSingle()
    if (!project) return { error: "Choose one of your projects." }
  }

  const postId = crypto.randomUUID()
  const { error: insertError } = await supabase.from("posts").insert({
    id: postId,
    user_id: user.id,
    title: parsed.data.title,
    body: parsed.data.body,
    tags: uniqueTags(parsed.data.tags),
    project_id: parsed.data.projectId,
    milestone: noteOrNull(parsed.data.milestone),
    process_note: noteOrNull(parsed.data.processNote),
  })
  if (insertError) return { error: insertError.message }

  const uploaded: string[] = []
  for (const [index, file] of files.entries()) {
    const path = `${user.id}/${postId}/${index}.${extensionFor(file.type)}`
    const { error: uploadError } = await supabase.storage.from("post-assets").upload(path, file, {
      contentType: file.type,
      upsert: false,
    })
    if (uploadError) {
      if (uploaded.length) await supabase.storage.from("post-assets").remove(uploaded)
      await supabase.from("posts").delete().eq("id", postId)
      return { error: uploadError.message }
    }
    uploaded.push(path)
  }

  const { error: imageError } = await supabase.from("post_images").insert(
    uploaded.map((storagePath, sortOrder) => ({
      post_id: postId,
      storage_path: storagePath,
      sort_order: sortOrder,
    })),
  )
  if (imageError) {
    await supabase.storage.from("post-assets").remove(uploaded)
    await supabase.from("posts").delete().eq("id", postId)
    return { error: imageError.message }
  }

  revalidatePath("/")
  revalidatePath("/profile")
  if (parsed.data.projectId) revalidatePath(`/projects/${parsed.data.projectId}`)
  return {}
}

export async function assignPostProject(
  postId: string,
  projectId: string | null,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Sign in to update this post." }

  const parsedId = z.string().uuid().safeParse(postId)
  const parsedProject = z.string().uuid().nullable().safeParse(projectId)
  if (!parsedId.success || !parsedProject.success) {
    return { error: "Choose one of your projects." }
  }

  const { data: post } = await supabase
    .from("posts")
    .select("id, project_id")
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .maybeSingle()
  if (!post) return { error: "That post is not available." }

  if (parsedProject.data) {
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", parsedProject.data)
      .eq("user_id", user.id)
      .maybeSingle()
    if (!project) return { error: "Choose one of your projects." }
  }

  const { error } = await supabase
    .from("posts")
    .update({ project_id: parsedProject.data })
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
  if (error) return { error: error.message }

  revalidatePath("/")
  revalidatePath("/profile")
  if (post.project_id) revalidatePath(`/projects/${post.project_id}`)
  if (parsedProject.data) revalidatePath(`/projects/${parsedProject.data}`)
  return {}
}

"use server"

import { randomUUID } from "node:crypto"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { requireAdmin } from "@/lib/admin"
import { getPatreonCampaign } from "@/lib/patreon"
import { decryptPatreonCredential } from "@/lib/patreon-credentials"
import { stripHtml } from "@/lib/text"

const reviewSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["approved", "rejected"]),
  maker_type_option_id: z.string().uuid().optional(),
})

const adminMakerSchema = z.object({
  display_name: z.string().trim().min(2).max(160),
  descriptor: z.string().trim().min(2).max(200),
  description: z.string().trim().min(20).max(1000),
  location: z.string().trim().max(160).transform((value) => value || null),
  website_url: z.string().trim().url().or(z.literal("")).transform((value) => value || null),
  instagram_url: z.string().trim().url().or(z.literal("")).transform((value) => value || null),
  patreon_url: z.string().trim().url().or(z.literal("")).transform((value) => value || null),
  facebook_url: z.string().trim().url().or(z.literal("")).transform((value) => value || null),
  accepting_commissions: z.enum(["true", "false"]).transform((value) => value === "true"),
  maker_type_option_id: z.string().uuid(),
  fandom_ids: z.array(z.string().uuid()).min(1),
  patreon_image_url: z.string().url().optional().or(z.literal("")).transform((value) => value || null),
})

const imageTypes = new Set(["image/png", "image/jpeg", "image/webp"])
const maxImageSize = 2 * 1024 * 1024
const campaignIdSchema = z.string().trim().regex(/^\d+$/, "Enter a numeric Patreon campaign ID.")
const utmValueSchema = z
  .string()
  .trim()
  .min(1, "Enter a value.")
  .max(80, "Use 80 characters or fewer.")
  .regex(/^[A-Za-z0-9._-]+$/, "Use letters, numbers, periods, underscores, or hyphens.")
const directoryTrackingSchema = z.object({
  utm_source: utmValueSchema,
  utm_medium: utmValueSchema,
  utm_campaign: utmValueSchema,
})

function makerSlug(name: string, nominationId: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 55)

  return `${base || "maker"}-${nominationId.slice(0, 8)}`
}

function safeFileName(file: File) {
  return file.name.replaceAll(/[^a-zA-Z0-9._-]/g, "-")
}

function stringAttribute(attributes: Record<string, unknown>, key: string) {
  const value = attributes[key]
  return typeof value === "string" ? value : null
}

function campaignImageUrl(value: string | null) {
  if (!value) return null
  try {
    const url = new URL(value)
    if (
      url.protocol !== "https:" ||
      !(
        url.hostname === "patreonusercontent.com" ||
        url.hostname.endsWith(".patreonusercontent.com")
      )
    ) {
      return null
    }
    return url.toString()
  } catch {
    return null
  }
}

export type AdminPatreonCampaignResult =
  | {
      campaign: {
        name: string
        descriptor: string | null
        description: string | null
        patreonUrl: string | null
        imageUrl: string | null
      }
    }
  | { error: string }

export async function fetchAdminPatreonCampaign(
  campaignId: string,
): Promise<AdminPatreonCampaignResult> {
  const parsed = campaignIdSchema.safeParse(campaignId)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { supabase, user } = await requireAdmin()
  const { data: credentials } = await supabase
    .from("patreon_credentials")
    .select("access_token_ciphertext")
    .eq("user_id", user.id)
    .maybeSingle()
  if (!credentials) {
    return {
      error:
        "Reconnect Patreon to grant campaign permissions before importing a campaign.",
    }
  }

  try {
    const campaign = await getPatreonCampaign(
      decryptPatreonCredential(credentials.access_token_ciphertext, user.id),
      parsed.data,
    )
    const attributes = campaign.attributes
    const name =
      stringAttribute(attributes, "name") ??
      stringAttribute(attributes, "creation_name")
    if (!name) return { error: "Patreon did not provide a campaign name." }
    const descriptor = stringAttribute(attributes, "creation_name")
    const description = stripHtml(stringAttribute(attributes, "summary"))

    return {
      campaign: {
        name: name.slice(0, 160),
        descriptor: descriptor?.slice(0, 200) ?? null,
        description: description?.slice(0, 400) ?? null,
        patreonUrl: stringAttribute(attributes, "pledge_url"),
        imageUrl: campaignImageUrl(
          stringAttribute(attributes, "image_url") ??
            stringAttribute(attributes, "image_small_url"),
        ),
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Patreon error"
    return {
      error:
        message.includes("401") || message.includes("403")
          ? "Patreon denied this request. Reconnect Patreon to grant campaign access."
          : message,
    }
  }
}

async function validateMakerType(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  makerTypeOptionId: string,
) {
  const { data: option, error } = await supabase
    .from("maker_filter_options")
    .select("id")
    .eq("id", makerTypeOptionId)
    .eq("category", "maker_type")
    .eq("enabled", true)
    .maybeSingle()
  if (error || !option) {
    throw new Error("Select an enabled maker type.")
  }
}

export async function createAdminMaker(formData: FormData) {
  const values = adminMakerSchema.parse({
    display_name: formData.get("display_name"),
    descriptor: formData.get("descriptor"),
    description: formData.get("description"),
    location: formData.get("location"),
    website_url: formData.get("website_url"),
    instagram_url: formData.get("instagram_url"),
    patreon_url: formData.get("patreon_url"),
    facebook_url: formData.get("facebook_url"),
    accepting_commissions: formData.get("accepting_commissions"),
    maker_type_option_id: formData.get("maker_type_option_id"),
    fandom_ids: formData.getAll("fandom_ids"),
    patreon_image_url: formData.get("patreon_image_url") || "",
  })
  const { supabase } = await requireAdmin()
  await validateMakerType(supabase, values.maker_type_option_id)
  const makerId = randomUUID()
  const thumbnail = formData.get("thumbnail")
  let thumbnailPath: string | null = null

  if (thumbnail instanceof File && thumbnail.size > 0) {
    if (!imageTypes.has(thumbnail.type) || thumbnail.size > maxImageSize) {
      throw new Error("Thumbnail must be a PNG, JPEG, or WEBP under 2MB.")
    }
    thumbnailPath = `direct/${makerId}/${safeFileName(thumbnail)}`
    const { error: uploadError } = await supabase.storage
      .from("maker-assets")
      .upload(thumbnailPath, thumbnail, {
        contentType: thumbnail.type,
      })
    if (uploadError) throw new Error(uploadError.message)
  } else if (values.patreon_image_url) {
    const imageUrl = campaignImageUrl(values.patreon_image_url)
    if (!imageUrl) throw new Error("The imported Patreon image URL is not valid.")

    const response = await fetch(imageUrl, { cache: "no-store" })
    if (!response.ok) throw new Error("Unable to download the Patreon campaign image.")
    const image = await response.blob()
    if (!imageTypes.has(image.type) || image.size > maxImageSize) {
      throw new Error("The Patreon campaign image must be PNG, JPEG, or WEBP under 2MB.")
    }

    const extension = image.type.split("/")[1] ?? "jpg"
    thumbnailPath = `direct/${makerId}/patreon-campaign.${extension}`
    const { error: uploadError } = await supabase.storage
      .from("maker-assets")
      .upload(thumbnailPath, image, {
        contentType: image.type,
      })
    if (uploadError) throw new Error(uploadError.message)
  }

  const now = new Date().toISOString()
  const { data: maker, error: makerError } = await supabase
    .from("makers")
    .insert({
      id: makerId,
      slug: makerSlug(values.display_name, makerId),
      display_name: values.display_name,
      descriptor: values.descriptor,
      description: values.description,
      location: values.location,
      maker_type_option_id: values.maker_type_option_id,
      website_url: values.website_url,
      instagram_url: values.instagram_url,
      patreon_url: values.patreon_url,
      facebook_url: values.facebook_url,
      accepting_commissions: values.accepting_commissions,
      thumbnail_path: thumbnailPath,
      published_at: now,
      updated_at: now,
    })
    .select("id")
    .single()

  if (makerError || !maker) {
    if (thumbnailPath) {
      await supabase.storage.from("maker-assets").remove([thumbnailPath])
    }
    throw new Error(makerError?.message ?? "Unable to create maker.")
  }

  const { error: fandomError } = await supabase.from("maker_fandoms").insert(
    values.fandom_ids.map((filterOptionId) => ({
      maker_id: maker.id,
      filter_option_id: filterOptionId,
    })),
  )
  if (fandomError) {
    await supabase.from("makers").delete().eq("id", maker.id)
    if (thumbnailPath) {
      await supabase.storage.from("maker-assets").remove([thumbnailPath])
    }
    throw new Error(fandomError.message)
  }

  revalidatePath("/admin")
  revalidatePath("/makers")
}

export async function updateDirectoryTrackingSettings(input: {
  utm_source: string
  utm_medium: string
  utm_campaign: string
}) {
  const values = directoryTrackingSchema.parse(input)
  const { supabase } = await requireAdmin()
  const { error } = await supabase
    .from("site_settings")
    .update({
      ...values,
      updated_at: new Date().toISOString(),
    })
    .eq("singleton", true)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/admin/settings")
  revalidatePath("/makers")
}

export async function updateMakerNominationStatus(formData: FormData) {
  const { id, status, maker_type_option_id } = reviewSchema.parse({
    id: formData.get("id"),
    status: formData.get("status"),
    maker_type_option_id: formData.get("maker_type_option_id") || undefined,
  })
  const { supabase } = await requireAdmin()
  const { data: nomination, error: nominationError } = await supabase
    .from("maker_nominations")
    .select("*")
    .eq("id", id)
    .single()

  if (nominationError || !nomination) {
    throw new Error(nominationError?.message ?? "Maker nomination not found.")
  }

  if (status === "approved") {
    if (!maker_type_option_id) {
      throw new Error("Select a maker type before approving this nomination.")
    }
    await validateMakerType(supabase, maker_type_option_id)
    const { data: existingMaker, error: existingMakerError } = await supabase
      .from("makers")
      .select("id, thumbnail_path")
      .eq("nomination_id", id)
      .maybeSingle()
    if (existingMakerError) throw new Error(existingMakerError.message)

    let thumbnailPath = existingMaker?.thumbnail_path ?? null
    if (nomination.thumbnail_path) {
      const fileName =
        nomination.thumbnail_path.split("/").pop() ?? "thumbnail"
      const nextPath = `${id}/${fileName}`
      const { data: sourceFile, error: downloadError } = await supabase.storage
        .from("maker-nomination-assets")
        .download(nomination.thumbnail_path)
      if (downloadError) throw new Error(downloadError.message)

      const { error: uploadError } = await supabase.storage
        .from("maker-assets")
        .upload(nextPath, sourceFile, {
          contentType: sourceFile.type || undefined,
          upsert: true,
        })
      if (uploadError) throw new Error(uploadError.message)
      thumbnailPath = nextPath
    }

    const { data: maker, error: makerError } = await supabase
      .from("makers")
      .upsert(
        {
          nomination_id: id,
          user_id:
            nomination.relationship === "self"
              ? nomination.submitter_user_id
              : null,
          slug: makerSlug(nomination.maker_name, id),
          display_name: nomination.maker_name,
          descriptor: nomination.descriptor,
          description: nomination.description,
          location: nomination.location,
          maker_type_option_id,
          website_url: nomination.website_url,
          instagram_url: nomination.instagram_url,
          patreon_url: nomination.patreon_url,
          facebook_url: nomination.facebook_url,
          accepting_commissions: nomination.accepting_commissions,
          thumbnail_path: thumbnailPath,
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "nomination_id" },
      )
      .select("id")
      .single()
    if (makerError || !maker) {
      throw new Error(makerError?.message ?? "Unable to publish maker.")
    }

    const { data: nominationFandoms, error: fandomError } = await supabase
      .from("maker_nomination_fandoms")
      .select("filter_option_id")
      .eq("nomination_id", id)
    if (fandomError) throw new Error(fandomError.message)

    const { error: clearFandomsError } = await supabase
      .from("maker_fandoms")
      .delete()
      .eq("maker_id", maker.id)
    if (clearFandomsError) throw new Error(clearFandomsError.message)

    if (nominationFandoms?.length) {
      const { error: insertFandomsError } = await supabase
        .from("maker_fandoms")
        .insert(
          nominationFandoms.map((fandom) => ({
            maker_id: maker.id,
            filter_option_id: fandom.filter_option_id,
          })),
        )
      if (insertFandomsError) throw new Error(insertFandomsError.message)
    }
  } else {
    const { error: unpublishError } = await supabase
      .from("makers")
      .update({ published_at: null, updated_at: new Date().toISOString() })
      .eq("nomination_id", id)
    if (unpublishError) throw new Error(unpublishError.message)
  }

  const { error } = await supabase
    .from("maker_nominations")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/admin")
  revalidatePath("/admin/maker-applications")
  revalidatePath(`/admin/maker-applications/${id}`)
  revalidatePath("/makers")
}

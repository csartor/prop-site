"use server"

import { z } from "zod"

import { getPatreonCampaignDebug } from "@/lib/patreon"
import { decryptPatreonCredential } from "@/lib/patreon-credentials"
import { createClient } from "@/lib/supabase/server"

const campaignIdSchema = z
  .string()
  .trim()
  .regex(/^\d+$/, "Enter a numeric Patreon campaign ID.")

export type CampaignDebugResult =
  | Awaited<ReturnType<typeof getPatreonCampaignDebug>>
  | { error: string }

export async function fetchCampaignDebug(
  campaignId: string
): Promise<CampaignDebugResult> {
  const parsed = campaignIdSchema.safeParse(campaignId)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Sign in before debugging a Patreon campaign." }

  const { data: credentials } = await supabase
    .from("patreon_credentials")
    .select("access_token_ciphertext")
    .eq("user_id", user.id)
    .maybeSingle()
  if (!credentials) {
    return {
      error:
        "Reconnect Patreon to grant campaign permissions before using this tool.",
    }
  }

  try {
    return await getPatreonCampaignDebug(
      decryptPatreonCredential(credentials.access_token_ciphertext, user.id),
      parsed.data
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Patreon error"
    return {
      error:
        message.includes("401") || message.includes("403")
          ? "Patreon denied this request. Reconnect Patreon to grant campaigns and campaigns.posts access."
          : message,
    }
  }
}

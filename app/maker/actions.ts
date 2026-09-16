"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"

const quoteSchema = z.object({
  assignment_id: z.string().uuid(),
  price_min: z.coerce.number().min(0),
  price_max: z.coerce.number().min(0),
  turnaround_days: z.coerce.number().int().min(1).max(730),
  scope_included: z.string().trim().min(1).max(5000),
  exclusions: z.string().trim().max(5000),
  assumptions: z.string().trim().max(5000),
  questions: z.string().trim().max(5000),
  shipping_notes: z.string().trim().max(5000),
  rush_fee: z.coerce.number().min(0).optional(),
  quote_action: z.enum(["draft", "submitted", "revert"]),
})

export async function saveQuote(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("You must be signed in.")
  const parsed = quoteSchema.parse(Object.fromEntries(formData.entries()))
  const { data: assignment } = await supabase
    .from("request_assignments")
    .select("id, buyer_request_id, maker_user_id")
    .eq("id", parsed.assignment_id)
    .eq("maker_user_id", user.id)
    .maybeSingle()
  if (!assignment) throw new Error("This assignment is not available to you.")
  const { data: existing } = await supabase
    .from("request_quotes")
    .select("id, status")
    .eq("assignment_id", parsed.assignment_id)
    .maybeSingle()
  if (existing?.status === "submitted" && parsed.quote_action !== "revert") {
    throw new Error("Revert the submitted quote to draft before changing it.")
  }
  if (parsed.quote_action === "revert") {
    if (existing) await supabase.from("request_quotes").update({ status: "draft" }).eq("id", existing.id)
  } else {
    const { error } = await supabase.from("request_quotes").upsert({
      assignment_id: assignment.id,
      buyer_request_id: assignment.buyer_request_id,
      maker_user_id: user.id,
      status: parsed.quote_action,
      price_min_cents: Math.round(parsed.price_min * 100),
      price_max_cents: Math.round(parsed.price_max * 100),
      turnaround_days: parsed.turnaround_days,
      scope_included: parsed.scope_included,
      exclusions: parsed.exclusions,
      assumptions: parsed.assumptions,
      questions: parsed.questions,
      shipping_notes: parsed.shipping_notes,
      rush_fee_cents: parsed.rush_fee ? Math.round(parsed.rush_fee * 100) : null,
    }, { onConflict: "assignment_id" })
    if (error) throw new Error(error.message)
  }
  revalidatePath("/maker/assignments")
  revalidatePath(`/maker/assignments/${assignment.id}/quote`)
  revalidatePath(`/admin/requests/${assignment.buyer_request_id}`)
}

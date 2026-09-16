"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { requireAdmin } from "@/lib/admin"

const requestStatus = z.enum(["new", "in_review", "matched", "closed"])
const applicationStatus = z.enum(["pending", "approved", "rejected", "needs_follow_up"])
const routingStatus = z.enum(["new", "reviewed", "routed", "quoted", "selected", "lost", "completed"])

export async function updateBuyerRequestStatus(formData: FormData) {
  const { supabase } = await requireAdmin()
  const id = z.string().uuid().parse(formData.get("id"))
  const status = requestStatus.parse(formData.get("status"))
  await supabase.from("buyer_requests").update({ status }).eq("id", id)
  revalidatePath(`/admin/requests/${id}`)
  revalidatePath("/admin")
}

export async function updateRoutingStatus(formData: FormData) {
  const { supabase } = await requireAdmin()
  const id = z.string().uuid().parse(formData.get("id"))
  const status = routingStatus.parse(formData.get("routing_status"))
  const lossReason = z.string().trim().max(1000).parse(formData.get("loss_reason") ?? "")
  const { error } = await supabase
    .from("buyer_requests")
    .update({
      routing_status: status,
      loss_reason: status === "lost" ? lossReason || null : null,
      completed_at: status === "completed" ? new Date().toISOString() : null,
    })
    .eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/requests/${id}`)
  revalidatePath("/admin/requests")
}

export async function assignMakers(formData: FormData) {
  const { supabase, user } = await requireAdmin()
  const requestId = z.string().uuid().parse(formData.get("request_id"))
  const makerIds = z.array(z.string().uuid()).min(1).max(10).parse(formData.getAll("maker_user_ids"))
  const quoteDeadline = z.string().date().optional().parse(formData.get("quote_deadline") || undefined)
  const { error: deleteError } = await supabase
    .from("request_assignments")
    .delete()
    .eq("buyer_request_id", requestId)
  if (deleteError) throw new Error(deleteError.message)
  const { error } = await supabase.from("request_assignments").insert(
    makerIds.map((maker_user_id) => ({
      buyer_request_id: requestId,
      maker_user_id,
      assigned_by: user.id,
      quote_deadline: quoteDeadline ?? null,
    })),
  )
  if (error) throw new Error(error.message)
  await supabase.from("buyer_requests").update({ routing_status: "routed" }).eq("id", requestId)
  revalidatePath(`/admin/requests/${requestId}`)
  revalidatePath("/maker/assignments")
}

export async function addRequestNote(formData: FormData) {
  const { supabase, user } = await requireAdmin()
  const requestId = z.string().uuid().parse(formData.get("request_id"))
  const body = z.string().trim().min(1).max(5000).parse(formData.get("body"))
  const { error } = await supabase.from("request_admin_notes").insert({
    buyer_request_id: requestId,
    author_user_id: user.id,
    body,
  })
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/requests/${requestId}`)
}

export async function selectRequestMaker(formData: FormData) {
  const { supabase } = await requireAdmin()
  const requestId = z.string().uuid().parse(formData.get("request_id"))
  const makerId = z.string().uuid().parse(formData.get("maker_user_id"))
  const { error } = await supabase.from("buyer_requests").update({
    selected_maker_user_id: makerId,
    routing_status: "selected",
  }).eq("id", requestId)
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/requests/${requestId}`)
}

export async function updateMakerApplicationStatus(formData: FormData) {
  const { supabase } = await requireAdmin()
  const id = z.string().uuid().parse(formData.get("id"))
  const review_status = applicationStatus.parse(formData.get("review_status"))
  await supabase.from("maker_applications").update({ review_status }).eq("id", id)
  revalidatePath(`/admin/maker-applications/${id}`)
  revalidatePath("/admin")
}

export async function createMakerProfile(formData: FormData) {
  const { supabase } = await requireAdmin()
  const applicationId = z.string().uuid().parse(formData.get("application_id"))
  const { data: application } = await supabase
    .from("maker_applications")
    .select("*")
    .eq("id", applicationId)
    .eq("review_status", "approved")
    .single()
  if (!application) throw new Error("Only approved applications can become profiles.")

  const { data: portfolio } = await supabase
    .from("maker_application_portfolio_items")
    .select("kind, value, caption, sort_order")
    .eq("maker_application_id", applicationId)
    .order("sort_order")
  const username = `${application.maker_name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 40) || "maker"}_${application.user_id.slice(0, 8)}`
  const now = new Date().toISOString()
  const { error } = await supabase.from("profiles").upsert({
    user_id: application.user_id,
    application_id: application.id,
    display_name: application.maker_name,
    username,
    location: application.location,
    specialties: application.service_categories,
    process_tags: application.process_tags,
    portfolio_items: portfolio ?? [],
    budget_min_cents: application.budget_min_cents,
    budget_max_cents: application.budget_max_cents,
    lead_time_days: application.lead_time_days,
    service_regions: application.service_regions,
    availability: "open",
    visibility: "public",
    onboarding_step: 4,
    onboarding_completed_at: now,
    published_at: now,
  })
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/maker-applications/${applicationId}`)
  revalidatePath("/makers")
}

import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { MakerQuoteForm } from "@/components/maker-quote-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

export default async function MakerQuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  const { data: assignment } = await supabase.from("maker_assignment_briefs").select("*").eq("assignment_id", id).maybeSingle()
  if (!assignment) notFound()
  const { data: quote } = await supabase.from("request_quotes").select("*").eq("assignment_id", id).eq("maker_user_id", user.id).maybeSingle()
  const initial = quote ? {
    status: quote.status,
    price_min: quote.price_min_cents == null ? "" : String(quote.price_min_cents / 100),
    price_max: quote.price_max_cents == null ? "" : String(quote.price_max_cents / 100),
    turnaround_days: quote.turnaround_days == null ? "" : String(quote.turnaround_days),
    scope_included: quote.scope_included,
    exclusions: quote.exclusions,
    assumptions: quote.assumptions,
    questions: quote.questions,
    shipping_notes: quote.shipping_notes,
    rush_fee: quote.rush_fee_cents == null ? "" : String(quote.rush_fee_cents / 100),
  } : {}
  return <main className="min-h-svh bg-muted/30 p-6 md:p-10"><section className="mx-auto max-w-3xl space-y-4"><Link className="text-sm underline" href="/maker/assignments">Assigned requests</Link><Card><CardHeader><CardTitle>{assignment.title}</CardTitle></CardHeader><CardContent className="space-y-4 text-sm"><p className="whitespace-pre-wrap">{assignment.description}</p><div className="grid gap-2 rounded-md bg-muted p-4 sm:grid-cols-2"><p><b>Category:</b> {assignment.category}</p><p><b>Finish:</b> {assignment.finish_tier}</p><p><b>Deadline:</b> {assignment.deadline}</p><p><b>Budget:</b> ${assignment.budget_min_cents / 100}–${assignment.budget_max_cents / 100}</p><p><b>Location:</b> {assignment.buyer_location}</p><p><b>Fulfillment:</b> {assignment.fulfillment_method}</p></div></CardContent></Card><Card><CardHeader><CardTitle>{quote?.status === "submitted" ? "Submitted quote" : "Prepare your quote"}</CardTitle></CardHeader><CardContent><MakerQuoteForm assignmentId={id} initial={initial} /></CardContent></Card></section></main>
}

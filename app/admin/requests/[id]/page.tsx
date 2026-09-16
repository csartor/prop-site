import Link from "next/link"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminStatusForm } from "@/components/admin-status-form"
import { RequestNoteForm, RoutingPanels, SelectMakerForm } from "@/components/admin-routing-controls"
import { requireAdmin } from "@/lib/admin"

export default async function AdminRequestDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase } = await requireAdmin()
  const { data: request } = await supabase.from("buyer_requests").select("*").eq("id", id).maybeSingle()
  if (!request) notFound()
  const { data: references } = await supabase.from("buyer_request_references").select("*").eq("buyer_request_id", id).order("sort_order")
  const [{ data: makers }, { data: assignments }, { data: notes }, { data: quotes }] = await Promise.all([
    supabase.from("profiles").select("user_id, display_name, location").eq("visibility", "public").order("display_name"),
    supabase.from("request_assignments").select("id, maker_user_id, invite_status, quote_deadline, created_at").eq("buyer_request_id", id).order("created_at"),
    supabase.from("request_admin_notes").select("id, body, created_at").eq("buyer_request_id", id).order("created_at", { ascending: false }),
    supabase.from("request_quotes").select("id, assignment_id, maker_user_id, status, price_min_cents, price_max_cents, turnaround_days, scope_included, submitted_at").eq("buyer_request_id", id).order("submitted_at"),
  ])
  const referencesWithUrls = await Promise.all((references ?? []).map(async (reference) => {
    if (reference.kind === "url") return { ...reference, href: reference.value }
    const { data } = await supabase.storage.from("buyer-request-references").createSignedUrl(reference.value, 60 * 10)
    return { ...reference, href: data?.signedUrl ?? null }
  }))
  const makerById = new Map((makers ?? []).map((maker) => [maker.user_id, maker]))
  return <main className="min-h-svh bg-muted/30 p-6 md:p-10"><section className="mx-auto max-w-5xl space-y-4"><Link className="text-sm underline" href="/admin/requests">Buyer requests</Link><Card><CardHeader><CardTitle>{request.title}</CardTitle></CardHeader><CardContent className="grid gap-4 text-sm md:grid-cols-2"><p><b>Category:</b> {request.category}</p><p><b>Deadline:</b> {request.deadline}</p><p><b>Budget:</b> ${(request.budget_min_cents / 100).toFixed(0)}–${(request.budget_max_cents / 100).toFixed(0)}</p><p><b>Fulfillment:</b> {request.fulfillment_method}</p><p><b>Contact:</b> {request.contact_name} · {request.contact_email}</p><p><b>Flags:</b> {request.review_flags.join(", ") || "None"}</p><p className="md:col-span-2 whitespace-pre-wrap"><b>Description:</b><br />{request.description}</p><div className="md:col-span-2"><AdminStatusForm id={request.id} kind="request" value={request.status} /></div></CardContent></Card><RoutingPanels assignedMakerIds={(assignments ?? []).map((assignment) => assignment.maker_user_id)} lossReason={request.loss_reason} makers={makers ?? []} requestId={request.id} status={request.routing_status} /><Card><CardHeader><CardTitle>References</CardTitle></CardHeader><CardContent>{referencesWithUrls.map((reference) => reference.href ? <a className="block underline" href={reference.href} key={reference.id} rel="noreferrer" target="_blank">{reference.kind}: {reference.value}</a> : <p key={reference.id}>{reference.value}</p>)}</CardContent></Card><div className="grid gap-4 lg:grid-cols-2"><Card><CardHeader><CardTitle>Private notes</CardTitle></CardHeader><CardContent className="space-y-4"><RequestNoteForm requestId={request.id} />{(notes ?? []).map((note) => <div className="border-t pt-3 text-sm" key={note.id}><p className="whitespace-pre-wrap">{note.body}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(note.created_at).toLocaleString()}</p></div>)}</CardContent></Card><Card><CardHeader><CardTitle>Assignments and quotes</CardTitle></CardHeader><CardContent className="space-y-3">{(assignments ?? []).map((assignment) => { const maker = makerById.get(assignment.maker_user_id); const quote = (quotes ?? []).find((item) => item.assignment_id === assignment.id); return <div className="rounded-md border p-3 text-sm" key={assignment.id}><div className="flex items-start justify-between gap-3"><div><p className="font-medium">{maker?.display_name ?? "Maker"}</p><p className="capitalize text-muted-foreground">{assignment.invite_status} · quote due {assignment.quote_deadline ?? "not set"}</p></div>{request.selected_maker_user_id === assignment.maker_user_id ? <span className="text-green-600">Selected</span> : <SelectMakerForm makerUserId={assignment.maker_user_id} requestId={request.id} />}</div>{quote && <p className="mt-2">Quote: {quote.status}{quote.price_min_cents != null && ` · $${quote.price_min_cents / 100}–$${(quote.price_max_cents ?? quote.price_min_cents) / 100}`} {quote.turnaround_days && ` · ${quote.turnaround_days} days`}</p>}</div> })}{assignments?.length === 0 && <p className="text-sm text-muted-foreground">No makers assigned yet.</p>}</CardContent></Card></div></section></main>
}

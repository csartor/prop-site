import Link from "next/link"
import { notFound } from "next/navigation"
import { AdminStatusForm } from "@/components/admin-status-form"
import { createMakerProfile } from "@/app/admin/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireAdmin } from "@/lib/admin"

export default async function AdminMakerApplicationDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase } = await requireAdmin()
  const { data: application } = await supabase.from("maker_applications").select("*").eq("id", id).maybeSingle()
  if (!application) notFound()
  const { data: portfolio } = await supabase.from("maker_application_portfolio_items").select("*").eq("maker_application_id", id).order("sort_order")
  const { data: profile } = await supabase.from("profiles").select("username").eq("application_id", id).maybeSingle()
  const portfolioWithUrls = await Promise.all((portfolio ?? []).map(async (item) => {
    if (item.kind === "url") return { ...item, href: item.value }
    const { data } = await supabase.storage.from("maker-application-portfolio").createSignedUrl(item.value, 60 * 10)
    return { ...item, href: data?.signedUrl ?? null }
  }))
  return <main className="min-h-svh bg-muted/30 p-6 md:p-10"><section className="mx-auto max-w-4xl space-y-4"><Link className="text-sm underline" href="/admin/maker-applications">Maker applications</Link><Card><CardHeader><CardTitle>{application.maker_name}</CardTitle></CardHeader><CardContent className="grid gap-4 text-sm md:grid-cols-2"><p><b>Location:</b> {application.location}</p><p><b>Email:</b> {application.contact_email}</p><p><b>Services:</b> {application.service_categories.join(", ")}</p><p><b>Processes:</b> {application.process_tags.join(", ") || "Not provided"}</p><p><b>Lead time:</b> {application.lead_time_days} days</p><p><b>Budget:</b> ${(application.budget_min_cents / 100).toFixed(0)}–${(application.budget_max_cents / 100).toFixed(0)}</p><p><b>Regions:</b> {application.service_regions.join(", ")}</p><p className="md:col-span-2"><b>Declined work:</b> {application.declined_jobs || "None provided"}</p><div className="md:col-span-2"><AdminStatusForm id={application.id} kind="application" value={application.review_status} />{profile ? <Link className="mt-3 inline-block underline" href={`/makers/${profile.username}`}>View public profile</Link> : application.review_status === "approved" ? <form action={createMakerProfile} className="mt-3"><input type="hidden" name="application_id" value={application.id} /><Button type="submit">Create public maker profile</Button></form> : null}</div></CardContent></Card><Card><CardHeader><CardTitle>Private portfolio</CardTitle></CardHeader><CardContent className="space-y-2">{portfolioWithUrls.map((item) => item.href ? <a className="block underline" href={item.href} key={item.id} rel="noreferrer" target="_blank">{item.caption || item.value}</a> : <p key={item.id}>{item.value}</p>)}</CardContent></Card></section></main>
}

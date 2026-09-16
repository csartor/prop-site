import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireAdmin } from "@/lib/admin"

export default async function AdminDashboard() {
  const { supabase } = await requireAdmin()
  const [{ count: requestCount }, { count: applicationCount }, { data: requests }, { data: applications }] =
    await Promise.all([
      supabase.from("buyer_requests").select("*", { count: "exact", head: true }),
      supabase.from("maker_applications").select("*", { count: "exact", head: true }),
      supabase.from("buyer_requests").select("id, title, category, status, review_flags, created_at").order("created_at", { ascending: false }).limit(5),
      supabase.from("maker_applications").select("id, maker_name, location, review_status, created_at").order("created_at", { ascending: false }).limit(5),
    ])

  return <main className="min-h-svh bg-muted/30 p-6 md:p-10"><div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[220px_1fr]"><aside className="rounded-lg border bg-card p-4"><p className="font-heading text-lg font-bold">MakersForge</p><nav className="mt-6 grid gap-1 text-sm"><Link className="rounded-md bg-muted px-3 py-2" href="/admin">Overview</Link><Link className="rounded-md px-3 py-2 hover:bg-muted" href="/admin/requests">Buyer requests</Link><Link className="rounded-md px-3 py-2 hover:bg-muted" href="/admin/maker-applications">Maker applications</Link></nav></aside><section className="space-y-6"><header><p className="text-sm text-muted-foreground">Commission operations</p><h1 className="font-heading text-3xl font-bold">Admin dashboard</h1></header><div className="grid gap-4 sm:grid-cols-2"><Card><CardHeader><CardTitle>Buyer requests</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{requestCount ?? 0}</CardContent></Card><Card><CardHeader><CardTitle>Maker applications</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{applicationCount ?? 0}</CardContent></Card></div><div className="grid gap-6 xl:grid-cols-2"><Card><CardHeader><CardTitle>Recent buyer requests</CardTitle></CardHeader><CardContent className="space-y-3">{(requests ?? []).map((request) => <Link className="block rounded-md border p-3 hover:bg-muted" href={`/admin/requests/${request.id}`} key={request.id}><p className="font-medium">{request.title}</p><p className="text-sm text-muted-foreground">{request.category} · {request.status}</p>{request.review_flags.map((flag: string) => <Badge className="mr-1 mt-2" key={flag} variant="secondary">{flag}</Badge>)}</Link>)}{requests?.length === 0 ? <p className="text-muted-foreground">No requests yet.</p> : null}</CardContent></Card><Card><CardHeader><CardTitle>Recent maker applications</CardTitle></CardHeader><CardContent className="space-y-3">{(applications ?? []).map((application) => <Link className="block rounded-md border p-3 hover:bg-muted" href={`/admin/maker-applications/${application.id}`} key={application.id}><p className="font-medium">{application.maker_name}</p><p className="text-sm text-muted-foreground">{application.location} · {application.review_status.replaceAll("_", " ")}</p></Link>)}{applications?.length === 0 ? <p className="text-muted-foreground">No applications yet.</p> : null}</CardContent></Card></div></section></div></main>
}

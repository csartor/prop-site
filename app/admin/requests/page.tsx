import Link from "next/link"
import { AdminRequestFilters } from "@/components/admin-request-filters"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireAdmin } from "@/lib/admin"

type RequestStatus = "new" | "reviewed" | "routed" | "quoted" | "selected" | "lost" | "completed"

export default async function AdminRequestsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const filters = await searchParams
  const { supabase } = await requireAdmin()
  let query = supabase.from("buyer_requests").select("id, title, category, routing_status, buyer_location, deadline, budget_min_cents, budget_max_cents, review_flags, created_at").order("created_at", { ascending: false })
  const value = (key: string) => typeof filters[key] === "string" ? filters[key] as string : ""
  if (value("category")) query = query.eq("category", value("category"))
  if (value("location")) query = query.ilike("buyer_location", `%${value("location")}%`)
  if (value("status")) query = query.eq("routing_status", value("status"))
  if (value("min_budget")) query = query.gte("budget_max_cents", Number(value("min_budget")) * 100)
  if (value("max_budget")) query = query.lte("budget_min_cents", Number(value("max_budget")) * 100)
  if (value("deadline")) query = query.lte("deadline", value("deadline"))
  const { data: requests } = await query
  return <main className="min-h-svh bg-muted/30 p-6 md:p-10"><section className="mx-auto max-w-5xl"><Link className="text-sm underline" href="/admin">Admin dashboard</Link><Card className="mt-4"><CardHeader><CardTitle>Buyer requests</CardTitle></CardHeader><CardContent><AdminRequestFilters defaultValues={{ category: value("category"), location: value("location"), status: (value("status") || "all") as "all" | RequestStatus, min_budget: value("min_budget"), max_budget: value("max_budget"), deadline: value("deadline") }} /><div className="space-y-3">{(requests ?? []).map((request) => <Link className="block rounded-md border p-4 hover:bg-muted" href={`/admin/requests/${request.id}`} key={request.id}><p className="font-medium">{request.title}</p><p className="text-sm text-muted-foreground">{request.category} · {request.buyer_location} · Due {request.deadline} · ${request.budget_min_cents / 100}–${request.budget_max_cents / 100}</p><p className="mt-1 text-sm capitalize">Lifecycle: {request.routing_status}</p></Link>)}{requests?.length === 0 && <p className="text-sm text-muted-foreground">No requests match these filters.</p>}</div></CardContent></Card></section></main>
}

import Link from "next/link"
import { redirect } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

export default async function MakerAssignmentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  const { data: account } = await supabase.from("account_roles").select("role").eq("user_id", user.id).maybeSingle()
  if (account?.role !== "maker") redirect("/")
  const { data: assignments } = await supabase.from("maker_assignment_briefs").select("*").order("assigned_at", { ascending: false })
  const { data: quotes } = await supabase.from("request_quotes").select("assignment_id, status").eq("maker_user_id", user.id)
  const quoteByAssignment = new Map((quotes ?? []).map((quote) => [quote.assignment_id, quote.status]))
  return <main className="min-h-svh bg-muted/30 p-6 md:p-10"><section className="mx-auto max-w-4xl space-y-4"><Link className="text-sm underline" href="/maker/profile">Maker profile</Link><Card><CardHeader><CardTitle>Assigned requests</CardTitle></CardHeader><CardContent className="space-y-3">{(assignments ?? []).map((assignment) => <Link className="block rounded-md border p-4 hover:bg-muted" href={`/maker/assignments/${assignment.assignment_id}/quote`} key={assignment.assignment_id}><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-medium">{assignment.title}</p><Badge variant={quoteByAssignment.get(assignment.assignment_id) === "submitted" ? "default" : "secondary"}>{quoteByAssignment.get(assignment.assignment_id) ?? "No quote"}</Badge></div><p className="text-sm text-muted-foreground">{assignment.category} · {assignment.buyer_location} · Due {assignment.deadline}</p><p className="mt-1 text-sm capitalize">Invitation: {assignment.invite_status.replaceAll("_", " ")}{assignment.quote_deadline && ` · Quote by ${assignment.quote_deadline}`}</p></Link>)}{assignments?.length === 0 && <p className="text-sm text-muted-foreground">No requests have been assigned to you.</p>}</CardContent></Card></section></main>
}

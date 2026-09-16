import { notFound, redirect } from "next/navigation"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

export default async function RequestStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  const { data: request } = await supabase.from("buyer_requests").select("title, status, created_at").eq("id", id).maybeSingle()
  if (!request) notFound()

  return <main className="min-h-svh bg-muted/30 px-6 py-10"><Card className="mx-auto max-w-xl"><CardHeader><CardTitle>Request submitted</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-lg font-medium">{request.title}</p><p className="text-muted-foreground">Status: {request.status.replaceAll("_", " ")}</p><p className="text-sm text-muted-foreground">We&apos;ll review your request and contact you using your selected contact method.</p></CardContent></Card></main>
}

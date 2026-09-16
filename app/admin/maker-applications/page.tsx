import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireAdmin } from "@/lib/admin"

export default async function AdminMakerApplicationsPage() {
  const { supabase } = await requireAdmin()
  const { data: applications } = await supabase.from("maker_applications").select("id, maker_name, location, service_categories, review_status, created_at").order("created_at", { ascending: false })
  return <main className="min-h-svh bg-muted/30 p-6 md:p-10"><section className="mx-auto max-w-5xl"><Link className="text-sm underline" href="/admin">Admin dashboard</Link><Card className="mt-4"><CardHeader><CardTitle>Maker applications</CardTitle></CardHeader><CardContent className="space-y-3">{(applications ?? []).map((application) => <Link className="block rounded-md border p-4 hover:bg-muted" href={`/admin/maker-applications/${application.id}`} key={application.id}><p className="font-medium">{application.maker_name}</p><p className="text-sm text-muted-foreground">{application.location} · {application.service_categories.join(", ")}</p><p className="mt-1 text-sm">Review: {application.review_status.replaceAll("_", " ")}</p></Link>)}</CardContent></Card></section></main>
}

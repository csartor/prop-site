import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireAdmin } from "@/lib/admin"

export default async function AdminDashboard() {
  const { supabase } = await requireAdmin()
  const [{ count: usersCount }, { count: submittedCount }, { data: recentNominations }] =
    await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase
        .from("maker_nominations")
        .select("*", { count: "exact", head: true })
        .eq("status", "submitted"),
      supabase
        .from("maker_nominations")
        .select("id, maker_name, location, status, created_at")
        .neq("status", "draft")
        .order("created_at", { ascending: false })
        .limit(5),
    ])

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <header>
        <p className="text-sm text-muted-foreground">MakersForge operations</p>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-semibold tracking-tight">
            Admin dashboard
          </h1>
          <Button nativeButton={false} render={<Link href="/admin/makers/new" />}>
            Add maker
          </Button>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Maker profiles</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{usersCount ?? 0}</p>
            <Button className="mt-4" nativeButton={false} render={<Link href="/admin/users" />} size="sm" variant="outline">
              View users
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">
              Awaiting review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{submittedCount ?? 0}</p>
            <Button className="mt-4" nativeButton={false} render={<Link href="/admin/maker-applications" />} size="sm" variant="outline">
              Review applications
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Recent maker applications</CardTitle>
          <Button nativeButton={false} render={<Link href="/admin/maker-applications" />} size="sm" variant="ghost">
            View all
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentNominations?.length ? (
            recentNominations.map((nomination) => (
              <Link
                className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                href={`/admin/maker-applications/${nomination.id}`}
                key={nomination.id}
              >
                <div>
                  <p className="font-medium">{nomination.maker_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {nomination.location}
                  </p>
                </div>
                <Badge variant="secondary">{nomination.status}</Badge>
              </Link>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No maker applications have been submitted yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { requireAdmin } from "@/lib/admin"

function formatDate(value: string | null) {
  if (!value) return "—"
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value))
}

export default async function AdminUsersPage() {
  const { supabase } = await requireAdmin()
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select(
      "user_id, display_name, username, location, visibility, onboarding_completed_at, published_at, created_at",
    )
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <header>
        <p className="text-sm text-muted-foreground">Directory accounts</p>
        <h1 className="text-3xl font-semibold tracking-tight">Users</h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Maker profiles</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Onboarding</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead>Published</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles?.map((profile) => (
                <TableRow key={profile.user_id}>
                  <TableCell className="font-medium">
                    {profile.display_name ?? "Unnamed maker"}
                  </TableCell>
                  <TableCell>
                    {profile.username && profile.published_at ? (
                      <Link
                        className="underline underline-offset-4"
                        href={`/makers/${profile.username}`}
                      >
                        @{profile.username}
                      </Link>
                    ) : (
                      profile.username ? `@${profile.username}` : "—"
                    )}
                  </TableCell>
                  <TableCell>{profile.location ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={profile.onboarding_completed_at ? "secondary" : "outline"}>
                      {profile.onboarding_completed_at ? "Complete" : "In progress"}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize">{profile.visibility}</TableCell>
                  <TableCell>{formatDate(profile.published_at)}</TableCell>
                </TableRow>
              ))}
              {profiles?.length === 0 ? (
                <TableRow>
                  <TableCell className="h-24 text-center text-muted-foreground" colSpan={6}>
                    No maker profiles yet.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

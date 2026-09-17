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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value))
}

export default async function AdminMakerApplicationsPage() {
  const { supabase } = await requireAdmin()
  const { data: nominations, error } = await supabase
    .from("maker_nominations")
    .select("id, maker_name, location, relationship, status, created_at")
    .neq("status", "draft")
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <header>
        <p className="text-sm text-muted-foreground">Directory submissions</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Maker applications
        </h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Submitted nominations</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Maker</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Submitter</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {nominations?.map((nomination) => (
                <TableRow key={nomination.id}>
                  <TableCell className="font-medium">
                    <Link
                      className="underline underline-offset-4"
                      href={`/admin/maker-applications/${nomination.id}`}
                    >
                      {nomination.maker_name}
                    </Link>
                  </TableCell>
                  <TableCell>{nomination.location}</TableCell>
                  <TableCell className="capitalize">
                    {nomination.relationship === "self"
                      ? "Self nomination"
                      : "Recommendation"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={nomination.status === "submitted" ? "default" : "secondary"}>
                      {nomination.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(nomination.created_at)}</TableCell>
                </TableRow>
              ))}
              {nominations?.length === 0 ? (
                <TableRow>
                  <TableCell className="h-24 text-center text-muted-foreground" colSpan={5}>
                    No submitted nominations yet.
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

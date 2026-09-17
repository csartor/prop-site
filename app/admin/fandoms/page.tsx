import { AdminFandomForm } from "@/components/admin-fandom-form"
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

export default async function AdminFandomsPage() {
  const { supabase } = await requireAdmin()
  const { data: fandoms, error } = await supabase
    .from("maker_filter_options")
    .select("id, label, slug, sort_order, enabled")
    .eq("category", "fandom")
    .order("sort_order", { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <header>
        <p className="text-sm text-muted-foreground">Directory catalog</p>
        <h1 className="text-3xl font-semibold tracking-tight">Fandoms</h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Add a fandom</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminFandomForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current fandoms</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fandoms?.map((fandom) => (
                <TableRow key={fandom.id}>
                  <TableCell className="font-medium">{fandom.label}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {fandom.slug}
                  </TableCell>
                  <TableCell>
                    <Badge variant={fandom.enabled ? "secondary" : "outline"}>
                      {fandom.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {fandoms?.length === 0 ? (
                <TableRow>
                  <TableCell
                    className="h-24 text-center text-muted-foreground"
                    colSpan={3}
                  >
                    No fandoms have been added yet.
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

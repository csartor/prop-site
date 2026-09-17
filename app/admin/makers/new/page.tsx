import { AdminMakerForm } from "@/components/admin-maker-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireAdmin } from "@/lib/admin"

export default async function NewAdminMakerPage() {
  const { supabase } = await requireAdmin()
  const [{ data: fandoms, error: fandomError }, { data: makerTypes, error: makerTypeError }] =
    await Promise.all([
      supabase
        .from("maker_filter_options")
        .select("id, label")
        .eq("category", "fandom")
        .eq("enabled", true)
        .order("sort_order"),
      supabase
        .from("maker_filter_options")
        .select("id, label")
        .eq("category", "maker_type")
        .eq("enabled", true)
        .order("sort_order"),
    ])

  if (fandomError || makerTypeError) {
    throw new Error(fandomError?.message ?? makerTypeError?.message)
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <header>
        <p className="text-sm text-muted-foreground">Directory management</p>
        <h1 className="text-3xl font-semibold tracking-tight">Add maker</h1>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Publish a directory maker</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminMakerForm
            fandomOptions={fandoms ?? []}
            makerTypeOptions={makerTypes ?? []}
          />
        </CardContent>
      </Card>
    </div>
  )
}

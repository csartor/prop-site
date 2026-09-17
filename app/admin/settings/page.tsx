import { AdminTrackingSettingsForm } from "@/components/admin-tracking-settings-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireAdmin } from "@/lib/admin"
import { normalizeDirectoryUtm } from "@/lib/tracking"

export default async function AdminSettingsPage() {
  const { supabase } = await requireAdmin()
  const { data, error } = await supabase
    .from("site_settings")
    .select("utm_source, utm_medium, utm_campaign")
    .eq("singleton", true)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <header>
        <p className="text-sm text-muted-foreground">Directory analytics</p>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Directory outbound tags</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-6 text-sm text-muted-foreground">
            These values are added to every Website, Instagram, Patreon, and
            Facebook link on the public maker directory. Destination is still
            tagged automatically as the content value.
          </p>
          <AdminTrackingSettingsForm defaultValues={normalizeDirectoryUtm(data)} />
        </CardContent>
      </Card>
    </div>
  )
}

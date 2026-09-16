import { redirect } from "next/navigation"

import { PatreonCampaignDebugger } from "@/components/patreon-campaign-debugger"
import { createClient } from "@/lib/supabase/server"

export default async function PatreonDebugPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  return (
    <main className="min-h-svh bg-muted/30 px-6 py-10">
      <section className="mx-auto max-w-4xl">
        <p className="text-sm text-muted-foreground">Developer tools</p>
        <h1 className="mt-2 font-heading text-3xl font-bold">
          Patreon campaign debugger
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Look up a campaign and its ten most recent posts using your connected
          Patreon account.
        </p>
        <div className="mt-8">
          <PatreonCampaignDebugger />
        </div>
      </section>
    </main>
  )
}

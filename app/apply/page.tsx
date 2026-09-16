import Link from "next/link"
import { redirect } from "next/navigation"

import { MakerApplicationForm } from "@/components/maker-application-form"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"

export default async function ApplyPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: account } = await supabase
    .from("account_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle()
  if (!account) redirect("/choose-role")
  if (account.role !== "maker") redirect("/")

  const { data: application } = await supabase
    .from("maker_applications")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle()

  if (application) {
    return (
      <main className="min-h-svh bg-muted/30 px-6 py-10 md:px-10">
        <div className="mx-auto max-w-3xl space-y-4">
          <h1 className="text-3xl font-semibold tracking-tight">
            Application already submitted
          </h1>
          <p className="text-muted-foreground">
            You can check the review status of your maker application.
          </p>
          <Button render={<Link href="/apply/status" />}>View application status</Button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-svh bg-muted/30 px-6 py-10 md:px-10">
      <div className="mx-auto max-w-3xl">
        <MakerApplicationForm userId={user.id} email={user.email ?? ""} />
      </div>
    </main>
  )
}

import Link from "next/link"
import { redirect } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

function formatStatus(status: string) {
  return status.replaceAll("_", " ")
}

export default async function ApplicationStatusPage() {
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
    .select("review_status")
    .eq("user_id", user.id)
    .maybeSingle()

  return (
    <main className="min-h-svh bg-muted/30 px-6 py-10 md:px-10">
      <div className="mx-auto max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle>Maker application status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {application ? (
              <p className="text-lg capitalize">{formatStatus(application.review_status)}</p>
            ) : (
              <>
                <p className="text-muted-foreground">
                  You haven&apos;t submitted a maker application yet.
                </p>
                <Button render={<Link href="/apply" />}>Start application</Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

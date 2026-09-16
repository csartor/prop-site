import { redirect } from "next/navigation"

import { BuyerRequestForm } from "@/components/buyer-request-form"
import { createClient } from "@/lib/supabase/server"

export default async function RequestPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: account } = await supabase
    .from("account_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle()
  if (!account) redirect("/choose-role")
  if (account.role !== "buyer") redirect("/")

  return <main className="min-h-svh bg-muted/30 px-6 py-10"><BuyerRequestForm userId={user.id} email={user.email ?? ""} /></main>
}

import { redirect } from "next/navigation"

import { OnboardingFlow } from "@/components/onboarding-flow"
import { createClient } from "@/lib/supabase/server"

export default async function MakerProfileManagementPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  const { data: account } = await supabase.from("account_roles").select("role").eq("user_id", user.id).maybeSingle()
  if (account?.role !== "maker") redirect("/")
  const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle()
  if (!profile) redirect("/apply/status")
  return <OnboardingFlow user={user} profile={profile} />
}

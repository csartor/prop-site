import { redirect } from "next/navigation"

import { OnboardingFlow } from "@/components/onboarding-flow"
import { createClient } from "@/lib/supabase/server"

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle()

  if (profile?.onboarding_completed_at) {
    redirect(`/makers/${profile.username}`)
  }

  return <OnboardingFlow user={user} profile={profile} />
}

import { LoginForm } from "@/components/login-form"

const errorMessages: Record<string, string> = {
  oauth_callback_missing_code: "Patreon did not return a login code.",
  oauth_provider_failed:
    "Patreon login reached Supabase, but Supabase could not read the Patreon profile.",
  oauth_exchange_failed: "We could not complete the Patreon login.",
  patreon_token_missing:
    "Patreon did not provide the permissions needed to load memberships.",
  patreon_memberships_failed:
    "We signed you in, but could not load your Patreon memberships.",
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm error={error ? errorMessages[error] : undefined} />
      </div>
    </div>
  )
}

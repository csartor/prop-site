import { NextResponse } from "next/server"

import { getPatreonMemberships } from "@/lib/patreon"
import { encryptPatreonCredential } from "@/lib/patreon-credentials"
import { createClient } from "@/lib/supabase/server"

function redirectTo(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url))
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const oauthError = url.searchParams.get("error")
  const oauthErrorDescription = url.searchParams.get("error_description")
  const requestedNext = url.searchParams.get("next")
  const nextPath =
    requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : "/onboarding"

  if (!code) {
    const error =
      oauthError || oauthErrorDescription
        ? "oauth_provider_failed"
        : "oauth_callback_missing_code"
    return redirectTo(request, `/login?error=${error}`)
  }

  const supabase = await createClient()
  const { data, error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError || !data.session?.user) {
    return redirectTo(request, "/login?error=oauth_exchange_failed")
  }

  if (!data.session.provider_token) {
    return redirectTo(request, nextPath)
  }

  try {
    const memberships = await getPatreonMemberships(data.session.provider_token)
    const userId = data.session.user.id
    const { error: credentialError } = await supabase
      .from("patreon_credentials")
      .upsert({
        user_id: userId,
        access_token_ciphertext: encryptPatreonCredential(
          data.session.provider_token,
          userId
        ),
        refresh_token_ciphertext: data.session.provider_refresh_token
          ? encryptPatreonCredential(data.session.provider_refresh_token, userId)
          : null,
        updated_at: new Date().toISOString(),
      })

    if (credentialError) {
      throw credentialError
    }

    const { error: deleteError } = await supabase
      .from("patreon_memberships")
      .delete()
      .eq("user_id", userId)

    if (deleteError) {
      throw deleteError
    }

    if (memberships.length > 0) {
      const { error: insertError } = await supabase
        .from("patreon_memberships")
        .insert(memberships.map((membership) => ({ ...membership, user_id: userId })))

      if (insertError) {
        throw insertError
      }
    }
  } catch {
    return redirectTo(request, "/login?error=patreon_memberships_failed")
  }

  return redirectTo(request, nextPath)
}

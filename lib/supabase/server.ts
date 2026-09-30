import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { User } from "@supabase/supabase-js"

const authTimeoutMs = 3000

function withAuthTimeout<T>(promise: Promise<T>) {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Supabase auth timed out.")), authTimeoutMs)
    }),
  ])
}

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Cookie writes can fail in Server Components. The proxy refreshes
            // sessions and is responsible for writing refreshed cookies.
          }
        },
      },
    }
  )
}

export async function getOptionalUser(): Promise<User | null> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await withAuthTimeout(supabase.auth.getUser())
    return user
  } catch {
    return null
  }
}

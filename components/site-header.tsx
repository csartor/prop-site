import Link from "next/link"
import type { User } from "@supabase/supabase-js"

import { AccountMenu } from "@/components/account-menu"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "cn"

export function SiteHeader({ user }: { user: User | null }) {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-6 md:px-10">
        <Link
          href="/"
          className="font-heading text-base font-semibold tracking-tight"
        >
          MakersForge
        </Link>
        <nav className="flex items-center gap-2" aria-label="Account">
          {user ? (
            <>
              <Link
                href="/makers"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" })
                )}
              >
                Makers
              </Link>
              <Link
                href="/"
                className={cn(
                  buttonVariants({ variant: "secondary", size: "sm" })
                )}
              >
                Dashboard
              </Link>
              <Link
                href="/debug/patreon"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" })
                )}
              >
                Patreon Debug
              </Link>
              <Link
                href="/onboarding"
                className={cn(
                  buttonVariants({ variant: "default", size: "sm" })
                )}
              >
                New Build
              </Link>
              <AccountMenu user={user} />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" })
                )}
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className={cn(
                  buttonVariants({ variant: "default", size: "sm" })
                )}
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}

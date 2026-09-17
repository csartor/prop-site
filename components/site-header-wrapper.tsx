"use client"

import type { User } from "@supabase/supabase-js"
import { usePathname } from "next/navigation"

import { SiteHeader } from "@/components/site-header"

export function SiteHeaderWrapper({ user }: { user: User | null }) {
  const pathname = usePathname()

  if (pathname.startsWith("/admin")) {
    return null
  }

  return <SiteHeader user={user} />
}

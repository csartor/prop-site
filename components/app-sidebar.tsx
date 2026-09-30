"use client"

import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { BuildingsIcon, FlagIcon, GearSixIcon, SquaresFourIcon, UsersThreeIcon } from "@phosphor-icons/react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type * as React from "react"

const navigation = [
  { title: "Overview", href: "/admin", icon: SquaresFourIcon },
  { title: "Users", href: "/admin/users", icon: UsersThreeIcon },
  { title: "Maker applications", href: "/admin/maker-applications", icon: BuildingsIcon },
  { title: "Fandoms", href: "/admin/fandoms", icon: FlagIcon },
  { title: "Settings", href: "/admin/settings", icon: GearSixIcon },
]

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: { name: string; email: string; avatar?: string }
}) {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<Link href="/" />}
            >
              <Image
                alt="fab.zone"
                className="h-6 w-auto invert hue-rotate-180 dark:invert-0 dark:hue-rotate-0"
                height={37}
                src="/assets/logo.svg"
                width={213}
              />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="px-2">
          {navigation.map(({ href, icon: Icon, title }) => (
            <SidebarMenuItem key={href}>
              <SidebarMenuButton
                isActive={pathname === href}
                tooltip={title}
                render={<Link href={href} />}
              >
                <Icon />
                <span>{title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}

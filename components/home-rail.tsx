"use client"

import {
  BellIcon,
  BriefcaseIcon,
  CubeIcon,
  HouseIcon,
  PlusIcon,
  UserIcon,
} from "@phosphor-icons/react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"

const links = [
  { title: "Projects", icon: CubeIcon },
  { title: "Work", icon: BriefcaseIcon },
  { title: "Notifications", icon: BellIcon },
]

const railButtonClass =
  "size-10! justify-center hover:cursor-pointer hover:bg-muted! active:bg-muted! data-active:bg-muted! data-open:hover:bg-muted! group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:[&>span]:sr-only [&_svg]:size-6! [&_svg]:text-primary-foreground"

export function HomeRail({
  onCreate,
  createHref,
  avatarUrl,
  avatarFallback,
  profileHref,
}: {
  onCreate?: () => void
  createHref?: string
  avatarUrl?: string | null
  avatarFallback: string
  profileHref: string
}) {
  const pathname = usePathname()
  return (
    <TooltipProvider>
      <Sidebar
        className="[&_[data-slot=sidebar-inner]]:bg-background"
        collapsible="icon"
      >
        <SidebarHeader className="items-center pt-4">
          <Link aria-label="Home" className="hover:cursor-pointer" href="/">
            <Image
              alt=""
              height={35}
              src="/home/rail-mark.svg"
              width={33}
            />
          </Link>
        </SidebarHeader>
        <SidebarContent className="items-center justify-center">
          <SidebarMenu className="w-auto items-center gap-8">
            <SidebarMenuItem>
              <SidebarMenuButton
                className={railButtonClass}
                isActive
                tooltip="Home"
                render={<Link href="/" />}
              >
                <HouseIcon />
                <span>Home</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {links.map(({ title, icon: Icon }) => (
              <SidebarMenuItem key={title}>
                <SidebarMenuButton className={railButtonClass} tooltip={title} type="button">
                  <Icon />
                  <span>{title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
            <SidebarMenuItem>
              <SidebarMenuButton
                className={railButtonClass}
                isActive={pathname === "/profile"}
                render={<Link href={profileHref} />}
                tooltip="Profile"
              >
                <UserIcon />
                <span>Profile</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              {createHref ? (
                <SidebarMenuButton
                  className={railButtonClass}
                  render={<Link href={createHref} />}
                  tooltip="Create post"
                >
                  <PlusIcon />
                  <span>Create post</span>
                </SidebarMenuButton>
              ) : (
                <SidebarMenuButton
                  className={railButtonClass}
                  onClick={onCreate}
                  tooltip="Create post"
                  type="button"
                >
                  <PlusIcon />
                  <span>Create post</span>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="items-center pb-4">
          <Avatar>
            {avatarUrl ? <AvatarImage alt="" src={avatarUrl} /> : null}
            <AvatarFallback>{avatarFallback}</AvatarFallback>
          </Avatar>
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  )
}

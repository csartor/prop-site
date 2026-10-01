"use client"

import { type CSSProperties, type ReactNode } from "react"

import { ComposerProvider, useComposer } from "@/components/composer"
import { CreatePostDialog } from "@/components/create-post-dialog"
import { HomeRail } from "@/components/home-rail"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import type { HomeViewer } from "@/lib/posts"
import type { ProjectOption } from "@/lib/projects"

export function AppFrame({
  viewer,
  projects,
  children,
}: {
  viewer: HomeViewer
  projects: ProjectOption[]
  children: ReactNode
}) {
  return (
    <ComposerProvider>
      <AppFrameLayout projects={projects} viewer={viewer}>
        {children}
      </AppFrameLayout>
    </ComposerProvider>
  )
}

function AppFrameLayout({
  viewer,
  projects,
  children,
}: {
  viewer: HomeViewer
  projects: ProjectOption[]
  children: ReactNode
}) {
  const composer = useComposer()
  const profileHref = viewer.canPost || viewer.reason === "onboarding" ? "/profile" : "/login"

  return (
    <SidebarProvider
      className="min-h-svh bg-background"
      open={false}
      style={{ "--sidebar-width-icon": "4.5rem" } as CSSProperties}
    >
      <HomeRail
        avatarFallback={viewer.canPost ? viewer.displayName.slice(0, 1) : "?"}
        avatarUrl={viewer.canPost ? viewer.avatarUrl : null}
        createHref={
          viewer.canPost ? undefined : viewer.reason === "anonymous" ? "/login" : "/onboarding"
        }
        onCreate={viewer.canPost ? () => composer?.openComposer() : undefined}
        profileHref={profileHref}
      />
      <SidebarInset className="bg-background">
        <div className="flex items-center px-6 pt-3 md:hidden">
          <SidebarTrigger />
        </div>
        {children}
      </SidebarInset>
      {viewer.canPost && composer ? (
        <CreatePostDialog
          author={{
            displayName: viewer.displayName,
            username: viewer.username,
            avatarUrl: viewer.avatarUrl,
          }}
          intent={composer.intent}
          onOpenChange={composer.setOpen}
          open={composer.open}
          projects={projects}
        />
      ) : null}
    </SidebarProvider>
  )
}

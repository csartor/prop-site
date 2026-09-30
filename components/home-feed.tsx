"use client"

import { useState, type CSSProperties } from "react"

import { CreatePostDialog } from "@/components/create-post-dialog"
import { GalleryCard, type GalleryPost } from "@/components/gallery-card"
import { HomeRail } from "@/components/home-rail"
import { PostPreviewSheet } from "@/components/post-preview-sheet"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { HomeViewer } from "@/lib/posts"
import type { ProjectOption } from "@/lib/projects"

const filters = ["Popular", "Recent", "Debut", "Following"] as const

export function HomeFeed({
  posts,
  viewer,
  projects,
  loadError,
}: {
  posts: GalleryPost[]
  viewer: HomeViewer
  projects: ProjectOption[]
  loadError?: string
}) {
  const [filter, setFilter] = useState<string[]>(["Popular"])
  const [createOpen, setCreateOpen] = useState(false)
  const [preview, setPreview] = useState<GalleryPost | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

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
        onCreate={viewer.canPost ? () => setCreateOpen(true) : undefined}
        profileHref={viewer.canPost || viewer.reason === "onboarding" ? "/profile" : "/login"}
      />
      <SidebarInset className="bg-background">
        <div className="flex items-center px-6 pt-3 md:hidden">
          <SidebarTrigger />
        </div>
        <div className="flex h-14 items-center justify-center">
          <ToggleGroup
            onValueChange={(value) => {
              if (value.length) setFilter(value)
            }}
            spacing={4}
            value={filter}
          >
            {filters.map((item) => (
              <ToggleGroupItem
                className="h-[30px] rounded-full px-3 text-xs font-semibold text-muted-foreground data-[state=on]:border data-[state=on]:border-border data-[state=on]:bg-secondary data-[state=on]:text-foreground"
                key={item}
                value={item}
              >
                {item}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        {loadError ? (
          <p className="px-6 pb-10 text-center text-sm text-muted-foreground">{loadError}</p>
        ) : posts.length === 0 ? (
          <p className="px-6 pb-10 text-center text-sm text-muted-foreground">No posts yet.</p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] items-start gap-x-6 gap-y-6 px-6 pb-10">
            {posts.map((post) => (
              <GalleryCard
                key={post.id}
                onOpen={(selected) => {
                  setPreview(selected)
                  setPreviewOpen(true)
                }}
                post={post}
              />
            ))}
          </div>
        )}
      </SidebarInset>
      {viewer.canPost ? (
        <CreatePostDialog
          author={{
            displayName: viewer.displayName,
            username: viewer.username,
            avatarUrl: viewer.avatarUrl,
          }}
          onOpenChange={setCreateOpen}
          open={createOpen}
          projects={projects}
        />
      ) : null}
      <PostPreviewSheet
        onOpenChange={setPreviewOpen}
        open={previewOpen}
        post={preview}
      />
    </SidebarProvider>
  )
}

"use client"

import { PlusIcon } from "@phosphor-icons/react"
import Link from "next/link"
import { useState } from "react"

import { CreateProjectDialog } from "@/components/create-project-dialog"
import { ProjectShelf } from "@/components/project-shelf"
import { ProjectsExploreFilters } from "@/components/projects-explore-filters"
import { ProjectsExploreHeader } from "@/components/projects-explore-header"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import type { HomeViewer } from "@/lib/posts"
import type { ExploreProject, FandomOption, ProjectShelfItem } from "@/lib/projects"

export function ProjectsIndex({
  exploreProjects,
  fandoms,
  viewer,
  projects,
}: {
  exploreProjects: ExploreProject[]
  fandoms: FandomOption[]
  viewer: HomeViewer
  projects: ProjectShelfItem[]
}) {
  const [createOpen, setCreateOpen] = useState(false)
  const createHref = viewer.canPost
    ? undefined
    : viewer.reason === "anonymous"
      ? "/login"
      : "/onboarding"

  return (
    <>
      <header className="flex flex-col gap-6 px-6 pt-10 pb-8 sm:flex-row sm:items-center sm:justify-between md:px-12">
        <div className="flex max-w-3xl flex-col gap-3">
          <h1 className="text-5xl font-semibold text-foreground">Projects</h1>
          <p className="text-base text-muted-foreground">
            A lasting home for every build. Document yours. Follow what&apos;s taking shape.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2.5 sm:items-end">
          {createHref ? (
            <Button
              className="h-11 gap-2 rounded-lg px-4.5 text-sm"
              nativeButton={false}
              render={<Link href={createHref} />}
            >
              <PlusIcon />
              Create project
            </Button>
          ) : (
            <Button
              className="h-11 gap-2 rounded-lg px-4.5 text-sm"
              onClick={() => setCreateOpen(true)}
              type="button"
            >
              <PlusIcon />
              Create project
            </Button>
          )}
          <p className="text-xs text-muted-foreground">From first sketch to final finish.</p>
        </div>
      </header>
      <ProjectShelf createHref={createHref} onCreate={() => setCreateOpen(true)} projects={projects} />
      <Separator className="h-px" />
      <section className="flex flex-col gap-6 px-6 py-8 md:px-12">
        <ProjectsExploreHeader />
        <ProjectsExploreFilters fandoms={fandoms} projects={exploreProjects} />
      </section>
      {viewer.canPost ? (
        <CreateProjectDialog fandoms={fandoms} onOpenChange={setCreateOpen} open={createOpen} />
      ) : null}
    </>
  )
}

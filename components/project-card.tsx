"use client"

import { ClockIcon, ImagesIcon, LinkSimpleIcon, PlusIcon } from "@phosphor-icons/react"
import Image from "next/image"
import Link from "next/link"

import { ProjectStatusBadge } from "@/components/project-status-badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { ProjectShelfItem } from "@/lib/projects"

function countLabel(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`
}

export function ProjectCard({
  project,
  showMaker = false,
}: {
  project: ProjectShelfItem & { username?: string; avatarUrl?: string | null }
  showMaker?: boolean
}) {
  const initial = project.username?.slice(0, 1).toUpperCase()

  return (
    <Card className="w-68 shrink-0 gap-2 rounded-xl bg-transparent py-0 ring-0 [--card-spacing:--spacing(2)]">
      <Link className="flex flex-col gap-2" href={`/projects/${project.id}`}>
        <div className="relative h-59 overflow-hidden rounded-xl bg-muted">
          {project.coverUrl ? (
            <Image alt="" className="object-cover" fill sizes="17rem" src={project.coverUrl} />
          ) : null}
          <div className="absolute top-3.5 left-3.5">
            <ProjectStatusBadge status={project.status} />
          </div>
          <div className="absolute right-3.5 bottom-3.5 flex items-center gap-1.5 rounded-md bg-background px-2 py-1.5 font-mono text-xs text-foreground">
            <ImagesIcon className="size-3.5" />
            {project.photoCount}
          </div>
        </div>
        <div className="flex flex-col gap-4 pt-1">
          <div className="flex flex-col gap-1">
            <p className="truncate text-base font-semibold">{project.title}</p>
            {showMaker && project.username ? (
              <div className="flex items-center gap-2">
                <Avatar size="sm">
                  {project.avatarUrl ? <AvatarImage alt="" src={project.avatarUrl} /> : null}
                  <AvatarFallback>{initial}</AvatarFallback>
                </Avatar>
                <p className="truncate text-sm text-muted-foreground">{project.username}</p>
              </div>
            ) : null}
          </div>
          <div className="flex items-center justify-between font-mono text-xs text-muted-foreground">
            <p>{countLabel(project.updateCount, "update", "updates")}</p>
            <p className="flex items-center gap-2">
              <ClockIcon className="size-4" />
              {project.updatedLabel}
            </p>
          </div>
        </div>
      </Link>
      <div className="h-px bg-border" />
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <LinkSimpleIcon className="size-4" />
          {project.resourceCount}
        </p>
        {showMaker ? (
          <Button className="h-9 rounded-lg px-3 text-sm" type="button" variant="secondary">
            <PlusIcon />
            Follow project
          </Button>
        ) : null}
      </div>
    </Card>
  )
}

"use client"

import {
  BookmarkSimpleIcon,
  DotsThreeIcon,
  PencilSimpleIcon,
  PlusIcon,
  ShareNetworkIcon,
  StackIcon,
  UsersIcon,
} from "@phosphor-icons/react"
import Link from "next/link"

import { ProjectGallery } from "@/components/project-gallery"
import { ProjectStatusBadge } from "@/components/project-status-badge"
import { Tag } from "@/components/tag"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import type { ProjectPage } from "@/lib/projects"

export function ProjectHero({
  project,
  onEdit,
}: {
  project: ProjectPage
  onEdit?: () => void
}) {
  const updateLabel = project.updates.length === 1 ? "1 update" : `${project.updates.length} updates`

  return (
    <section className="grid items-start gap-8 lg:grid-cols-5 lg:gap-10">
      <div className="lg:col-span-3">
        <ProjectGallery urls={project.galleryUrls} />
      </div>
      <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 border-b border-border pb-4">
            <h1 className="text-3xl tracking-tight text-foreground lg:text-5xl">
              {project.title}
            </h1>
            <div className="flex items-center justify-between gap-3">
              <Link className="flex min-w-0 items-center gap-3" href={`/${project.username}`}>
                <Avatar className="size-8">
                  {project.avatarUrl ? <AvatarImage alt="" src={project.avatarUrl} /> : null}
                  <AvatarFallback>{project.author.slice(0, 1)}</AvatarFallback>
                </Avatar>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-xs font-medium text-muted-foreground">
                    Built and documented by
                  </span>
                  <span className="truncate text-sm font-medium text-foreground">{project.author}</span>
                </span>
              </Link>
              <ProjectStatusBadge className="shrink-0" status={project.status} />
            </div>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{project.description}</p>
          {project.tags.length ? (
            <div className="flex flex-wrap gap-1.5">
              {project.tags.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {project.isOwner && onEdit ? (
            <Button className="flex-1" onClick={onEdit} size="lg" type="button">
              <PencilSimpleIcon />
              Edit project
            </Button>
          ) : (
            <Button className="flex-1" size="lg" type="button">
              <PlusIcon />
              Follow project
            </Button>
          )}
          <Button aria-label="Save project" size="icon-lg" type="button" variant="outline">
            <BookmarkSimpleIcon />
          </Button>
          <Button aria-label="Share project" size="icon-lg" type="button" variant="outline">
            <ShareNetworkIcon />
          </Button>
          <Button aria-label="More actions" size="icon-lg" type="button" variant="outline">
            <DotsThreeIcon />
          </Button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5">
              <UsersIcon className="size-4" />
              0 followers
            </span>
            <Separator className="data-vertical:h-4 data-vertical:self-center" orientation="vertical" />
            <span className="flex items-center gap-1.5">
              <StackIcon className="size-4" />
              {updateLabel}
            </span>
          </div>
          <span>Last updated {project.lastUpdatedLabel}</span>
        </div>
      </div>
    </section>
  )
}

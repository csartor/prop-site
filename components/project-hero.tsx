"use client"

import {
  BookmarkSimpleIcon,
  DotsThreeIcon,
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

export function ProjectHero({ project }: { project: ProjectPage }) {
  const updateLabel = project.updates.length === 1 ? "1 update" : `${project.updates.length} updates`

  return (
    <section className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] lg:gap-10">
      <ProjectGallery urls={project.galleryUrls} />
      <div className="flex min-w-0 flex-col gap-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
            {project.buildLabel} · By {project.username}
          </p>
          <ProjectStatusBadge status={project.status} />
        </div>
        <div className="flex flex-col gap-3">
          <h1 className="text-[1.875rem] leading-[1.03] tracking-[-0.04em] text-foreground lg:text-5xl">
            {project.title}
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{project.description}</p>
        </div>
        {project.tags.length ? (
          <div className="flex flex-wrap gap-1.5">
            {project.tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>
        ) : null}
        <Link className="flex w-fit items-center gap-2.5" href={`/makers/${project.username}`}>
          <Avatar className="size-8">
            {project.avatarUrl ? <AvatarImage alt="" src={project.avatarUrl} /> : null}
            <AvatarFallback>{project.author.slice(0, 1)}</AvatarFallback>
          </Avatar>
          <span className="flex flex-col">
            <span className="text-[10px] text-muted-foreground">Built and documented by</span>
            <span className="text-xs text-foreground">{project.author}</span>
          </span>
        </Link>
        <div className="flex items-center gap-2.5">
          <Button className="h-[46px] flex-1" type="button">
            <PlusIcon />
            Follow project
          </Button>
          <Button aria-label="Save project" className="size-[46px]" size="icon" type="button" variant="outline">
            <BookmarkSimpleIcon className="size-6" />
          </Button>
          <Button aria-label="Share project" className="size-[46px]" size="icon" type="button" variant="outline">
            <ShareNetworkIcon className="size-[18px]" />
          </Button>
          <Button aria-label="More actions" className="size-[46px]" size="icon" type="button" variant="outline">
            <DotsThreeIcon className="size-[18px]" />
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <UsersIcon className="size-[15px]" />
            0 followers
          </span>
          <Separator className="h-3.5 data-vertical:h-3.5 data-vertical:self-center" orientation="vertical" />
          <span className="flex items-center gap-1.5">
            <StackIcon className="size-[15px]" />
            {updateLabel}
          </span>
          <Separator className="h-3.5 data-vertical:h-3.5 data-vertical:self-center" orientation="vertical" />
          <span>Last updated {project.lastUpdatedLabel}</span>
        </div>
      </div>
    </section>
  )
}

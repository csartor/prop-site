"use client"

import Link from "next/link"
import {
  ArrowRightIcon,
  BellRingingIcon,
  ClipboardTextIcon,
  FolderOpenIcon,
  UserIcon,
} from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { projectStatusLabel, type ProjectStatus } from "@/lib/project-status"
import type { ProjectPage } from "@/lib/projects"
import { cn } from "cn"

const statusColor: Record<ProjectStatus, string> = {
  completed: "text-success",
  in_progress: "text-primary",
  paused: "text-warning",
  cancelled: "text-destructive",
}

export function ProjectSupportRail({ project }: { project: ProjectPage }) {
  const rows = [
    { label: "Status", value: projectStatusLabel(project.status), valueClassName: statusColor[project.status] },
    { label: "Started", value: project.startedLabel },
    { label: "Completed", value: project.completedLabel },
    { label: "Material", value: project.material },
    { label: "Scale", value: project.scale },
    { label: "Techniques", value: project.techniques },
    { label: "Tools", value: project.tools },
    { label: "Total updates", value: String(project.updates.length) },
    { label: "Build ID", value: project.buildLabel },
  ]

  return (
    <aside className="flex w-full flex-col gap-4 lg:w-[21.5rem]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardTextIcon className="size-4" />
            Build info
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Separator />
          <dl className="flex flex-col gap-2.5 text-sm">
            {rows.map((row) => (
              <div className="flex items-start justify-between gap-4" key={row.label}>
                <dt className="text-muted-foreground">{row.label}</dt>
                <dd className={cn("text-right", row.valueClassName)}>{row.value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="size-4" />
            Creator
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="size-12 ring-2 ring-primary">
              {project.avatarUrl ? <AvatarImage alt="" src={project.avatarUrl} /> : null}
              <AvatarFallback>{project.author.slice(0, 1)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{project.author}</p>
              {project.creator.tagline ? (
                <p className="truncate text-xs text-muted-foreground">{project.creator.tagline}</p>
              ) : null}
            </div>
          </div>
          {project.creator.bio ? (
            <p className="text-sm text-muted-foreground">{project.creator.bio}</p>
          ) : null}
          <dl className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Builds" value={String(project.creator.publicBuildCount)} />
            <Stat label="Followers" value="0" />
            <Stat label="Level" value={project.creator.experienceLevel ?? "—"} />
          </dl>
          <Button
            className="w-full"
            nativeButton={false}
            render={<Link href={`/makers/${project.username}`} />}
            variant="outline"
          >
            View profile
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpenIcon className="size-4" />
            Resources
            <span className="ml-auto font-mono text-xs text-muted-foreground">00</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">No resources yet.</p>
          <Button className="w-full bg-primary/10 text-primary hover:bg-primary/10" disabled>
            View all resources
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <BellRingingIcon className="size-4" />
          </span>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">Follow the build, not the feed.</p>
            <p className="text-xs text-muted-foreground">
              Hear about the next update from {project.author}.
            </p>
          </div>
        </CardContent>
      </Card>
    </aside>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[10px] tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  )
}

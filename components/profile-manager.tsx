"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { assignPostProject } from "@/app/posts/actions"
import { CreateProjectDialog } from "@/components/create-project-dialog"
import { ProjectStatusBadge } from "@/components/project-status-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { FandomOption, OwnedPost, OwnedProject } from "@/lib/projects"

export function ProfileManager({
  fandoms,
  projects,
  posts,
}: {
  fandoms: FandomOption[]
  projects: OwnedProject[]
  posts: OwnedPost[]
}) {
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-8">
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-heading text-xl font-medium">Projects</h1>
          <Button onClick={() => setCreateOpen(true)} type="button">
            Create project
          </Button>
        </div>
        {projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">No projects yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {projects.map((project) => (
              <li className="flex items-center justify-between gap-3 rounded-lg border p-3" key={project.id}>
                <div className="min-w-0">
                  <Link className="truncate text-sm font-medium hover:underline" href={`/projects/${project.id}`}>
                    {project.title}
                  </Link>
                  <ProjectStatusBadge className="mt-1" status={project.status} />
                </div>
                <Badge variant="secondary">{project.visibility === "public" ? "Public" : "Private"}</Badge>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-xl font-medium">Posts</h2>
        {posts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No posts yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {posts.map((post) => (
              <li className="grid items-center gap-3 rounded-lg border p-3 sm:grid-cols-[1fr_16rem]" key={post.id}>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{post.title}</p>
                  <p className="text-xs text-muted-foreground">{post.createdLabel}</p>
                </div>
                <PostProjectSelect post={post} projects={projects} />
              </li>
            ))}
          </ul>
        )}
      </section>
      <CreateProjectDialog fandoms={fandoms} onOpenChange={setCreateOpen} open={createOpen} />
    </div>
  )
}

function PostProjectSelect({
  post,
  projects,
}: {
  post: OwnedPost
  projects: OwnedProject[]
}) {
  const router = useRouter()
  const [value, setValue] = useState(post.projectId ?? "none")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const selected = projects.find((project) => project.id === value)

  async function onChange(next: string | null) {
    const projectId = !next || next === "none" ? "none" : next
    setValue(projectId)
    setPending(true)
    setError(null)
    const result = await assignPostProject(post.id, projectId === "none" ? null : projectId)
    setPending(false)
    if (result.error) {
      setValue(post.projectId ?? "none")
      setError(result.error)
      return
    }
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-1">
      <Select disabled={pending} onValueChange={onChange} value={value}>
        <SelectTrigger className="w-full">
          <SelectValue>{selected?.title ?? "No project"}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No project</SelectItem>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {project.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}

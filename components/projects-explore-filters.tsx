"use client"

import { MagnifyingGlassIcon } from "@phosphor-icons/react"
import { useMemo, useState } from "react"

import { ProjectCard } from "@/components/project-card"
import { Checkbox } from "@/components/ui/checkbox"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { projectStatuses, projectStatusLabel } from "@/lib/project-status"
import type { ExploreProject, FandomOption } from "@/lib/projects"

const triggerClass = "h-10 rounded-lg text-sm"

export function ProjectsExploreFilters({
  fandoms,
  projects,
}: {
  fandoms: FandomOption[]
  projects: ExploreProject[]
}) {
  const [query, setQuery] = useState("")
  const [fandomId, setFandomId] = useState("all")
  const [material, setMaterial] = useState("all")
  const [status, setStatus] = useState("all")

  const materials = useMemo(
    () =>
      [...new Set(projects.map((project) => project.material).filter(Boolean))].sort((left, right) =>
        left.localeCompare(right),
      ),
    [projects],
  )

  const needle = query.trim().toLowerCase()
  const filtering = Boolean(needle) || fandomId !== "all" || material !== "all" || status !== "all"
  const filtered = projects.filter((project) => {
    if (fandomId !== "all" && !project.fandomIds.includes(fandomId)) return false
    if (material !== "all" && project.material !== material) return false
    if (status !== "all" && project.status !== status) return false
    if (!needle) return true
    return [project.title, project.author, project.username, project.material]
      .join(" ")
      .toLowerCase()
      .includes(needle)
  })

  const fandomLabel = fandoms.find((option) => option.id === fandomId)?.label ?? "Fandom"
  const statusLabel = status === "all" ? "Status" : projectStatusLabel(status)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <InputGroup className="h-10 w-full rounded-lg sm:w-80">
          <InputGroupAddon>
            <MagnifyingGlassIcon />
          </InputGroupAddon>
          <InputGroupInput
            aria-label="Search projects, makers, materials"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search projects, makers, materials..."
            value={query}
          />
        </InputGroup>
        <Select onValueChange={(value) => setFandomId(value ?? "all")} value={fandomId}>
          <SelectTrigger className={triggerClass}>
            <SelectValue>{fandomId === "all" ? "Fandom" : fandomLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All fandoms</SelectItem>
            {fandoms.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select onValueChange={(value) => setMaterial(value ?? "all")} value={material}>
          <SelectTrigger className={triggerClass}>
            <SelectValue>{material === "all" ? "Base material" : material}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All materials</SelectItem>
            {materials.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select onValueChange={(value) => setStatus(value ?? "all")} value={status}>
          <SelectTrigger className={triggerClass}>
            <SelectValue>{statusLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {projectStatuses.map((item) => (
              <SelectItem key={item} value={item}>
                {projectStatusLabel(item)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex h-10 items-center gap-2 rounded-lg border border-input px-3 text-sm text-muted-foreground">
          <Checkbox disabled />
          Has resources
        </div>
      </div>
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {filtering ? "No projects match these filters." : "No public projects yet."}
        </p>
      ) : (
        <div className="flex flex-wrap gap-6">
          {filtered.map((project) => (
            <ProjectCard key={project.id} project={project} showMaker />
          ))}
        </div>
      )}
    </div>
  )
}

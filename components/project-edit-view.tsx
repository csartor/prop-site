"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"

import { updateProject } from "@/app/projects/actions"
import { ProjectNavigation } from "@/components/project-navigation"
import { ProjectUpdates } from "@/components/project-updates"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { projectFormSchema, type ProjectFormValues } from "@/lib/project-form"
import { projectStatuses, projectStatusLabel } from "@/lib/project-status"
import type { ProjectPage } from "@/lib/projects"

const imageTypes = new Set(["image/jpeg", "image/png", "image/webp"])
const maxImageBytes = 5 * 1024 * 1024

const statuses = projectStatuses.map((value) => ({
  value,
  label: projectStatusLabel(value),
}))

export function ProjectEditView({
  project,
  onDone,
}: {
  project: ProjectPage
  onDone: () => void
}) {
  const router = useRouter()
  const [cover, setCover] = useState<File | null>(null)
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [tagDraft, setTagDraft] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      title: project.title,
      description: project.description,
      status: project.status,
      isPublic: project.visibility === "public",
      tags: project.tags,
      startedOn: project.startedOn ?? "",
      completedOn: project.completedOn ?? "",
      material: project.material === "—" ? "" : project.material,
      scale: project.scale === "—" ? "" : project.scale,
      techniques: project.techniques === "—" ? "" : project.techniques,
      tools: project.tools === "—" ? "" : project.tools,
    },
  })
  const tags = form.watch("tags")
  const status = form.watch("status")
  const dirty = form.formState.isDirty || Boolean(cover)
  const previewUrl = coverUrl ?? project.coverUrl

  useEffect(() => {
    if (!dirty) return
    function warn(event: BeforeUnloadEvent) {
      event.preventDefault()
    }
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  useEffect(() => {
    return () => {
      if (coverUrl) URL.revokeObjectURL(coverUrl)
    }
  }, [coverUrl])

  function requestCancel() {
    if (dirty) {
      setConfirmCancel(true)
      return
    }
    onDone()
  }

  function addTag() {
    const next = tagDraft.trim()
    if (!next || tags.some((tag) => tag.toLowerCase() === next.toLowerCase())) {
      setTagDraft("")
      return
    }
    form.setValue("tags", [...tags, next], { shouldDirty: true, shouldValidate: true })
    setTagDraft("")
  }

  async function submit(values: ProjectFormValues) {
    const formData = new FormData()
    formData.set("title", values.title)
    formData.set("description", values.description)
    formData.set("status", values.status)
    formData.set("isPublic", String(values.isPublic))
    formData.set("startedOn", values.startedOn)
    formData.set("completedOn", values.completedOn)
    formData.set("material", values.material)
    formData.set("scale", values.scale)
    formData.set("techniques", values.techniques)
    formData.set("tools", values.tools)
    formData.set("tags", JSON.stringify(values.tags))
    if (cover) formData.set("cover", cover)
    setPending(true)
    setError(null)
    const result = await updateProject(project.id, formData)
    setPending(false)
    if (result.error) {
      setError(result.error)
      return
    }
    onDone()
    router.refresh()
  }

  return (
    <form onSubmit={form.handleSubmit(submit)}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pt-8 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium tracking-widest text-primary uppercase">Editing</p>
            <p className="font-mono text-sm">{project.buildLabel}</p>
          </div>
          <div className="flex gap-2">
            <Button disabled={pending} onClick={requestCancel} type="button" variant="outline">
              Cancel
            </Button>
            <Button disabled={pending} type="submit">
              Save changes
            </Button>
          </div>
        </div>
        <div className="grid items-start gap-8 lg:grid-cols-5 lg:gap-10">
          <div className="flex flex-col gap-3 lg:col-span-3">
            <div className="relative aspect-4/3 overflow-hidden rounded-lg bg-muted">
              {previewUrl ? (
                <Image alt="" className="object-cover" fill sizes="(min-width: 1024px) 42rem, 100vw" src={previewUrl} />
              ) : (
                <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
                  No cover yet.
                </div>
              )}
            </div>
            <Field>
              <FieldLabel htmlFor="project-edit-cover">Replace cover</FieldLabel>
              <Input
                accept="image/jpeg,image/png,image/webp"
                id="project-edit-cover"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (!file || !imageTypes.has(file.type) || file.size > maxImageBytes) {
                    setError("Use a JPEG, PNG, or WebP cover under 5 MB.")
                    return
                  }
                  if (coverUrl) URL.revokeObjectURL(coverUrl)
                  setCover(file)
                  setCoverUrl(URL.createObjectURL(file))
                  setError(null)
                }}
                type="file"
              />
            </Field>
          </div>
          <FieldGroup className="lg:col-span-2">
            <Field data-invalid={Boolean(form.formState.errors.title)}>
              <FieldLabel htmlFor="project-edit-title">Title</FieldLabel>
              <Input id="project-edit-title" {...form.register("title")} />
              <FieldError errors={[form.formState.errors.title]} />
            </Field>
            <Field data-invalid={Boolean(form.formState.errors.description)}>
              <FieldLabel htmlFor="project-edit-description">Description</FieldLabel>
              <Textarea className="min-h-28" id="project-edit-description" {...form.register("description")} />
              <FieldError errors={[form.formState.errors.description]} />
            </Field>
            <Field>
              <FieldLabel>Status</FieldLabel>
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <Select onValueChange={(value) => field.onChange(value ?? "in_progress")} value={field.value}>
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {statuses.find((item) => item.value === status)?.label ?? "In progress"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field orientation="horizontal">
              <Controller
                control={form.control}
                name="isPublic"
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    id="project-edit-public"
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <FieldLabel htmlFor="project-edit-public">Public</FieldLabel>
            </Field>
            <Field data-invalid={Boolean(form.formState.errors.tags)}>
              <FieldLabel htmlFor="project-edit-tags">Tags</FieldLabel>
              <Input
                id="project-edit-tags"
                onChange={(event) => setTagDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return
                  event.preventDefault()
                  addTag()
                }}
                placeholder="Add tags..."
                value={tagDraft}
              />
              <FieldError errors={[form.formState.errors.tags]} />
              {tags.length ? (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Button
                      key={tag}
                      onClick={() =>
                        form.setValue(
                          "tags",
                          tags.filter((item) => item !== tag),
                          { shouldDirty: true, shouldValidate: true },
                        )
                      }
                      size="xs"
                      type="button"
                      variant="secondary"
                    >
                      {tag} ×
                    </Button>
                  ))}
                </div>
              ) : null}
            </Field>
          </FieldGroup>
        </div>
      </div>
      <div className="mt-8 w-full border-y border-border">
        <div className="mx-auto w-full max-w-6xl overflow-x-auto px-4 sm:px-6">
          <ProjectNavigation updateCount={project.updates.length} />
        </div>
      </div>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_auto]">
          <ProjectUpdates updates={project.updates} />
          <Card className="w-full lg:w-80">
            <CardHeader>
              <CardTitle>Build info</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="project-edit-started">Started</FieldLabel>
                  <Input id="project-edit-started" type="date" {...form.register("startedOn")} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="project-edit-completed">Completed</FieldLabel>
                  <Input id="project-edit-completed" type="date" {...form.register("completedOn")} />
                </Field>
                <Field data-invalid={Boolean(form.formState.errors.material)}>
                  <FieldLabel htmlFor="project-edit-material">Material</FieldLabel>
                  <Input id="project-edit-material" {...form.register("material")} />
                  <FieldError errors={[form.formState.errors.material]} />
                </Field>
                <Field data-invalid={Boolean(form.formState.errors.scale)}>
                  <FieldLabel htmlFor="project-edit-scale">Scale</FieldLabel>
                  <Input id="project-edit-scale" {...form.register("scale")} />
                  <FieldError errors={[form.formState.errors.scale]} />
                </Field>
                <Field data-invalid={Boolean(form.formState.errors.techniques)}>
                  <FieldLabel htmlFor="project-edit-techniques">Techniques</FieldLabel>
                  <Input id="project-edit-techniques" {...form.register("techniques")} />
                  <FieldError errors={[form.formState.errors.techniques]} />
                </Field>
                <Field data-invalid={Boolean(form.formState.errors.tools)}>
                  <FieldLabel htmlFor="project-edit-tools">Tools</FieldLabel>
                  <Input id="project-edit-tools" {...form.register("tools")} />
                  <FieldError errors={[form.formState.errors.tools]} />
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>
        </div>
        {error ? (
          <p className="mt-4 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>
      <Dialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discard changes?</DialogTitle>
            <DialogDescription>Your edits to this project will not be saved.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setConfirmCancel(false)} type="button" variant="outline">
              Keep editing
            </Button>
            <Button
              onClick={() => {
                setConfirmCancel(false)
                onDone()
              }}
              type="button"
              variant="destructive"
            >
              Discard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  )
}

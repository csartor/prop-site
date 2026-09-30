"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"

import { createProject } from "@/app/projects/actions"
import { Button } from "@/components/ui/button"
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
import { projectStatuses, projectStatusLabel } from "@/lib/project-status"

const imageTypes = new Set(["image/jpeg", "image/png", "image/webp"])
const maxImageBytes = 5 * 1024 * 1024

const projectSchema = z.object({
  title: z.string().trim().min(1, "Enter a title.").max(160, "Use 160 characters or fewer."),
  description: z
    .string()
    .trim()
    .min(1, "Enter a description.")
    .max(2000, "Use 2000 characters or fewer."),
  status: z.enum(projectStatuses),
  isPublic: z.boolean(),
  startedOn: z.string(),
  completedOn: z.string(),
  material: z.string().trim().max(200, "Use 200 characters or fewer."),
  scale: z.string().trim().max(200, "Use 200 characters or fewer."),
  techniques: z.string().trim().max(200, "Use 200 characters or fewer."),
  tools: z.string().trim().max(200, "Use 200 characters or fewer."),
  tags: z.array(z.string()),
})

type ProjectValues = z.infer<typeof projectSchema>

const statuses = projectStatuses.map((value) => ({
  value,
  label: projectStatusLabel(value),
}))

export function CreateProjectDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [cover, setCover] = useState<File | null>(null)
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [tagDraft, setTagDraft] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const form = useForm<ProjectValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "in_progress",
      isPublic: false,
      startedOn: "",
      completedOn: "",
      material: "",
      scale: "",
      techniques: "",
      tools: "",
      tags: [],
    },
  })
  const tags = form.watch("tags")
  const status = form.watch("status")

  function resetComposer() {
    form.reset()
    if (coverUrl) URL.revokeObjectURL(coverUrl)
    setCover(null)
    setCoverUrl(null)
    setTagDraft("")
    setError(null)
  }

  function close(nextOpen: boolean) {
    onOpenChange(nextOpen)
    if (!nextOpen) resetComposer()
  }

  function addTag() {
    const next = tagDraft.trim()
    if (!next || tags.some((tag) => tag.toLowerCase() === next.toLowerCase())) {
      setTagDraft("")
      return
    }
    form.setValue("tags", [...tags, next])
    setTagDraft("")
  }

  async function submit(values: ProjectValues) {
    if (!cover) {
      setError("Add a cover image.")
      return
    }
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
    formData.set("cover", cover)
    setPending(true)
    setError(null)
    const result = await createProject(formData)
    setPending(false)
    if (result.error) {
      setError(result.error)
      return
    }
    close(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[calc(100%-2rem)] overflow-y-auto sm:max-w-xl">
        <form className="grid gap-6" onSubmit={form.handleSubmit(submit)}>
          <DialogHeader>
            <DialogTitle className="font-heading text-lg">Create project</DialogTitle>
            <DialogDescription>
              Group your posts into a build others can follow when you make it public.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="project-cover">Cover</FieldLabel>
              <Input
                accept="image/jpeg,image/png,image/webp"
                id="project-cover"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (!file || !imageTypes.has(file.type) || file.size > maxImageBytes) {
                    setCover(null)
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
              {coverUrl ? (
                <div className="relative aspect-video w-full">
                  <Image
                    alt=""
                    className="rounded-lg object-cover"
                    fill
                    sizes="(min-width: 768px) 32rem, 100vw"
                    src={coverUrl}
                  />
                </div>
              ) : null}
            </Field>
            <Field data-invalid={Boolean(form.formState.errors.title)}>
              <FieldLabel htmlFor="project-title">Title</FieldLabel>
              <Input id="project-title" {...form.register("title")} />
              <FieldError errors={[form.formState.errors.title]} />
            </Field>
            <Field data-invalid={Boolean(form.formState.errors.description)}>
              <FieldLabel htmlFor="project-description">Description</FieldLabel>
              <Textarea className="min-h-24" id="project-description" {...form.register("description")} />
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
                  <Switch checked={field.value} id="project-public" onCheckedChange={field.onChange} />
                )}
              />
              <FieldLabel htmlFor="project-public">Public</FieldLabel>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="project-started">Started</FieldLabel>
                <Input id="project-started" type="date" {...form.register("startedOn")} />
              </Field>
              <Field>
                <FieldLabel htmlFor="project-completed">Completed</FieldLabel>
                <Input id="project-completed" type="date" {...form.register("completedOn")} />
              </Field>
              <Field>
                <FieldLabel htmlFor="project-material">Material</FieldLabel>
                <Input id="project-material" {...form.register("material")} />
              </Field>
              <Field>
                <FieldLabel htmlFor="project-scale">Scale</FieldLabel>
                <Input id="project-scale" {...form.register("scale")} />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="project-techniques">Techniques</FieldLabel>
              <Input id="project-techniques" {...form.register("techniques")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="project-tools">Tools</FieldLabel>
              <Input id="project-tools" {...form.register("tools")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="project-tags">Tags</FieldLabel>
              <Input
                id="project-tags"
                onChange={(event) => setTagDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return
                  event.preventDefault()
                  addTag()
                }}
                placeholder="Add tags..."
                value={tagDraft}
              />
              {tags.length ? (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Button
                      key={tag}
                      onClick={() =>
                        form.setValue(
                          "tags",
                          tags.filter((item) => item !== tag),
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
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <Button disabled={pending} onClick={() => close(false)} type="button" variant="outline">
              Cancel
            </Button>
            <Button disabled={pending} type="submit">
              Create project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

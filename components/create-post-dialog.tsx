"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { CheckIcon, PlusIcon } from "@phosphor-icons/react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { z } from "zod"

import { createPost } from "@/app/posts/actions"
import type { ComposerIntent } from "@/components/composer"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { ProjectOption } from "@/lib/projects"

const imageTypes = new Set(["image/jpeg", "image/png", "image/webp"])
const maxImageBytes = 5 * 1024 * 1024

const postSchema = z.object({
  title: z.string().trim().min(1, "Enter a title.").max(120, "Use 120 characters or fewer."),
  body: z
    .string()
    .trim()
    .min(1, "Enter a description.")
    .max(2000, "Use 2000 characters or fewer."),
  tags: z.array(z.string()),
  project: z.string(),
  milestone: z.string().trim().max(40, "Use 40 characters or fewer."),
  processNote: z.string().trim().max(160, "Use 160 characters or fewer."),
})

type PostValues = z.infer<typeof postSchema>

type LocalImage = {
  id: string
  url: string
  file: File
}

export function CreatePostDialog({
  open,
  onOpenChange,
  author,
  projects,
  intent = null,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  author: { displayName: string; username: string; avatarUrl: string | null }
  projects: ProjectOption[]
  intent?: ComposerIntent | null
}) {
  const router = useRouter()
  const fileInput = useRef<HTMLInputElement>(null)
  const [images, setImages] = useState<LocalImage[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [coverId, setCoverId] = useState<string | null>(null)
  const [tagDraft, setTagDraft] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const form = useForm<PostValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: "",
      body: "",
      tags: [],
      project: "none",
      milestone: "",
      processNote: "",
    },
  })
  const title = useWatch({ control: form.control, name: "title" }) ?? ""
  const body = useWatch({ control: form.control, name: "body" }) ?? ""
  const tags = useWatch({ control: form.control, name: "tags" }) ?? []
  const project = useWatch({ control: form.control, name: "project" }) ?? "none"
  const selectedImage = images.find((image) => image.id === selectedId) ?? images[0]
  const coverImage = images.find((image) => image.id === coverId) ?? images[0]
  const appliedIntent = useRef<number | null>(null)

  useEffect(() => {
    if (!open || !intent) {
      appliedIntent.current = null
      return
    }
    if (appliedIntent.current === intent.key) return
    appliedIntent.current = intent.key
    if (intent.projectId) form.setValue("project", intent.projectId)
    const timer = window.setTimeout(() => {
      if (intent.focus === "photo") fileInput.current?.click()
      if (intent.focus === "process") document.getElementById("post-process-note")?.focus()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [form, intent, open])

  function resetComposer() {
    form.reset()
    setImages((current) => {
      current.forEach((image) => URL.revokeObjectURL(image.url))
      return []
    })
    setSelectedId(null)
    setCoverId(null)
    setTagDraft("")
    setError(null)
  }

  function close(nextOpen: boolean) {
    onOpenChange(nextOpen)
    if (!nextOpen) resetComposer()
  }

  function addImages(files: FileList | null) {
    if (!files?.length) return
    const next = Array.from(files)
      .filter((file) => imageTypes.has(file.type) && file.size <= maxImageBytes)
      .map((file) => ({
        id: crypto.randomUUID(),
        url: URL.createObjectURL(file),
        file,
      }))
    if (!next.length) {
      setError("Use JPEG, PNG, or WebP images under 5 MB.")
      return
    }
    setError(null)
    setImages((current) => [...current, ...next])
    setSelectedId(next[0].id)
    setCoverId((current) => current ?? next[0].id)
  }

  function addTag() {
    const next = tagDraft.trim()
    if (!next || tags.some((tag) => tag.toLowerCase() === next.toLowerCase())) {
      setTagDraft("")
      return
    }
    form.setValue("tags", [...tags, next], { shouldValidate: true })
    setTagDraft("")
  }

  async function submit(values: PostValues) {
    if (!coverImage) {
      setError("Add a cover image.")
      return
    }
    const ordered = [coverImage, ...images.filter((image) => image.id !== coverImage.id)]
    const formData = new FormData()
    formData.set("title", values.title)
    formData.set("body", values.body)
    formData.set("tags", JSON.stringify(values.tags))
    formData.set("projectId", values.project)
    formData.set("milestone", values.milestone)
    formData.set("processNote", values.processNote)
    ordered.forEach((image) => formData.append("images", image.file))
    setPending(true)
    setError(null)
    const result = await createPost(formData)
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
      <DialogContent className="max-h-[calc(100%-2rem)] overflow-y-auto sm:max-w-4xl">
        <form className="grid gap-6" onSubmit={form.handleSubmit(submit)}>
          <DialogHeader>
            <DialogTitle className="font-heading text-lg">Create post</DialogTitle>
            <DialogDescription>
              Share your progress, get feedback, and inspire the community.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <div className="space-y-3">
              <div className="relative aspect-4/3 overflow-hidden rounded-lg">
                {selectedImage ? (
                  <Image
                    alt=""
                    className="object-cover"
                    fill
                    sizes="(min-width: 768px) 32rem, 100vw"
                    src={selectedImage.url}
                  />
                ) : (
                  <div className="flex size-full items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                    Add a cover image
                  </div>
                )}
                <Button
                  className="absolute top-3 right-3"
                  disabled={!selectedImage || selectedImage.id === coverId}
                  onClick={() => selectedImage && setCoverId(selectedImage.id)}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  Set as cover
                </Button>
              </div>
              <div className="flex gap-2">
                {images.map((image) => (
                  <button
                    className="relative size-16 overflow-hidden rounded-md ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                    key={image.id}
                    onClick={() => setSelectedId(image.id)}
                    type="button"
                  >
                    <Image alt="" className="object-cover" fill sizes="64px" src={image.url} />
                    {image.id === coverId ? (
                      <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <CheckIcon className="size-3" />
                      </span>
                    ) : null}
                    {image.id === selectedId ? (
                      <span className="pointer-events-none absolute inset-0 rounded-md ring-2 ring-primary" />
                    ) : null}
                  </button>
                ))}
                <Button
                  className="size-16 flex-col gap-1 px-1 whitespace-normal text-[0.625rem]"
                  onClick={() => fileInput.current?.click()}
                  type="button"
                  variant="outline"
                >
                  <PlusIcon />
                  Add more
                </Button>
                <input
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  multiple
                  onChange={(event) => {
                    addImages(event.target.files)
                    event.target.value = ""
                  }}
                  ref={fileInput}
                  type="file"
                />
              </div>
            </div>
            <FieldGroup>
              <div className="flex items-center gap-3">
                <Avatar>
                  {author.avatarUrl ? <AvatarImage alt="" src={author.avatarUrl} /> : null}
                  <AvatarFallback>{author.displayName.slice(0, 1)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs text-muted-foreground">Posting as</p>
                  <p className="text-sm font-medium">{author.displayName}</p>
                  <p className="text-xs text-muted-foreground">@{author.username}</p>
                </div>
              </div>
              <Field data-invalid={Boolean(form.formState.errors.title)}>
                <div className="flex items-center justify-between gap-3">
                  <FieldLabel htmlFor="post-title">Title</FieldLabel>
                  <span className="text-xs text-muted-foreground">{title.length}/120</span>
                </div>
                <Input
                  aria-invalid={Boolean(form.formState.errors.title)}
                  id="post-title"
                  {...form.register("title")}
                />
                <FieldError errors={[form.formState.errors.title]} />
              </Field>
              <Field data-invalid={Boolean(form.formState.errors.body)}>
                <div className="flex items-center justify-between gap-3">
                  <FieldLabel htmlFor="post-body">Body</FieldLabel>
                  <span className="text-xs text-muted-foreground">{body.length}/2000</span>
                </div>
                <Textarea
                  aria-invalid={Boolean(form.formState.errors.body)}
                  className="min-h-28"
                  id="post-body"
                  {...form.register("body")}
                />
                <FieldError errors={[form.formState.errors.body]} />
              </Field>
              <Field data-invalid={Boolean(form.formState.errors.milestone)}>
                <FieldLabel htmlFor="post-milestone">Milestone label</FieldLabel>
                <Input
                  aria-invalid={Boolean(form.formState.errors.milestone)}
                  id="post-milestone"
                  placeholder="Optional, like Build complete"
                  {...form.register("milestone")}
                />
                <FieldError errors={[form.formState.errors.milestone]} />
              </Field>
              <Field data-invalid={Boolean(form.formState.errors.processNote)}>
                <FieldLabel htmlFor="post-process-note">Process note</FieldLabel>
                <Input
                  aria-invalid={Boolean(form.formState.errors.processNote)}
                  id="post-process-note"
                  placeholder="Optional, like 2K satin clear · 24h cure"
                  {...form.register("processNote")}
                />
                <FieldError errors={[form.formState.errors.processNote]} />
              </Field>
              <Field>
                <FieldLabel>Project</FieldLabel>
                <Controller
                  control={form.control}
                  name="project"
                  render={({ field }) => (
                    <Select onValueChange={(value) => field.onChange(value ?? "none")} value={field.value}>
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          {projects.find((item) => item.id === project)?.title ?? "No project"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No project</SelectItem>
                        {projects.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="post-tags">Tags</FieldLabel>
                <Input
                  id="post-tags"
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
                      <Badge key={tag} variant="secondary">
                        {tag}
                        <button
                          aria-label={`Remove ${tag}`}
                          onClick={() =>
                            form.setValue(
                              "tags",
                              tags.filter((item) => item !== tag),
                            )
                          }
                          type="button"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </Field>
            </FieldGroup>
          </div>
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
              Publish
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

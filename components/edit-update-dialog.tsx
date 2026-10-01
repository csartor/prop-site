"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"

import { updatePost } from "@/app/posts/actions"
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
import { Textarea } from "@/components/ui/textarea"
import type { ProjectUpdate } from "@/lib/projects"

const editUpdateSchema = z.object({
  title: z.string().trim().min(1, "Enter a title.").max(120, "Use 120 characters or fewer."),
  body: z
    .string()
    .trim()
    .min(1, "Enter a description.")
    .max(2000, "Use 2000 characters or fewer."),
  milestone: z.string().trim().max(40, "Use 40 characters or fewer."),
  processNote: z.string().trim().max(160, "Use 160 characters or fewer."),
})

type EditUpdateValues = z.infer<typeof editUpdateSchema>

export function EditUpdateDialog({
  update,
  onOpenChange,
}: {
  update: ProjectUpdate | null
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const form = useForm<EditUpdateValues>({
    resolver: zodResolver(editUpdateSchema),
    values: {
      title: update?.title ?? "",
      body: update?.body ?? "",
      milestone: update?.milestone ?? "",
      processNote: update?.processNote ?? "",
    },
  })
  const title = useWatch({ control: form.control, name: "title" }) ?? ""
  const body = useWatch({ control: form.control, name: "body" }) ?? ""

  async function submit(values: EditUpdateValues) {
    if (!update) return
    const formData = new FormData()
    formData.set("title", values.title)
    formData.set("body", values.body)
    formData.set("milestone", values.milestone)
    formData.set("processNote", values.processNote)
    setPending(true)
    setError(null)
    const result = await updatePost(update.id, formData)
    setPending(false)
    if (result.error) {
      setError(result.error)
      return
    }
    onOpenChange(false)
    router.refresh()
  }

  return (
    <Dialog
      open={Boolean(update)}
      onOpenChange={(open) => {
        if (!open) setError(null)
        onOpenChange(open)
      }}
    >
      <DialogContent className="max-h-[calc(100%-2rem)] overflow-y-auto sm:max-w-lg">
        <form className="grid gap-6" onSubmit={form.handleSubmit(submit)}>
          <DialogHeader>
            <DialogTitle className="font-heading text-lg">Edit update</DialogTitle>
            <DialogDescription>Update the milestone, note, and story for this entry.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field data-invalid={Boolean(form.formState.errors.title)}>
              <div className="flex items-center justify-between gap-3">
                <FieldLabel htmlFor="edit-update-title">Title</FieldLabel>
                <span className="text-xs text-muted-foreground">{title.length}/120</span>
              </div>
              <Input
                aria-invalid={Boolean(form.formState.errors.title)}
                id="edit-update-title"
                {...form.register("title")}
              />
              <FieldError errors={[form.formState.errors.title]} />
            </Field>
            <Field data-invalid={Boolean(form.formState.errors.body)}>
              <div className="flex items-center justify-between gap-3">
                <FieldLabel htmlFor="edit-update-body">Body</FieldLabel>
                <span className="text-xs text-muted-foreground">{body.length}/2000</span>
              </div>
              <Textarea
                aria-invalid={Boolean(form.formState.errors.body)}
                className="min-h-28"
                id="edit-update-body"
                {...form.register("body")}
              />
              <FieldError errors={[form.formState.errors.body]} />
            </Field>
            <Field data-invalid={Boolean(form.formState.errors.milestone)}>
              <FieldLabel htmlFor="edit-update-milestone">Milestone label</FieldLabel>
              <Input
                aria-invalid={Boolean(form.formState.errors.milestone)}
                id="edit-update-milestone"
                placeholder="Optional, like Build complete"
                {...form.register("milestone")}
              />
              <FieldError errors={[form.formState.errors.milestone]} />
            </Field>
            <Field data-invalid={Boolean(form.formState.errors.processNote)}>
              <FieldLabel htmlFor="edit-update-process">Process note</FieldLabel>
              <Input
                aria-invalid={Boolean(form.formState.errors.processNote)}
                id="edit-update-process"
                placeholder="Optional, like 2K satin clear · 24h cure"
                {...form.register("processNote")}
              />
              <FieldError errors={[form.formState.errors.processNote]} />
            </Field>
          </FieldGroup>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <Button disabled={pending} onClick={() => onOpenChange(false)} type="button" variant="outline">
              Cancel
            </Button>
            <Button disabled={pending} type="submit">
              Save update
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

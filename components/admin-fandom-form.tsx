"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { createAdminFandom } from "@/app/admin/actions"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

const fandomSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, "Enter a fandom name.")
    .max(100, "Use 100 characters or fewer."),
})

type FandomValues = z.infer<typeof fandomSchema>

export function AdminFandomForm() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const form = useForm<FandomValues>({
    resolver: zodResolver(fandomSchema),
    defaultValues: { label: "" },
  })

  async function submit(values: FandomValues) {
    setSuccessMessage(null)
    try {
      await createAdminFandom(values)
      form.reset({ label: "" })
      setSuccessMessage(`${values.label} was added to the directory.`)
    } catch (error) {
      form.setError("root", {
        message:
          error instanceof Error
            ? error.message
            : "The fandom could not be added. Please try again.",
      })
    }
  }

  return (
    <form className="space-y-6" onSubmit={form.handleSubmit(submit)}>
      <FieldGroup>
        <Field data-invalid={Boolean(form.formState.errors.label)}>
          <FieldLabel htmlFor="fandom-label">Fandom name</FieldLabel>
          <Input
            aria-invalid={Boolean(form.formState.errors.label)}
            id="fandom-label"
            placeholder="Lord of the Rings"
            {...form.register("label")}
          />
          <FieldDescription>
            This name appears in directory filters and maker profiles.
          </FieldDescription>
          <FieldError errors={[form.formState.errors.label]} />
        </Field>
      </FieldGroup>
      <FieldError errors={[form.formState.errors.root]} />
      {successMessage ? (
        <p className="text-sm text-muted-foreground" role="status">
          {successMessage}
        </p>
      ) : null}
      <Button disabled={form.formState.isSubmitting} type="submit">
        {form.formState.isSubmitting ? "Adding…" : "Add fandom"}
      </Button>
    </form>
  )
}

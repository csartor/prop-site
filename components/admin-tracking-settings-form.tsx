"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { updateDirectoryTrackingSettings } from "@/app/admin/actions"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import type { DirectoryUtm } from "@/lib/tracking"

const trackingSchema = z.object({
  utm_source: z
    .string()
    .trim()
    .min(1, "Enter a source.")
    .max(80)
    .regex(/^[A-Za-z0-9._-]+$/, "Use letters, numbers, periods, underscores, or hyphens."),
  utm_medium: z
    .string()
    .trim()
    .min(1, "Enter a medium.")
    .max(80)
    .regex(/^[A-Za-z0-9._-]+$/, "Use letters, numbers, periods, underscores, or hyphens."),
  utm_campaign: z
    .string()
    .trim()
    .min(1, "Enter a campaign.")
    .max(80)
    .regex(/^[A-Za-z0-9._-]+$/, "Use letters, numbers, periods, underscores, or hyphens."),
})

type TrackingValues = z.infer<typeof trackingSchema>

const fields = [
  {
    name: "utm_source" as const,
    label: "Source",
    description: "Identifies MakersForge as the traffic source.",
  },
  {
    name: "utm_medium" as const,
    label: "Medium",
    description: "Identifies the directory as the referral channel.",
  },
  {
    name: "utm_campaign" as const,
    label: "Campaign",
    description: "Groups directory outbound clicks under one campaign.",
  },
]

export function AdminTrackingSettingsForm({
  defaultValues,
}: {
  defaultValues: DirectoryUtm
}) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const form = useForm<TrackingValues>({
    resolver: zodResolver(trackingSchema),
    defaultValues,
  })

  async function submit(values: TrackingValues) {
    setSuccessMessage(null)
    try {
      await updateDirectoryTrackingSettings(values)
      form.reset(values)
      setSuccessMessage("Directory tracking tags saved.")
    } catch {
      form.setError("root", {
        message: "The tracking settings could not be saved. Please try again.",
      })
    }
  }

  return (
    <form className="space-y-6" onSubmit={form.handleSubmit(submit)}>
      <FieldGroup>
        {fields.map(({ name, label, description }) => (
          <Field data-invalid={Boolean(form.formState.errors[name])} key={name}>
            <FieldLabel htmlFor={name}>{label}</FieldLabel>
            <Input
              aria-invalid={Boolean(form.formState.errors[name])}
              id={name}
              {...form.register(name)}
            />
            <FieldDescription>{description}</FieldDescription>
            <FieldError errors={[form.formState.errors[name]]} />
          </Field>
        ))}
      </FieldGroup>
      <FieldError errors={[form.formState.errors.root]} />
      {successMessage ? (
        <p className="text-sm text-muted-foreground" role="status">
          {successMessage}
        </p>
      ) : null}
      <Button disabled={form.formState.isSubmitting} type="submit">
        {form.formState.isSubmitting ? "Saving…" : "Save tracking tags"}
      </Button>
    </form>
  )
}

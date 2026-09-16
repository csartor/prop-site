"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useFieldArray, useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"

const applicationSchema = z.object({
  maker_name: z.string().trim().min(2, "Enter your maker or business name.").max(160),
  location: z.string().trim().min(1, "Enter your location.").max(160),
  contact_email: z.string().trim().email("Enter a valid email address."),
  contact_links: z.string().trim(),
  service_categories: z.string().trim().min(1, "List at least one service category."),
  process_tags: z.string().trim(),
  lead_time_days: z
    .number({ error: "Enter your typical lead time in days." })
    .int()
    .min(1)
    .max(730),
  budget_min_cents: z
    .number({ error: "Enter a minimum budget." })
    .int()
    .min(0),
  budget_max_cents: z
    .number({ error: "Enter a maximum budget." })
    .int()
    .min(0),
  service_regions: z.string().trim().min(1, "List at least one region you serve."),
  declined_jobs: z.string().trim(),
  specialties_notes: z.string().trim(),
  portfolio_links: z.array(
    z.object({
      value: z
        .string()
        .trim()
        .url("Enter a valid portfolio URL.")
        .or(z.literal("")),
    })
  ),
}).superRefine((values, context) => {
  if (values.budget_max_cents < values.budget_min_cents) {
    context.addIssue({
      code: "custom",
      path: ["budget_max_cents"],
      message: "Maximum budget must be at least the minimum budget.",
    })
  }
})

type ApplicationFormValues = z.infer<typeof applicationSchema>

function toList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

function safeFileName(file: File) {
  return file.name.replaceAll(/[^a-zA-Z0-9._-]/g, "-")
}

export function MakerApplicationForm({
  userId,
  email,
}: {
  userId: string
  email: string
}) {
  const router = useRouter()
  const [files, setFiles] = useState<File[]>([])
  const [submitError, setSubmitError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      maker_name: "",
      location: "",
      contact_email: email,
      contact_links: "",
      service_categories: "",
      process_tags: "",
      lead_time_days: 14,
      budget_min_cents: 0,
      budget_max_cents: 0,
      service_regions: "",
      declined_jobs: "",
      specialties_notes: "",
      portfolio_links: [{ value: "" }],
    },
  })
  const portfolioLinks = useFieldArray({
    control: form.control,
    name: "portfolio_links",
  })

  async function onSubmit(values: ApplicationFormValues) {
    const links = values.portfolio_links
      .map((item) => item.value.trim())
      .filter(Boolean)

    if (links.length === 0 && files.length === 0) {
      form.setError("portfolio_links", {
        message: "Add at least one portfolio link or image.",
      })
      return
    }

    const invalidFile = files.find(
      (file) => !file.type.startsWith("image/") || file.size > 10 * 1024 * 1024
    )
    if (invalidFile) {
      setSubmitError("Portfolio uploads must be image files no larger than 10 MB.")
      return
    }

    setIsSubmitting(true)
    setSubmitError("")
    const supabase = createClient()
    const { data: application, error: applicationError } = await supabase
      .from("maker_applications")
      .insert({
        user_id: userId,
        maker_name: values.maker_name.trim(),
        location: values.location.trim(),
        contact_email: values.contact_email.trim(),
        contact_links: toList(values.contact_links),
        service_categories: toList(values.service_categories),
        process_tags: toList(values.process_tags),
        lead_time_days: values.lead_time_days,
        budget_min_cents: Math.round(values.budget_min_cents * 100),
        budget_max_cents: Math.round(values.budget_max_cents * 100),
        service_regions: toList(values.service_regions),
        declined_jobs: values.declined_jobs || null,
        specialties_notes: values.specialties_notes || null,
      })
      .select("id")
      .single()

    if (applicationError || !application) {
      setSubmitError(
        applicationError?.code === "23505"
          ? "You have already submitted an application."
          : applicationError?.message ?? "We couldn't save your application."
      )
      setIsSubmitting(false)
      return
    }

    const uploadedPaths: string[] = []
    try {
      const uploadItems: Array<{ kind: "upload"; value: string }> = []
      for (const file of files) {
        const path = `${userId}/${crypto.randomUUID()}-${safeFileName(file)}`
        const { error } = await supabase.storage
          .from("maker-application-portfolio")
          .upload(path, file, { contentType: file.type })
        if (error) throw error
        uploadedPaths.push(path)
        uploadItems.push({ kind: "upload", value: path })
      }

      const portfolioItems = [
        ...links.map((value) => ({ kind: "url" as const, value })),
        ...uploadItems,
      ].map((item, sort_order) => ({
        maker_application_id: application.id,
        ...item,
        sort_order,
      }))

      const { error: portfolioError } = await supabase
        .from("maker_application_portfolio_items")
        .insert(portfolioItems)
      if (portfolioError) throw portfolioError

      router.push("/apply/status")
      router.refresh()
    } catch (error) {
      await Promise.all(
        uploadedPaths.map((path) =>
          supabase.storage.from("maker-application-portfolio").remove([path])
        )
      )
      await supabase.from("maker_applications").delete().eq("id", application.id)
      setSubmitError(
        error instanceof Error
          ? error.message
          : "We couldn't save your portfolio. Please try again."
      )
      setIsSubmitting(false)
    }
  }

  const errors = form.formState.errors

  return (
    <Card>
      <CardHeader>
        <CardTitle>Maker application</CardTitle>
        <p className="text-sm text-muted-foreground">
          Tell us about the work you take on. Applications are reviewed before
          makers are added to the network.
        </p>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" noValidate onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <div className="grid gap-4 md:grid-cols-2">
              <Field data-invalid={Boolean(errors.maker_name)}>
                <FieldLabel htmlFor="maker_name">Maker or business name</FieldLabel>
                <Input id="maker_name" aria-invalid={Boolean(errors.maker_name)} {...form.register("maker_name")} />
                <FieldError errors={[errors.maker_name]} />
              </Field>
              <Field data-invalid={Boolean(errors.location)}>
                <FieldLabel htmlFor="location">Location</FieldLabel>
                <Input id="location" placeholder="Seattle, WA" aria-invalid={Boolean(errors.location)} {...form.register("location")} />
                <FieldError errors={[errors.location]} />
              </Field>
              <Field data-invalid={Boolean(errors.contact_email)}>
                <FieldLabel htmlFor="contact_email">Contact email</FieldLabel>
                <Input id="contact_email" type="email" aria-invalid={Boolean(errors.contact_email)} {...form.register("contact_email")} />
                <FieldError errors={[errors.contact_email]} />
              </Field>
              <Field data-invalid={Boolean(errors.contact_links)}>
                <FieldLabel htmlFor="contact_links">Contact links</FieldLabel>
                <Input id="contact_links" placeholder="https://instagram.com/..., https://..." aria-invalid={Boolean(errors.contact_links)} {...form.register("contact_links")} />
                <FieldDescription>Separate multiple links with commas.</FieldDescription>
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-invalid={Boolean(errors.service_categories)}>
                <FieldLabel htmlFor="service_categories">Services offered</FieldLabel>
                <Input id="service_categories" placeholder="Props, armor, helmets" aria-invalid={Boolean(errors.service_categories)} {...form.register("service_categories")} />
                <FieldDescription>Separate categories with commas.</FieldDescription>
                <FieldError errors={[errors.service_categories]} />
              </Field>
              <Field data-invalid={Boolean(errors.process_tags)}>
                <FieldLabel htmlFor="process_tags">Materials and processes</FieldLabel>
                <Input id="process_tags" placeholder="FDM printing, EVA foam, painting" aria-invalid={Boolean(errors.process_tags)} {...form.register("process_tags")} />
                <FieldDescription>Separate tags with commas.</FieldDescription>
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Field data-invalid={Boolean(errors.lead_time_days)}>
                <FieldLabel htmlFor="lead_time_days">Average lead time (days)</FieldLabel>
                <Input id="lead_time_days" type="number" min="1" max="730" aria-invalid={Boolean(errors.lead_time_days)} {...form.register("lead_time_days", { valueAsNumber: true })} />
                <FieldError errors={[errors.lead_time_days]} />
              </Field>
              <Field data-invalid={Boolean(errors.budget_min_cents)}>
                <FieldLabel htmlFor="budget_min_cents">Typical minimum budget (USD)</FieldLabel>
                <Input id="budget_min_cents" type="number" min="0" step="1" aria-invalid={Boolean(errors.budget_min_cents)} {...form.register("budget_min_cents", { valueAsNumber: true })} />
                <FieldError errors={[errors.budget_min_cents]} />
              </Field>
              <Field data-invalid={Boolean(errors.budget_max_cents)}>
                <FieldLabel htmlFor="budget_max_cents">Typical maximum budget (USD)</FieldLabel>
                <Input id="budget_max_cents" type="number" min="0" step="1" aria-invalid={Boolean(errors.budget_max_cents)} {...form.register("budget_max_cents", { valueAsNumber: true })} />
                <FieldError errors={[errors.budget_max_cents]} />
              </Field>
            </div>

            <Field data-invalid={Boolean(errors.service_regions)}>
              <FieldLabel htmlFor="service_regions">Regions served</FieldLabel>
              <Input id="service_regions" placeholder="United States, Canada, Pacific Northwest pickup" aria-invalid={Boolean(errors.service_regions)} {...form.register("service_regions")} />
              <FieldDescription>Include shipping regions or pickup areas, separated by commas.</FieldDescription>
              <FieldError errors={[errors.service_regions]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="declined_jobs">Jobs you don&apos;t accept</FieldLabel>
              <Textarea id="declined_jobs" placeholder="For example: no weapons, no rush orders, or no adult content." {...form.register("declined_jobs")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="specialties_notes">Specialties or notes</FieldLabel>
              <Textarea id="specialties_notes" placeholder="Share any relevant specialties, equipment, or constraints." {...form.register("specialties_notes")} />
            </Field>

            <div className="space-y-4 rounded-lg border p-4">
              <div>
                <p className="text-sm font-medium">Portfolio examples</p>
                <p className="text-sm text-muted-foreground">
                  Add at least one public URL or upload image.
                </p>
              </div>
              {portfolioLinks.fields.map((field, index) => (
                <Field key={field.id} data-invalid={Boolean(errors.portfolio_links?.[index]?.value)}>
                  <FieldLabel htmlFor={`portfolio_link_${index}`}>Portfolio URL {index + 1}</FieldLabel>
                  <div className="flex gap-2">
                    <Input id={`portfolio_link_${index}`} type="url" placeholder="https://..." aria-invalid={Boolean(errors.portfolio_links?.[index]?.value)} {...form.register(`portfolio_links.${index}.value`)} />
                    {portfolioLinks.fields.length > 1 ? <Button type="button" variant="outline" onClick={() => portfolioLinks.remove(index)}>Remove</Button> : null}
                  </div>
                  <FieldError errors={[errors.portfolio_links?.[index]?.value]} />
                </Field>
              ))}
              <Button type="button" variant="outline" onClick={() => portfolioLinks.append({ value: "" })}>Add another URL</Button>
              <Field>
                <FieldLabel htmlFor="portfolio_uploads">Portfolio images</FieldLabel>
                <Input id="portfolio_uploads" type="file" accept="image/*" multiple onChange={(event) => setFiles(Array.from(event.target.files ?? []))} />
                <FieldDescription>
                  {files.length ? `${files.length} image${files.length === 1 ? "" : "s"} selected.` : "Images are stored privately for application review."}
                </FieldDescription>
              </Field>
              <FieldError errors={[errors.portfolio_links]} />
            </div>
          </FieldGroup>

          {submitError ? <p className="text-sm text-destructive" role="alert">{submitError}</p> : null}
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? "Submitting application..." : "Submit application"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

"use client"

import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const statuses = ["new", "reviewed", "routed", "quoted", "selected", "lost", "completed"] as const
const filterSchema = z
  .object({
    category: z.string().trim().max(100),
    location: z.string().trim().max(100),
    status: z.enum(["all", ...statuses]),
    min_budget: z.string().regex(/^\d*$/, "Use a whole-dollar amount."),
    max_budget: z.string().regex(/^\d*$/, "Use a whole-dollar amount."),
    deadline: z.string().date().or(z.literal("")),
  })
  .refine(
    ({ min_budget, max_budget }) =>
      !min_budget || !max_budget || Number(min_budget) <= Number(max_budget),
    { message: "Minimum budget cannot exceed maximum budget.", path: ["max_budget"] }
  )

type FilterValues = z.infer<typeof filterSchema>

export function AdminRequestFilters({ defaultValues }: { defaultValues: Partial<FilterValues> }) {
  const router = useRouter()
  const form = useForm<FilterValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: { category: "", location: "", status: "all", min_budget: "", max_budget: "", deadline: "", ...defaultValues },
  })

  function submit(values: FilterValues) {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(values)) {
      if (value && !(key === "status" && value === "all")) params.set(key, value)
    }
    router.push(`/admin/requests${params.size ? `?${params}` : ""}`)
  }

  return (
    <form className="mb-6 grid gap-3 rounded-md border p-4 sm:grid-cols-2 lg:grid-cols-3" noValidate onSubmit={form.handleSubmit(submit)}>
      <Field><FieldLabel htmlFor="category">Category</FieldLabel><Input id="category" placeholder="Cosplay, prop..." {...form.register("category")} /></Field>
      <Field><FieldLabel htmlFor="location">Location</FieldLabel><Input id="location" placeholder="City or region" {...form.register("location")} /></Field>
      <Field><FieldLabel>Lifecycle</FieldLabel><Controller control={form.control} name="status" render={({ field }) => <Select value={field.value} onValueChange={field.onChange}><SelectTrigger><SelectValue placeholder="All statuses" /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{statuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select>} /></Field>
      <Field data-invalid={Boolean(form.formState.errors.min_budget)}><FieldLabel htmlFor="min_budget">Minimum budget ($)</FieldLabel><Input id="min_budget" min="0" type="number" aria-invalid={Boolean(form.formState.errors.min_budget)} {...form.register("min_budget")} /><FieldError errors={[form.formState.errors.min_budget]} /></Field>
      <Field data-invalid={Boolean(form.formState.errors.max_budget)}><FieldLabel htmlFor="max_budget">Maximum budget ($)</FieldLabel><Input id="max_budget" min="0" type="number" aria-invalid={Boolean(form.formState.errors.max_budget)} {...form.register("max_budget")} /><FieldError errors={[form.formState.errors.max_budget]} /></Field>
      <Field data-invalid={Boolean(form.formState.errors.deadline)}><FieldLabel htmlFor="deadline">Due by</FieldLabel><Input id="deadline" type="date" aria-invalid={Boolean(form.formState.errors.deadline)} {...form.register("deadline")} /><FieldError errors={[form.formState.errors.deadline]} /></Field>
      <div className="sm:col-span-2 lg:col-span-3"><Button type="submit">Apply filters</Button></div>
    </form>
  )
}

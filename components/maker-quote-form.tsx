"use client"

import { useRef, useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { saveQuote } from "@/app/maker/actions"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

const formSchema = z.object({
  price_min: z.string().min(1, "Enter a minimum price."),
  price_max: z.string().min(1, "Enter a maximum price."),
  turnaround_days: z.string().min(1, "Enter turnaround time."),
  scope_included: z.string().min(1, "Describe what is included."),
  exclusions: z.string(),
  assumptions: z.string(),
  questions: z.string(),
  shipping_notes: z.string(),
  rush_fee: z.string(),
})

type FormValues = z.infer<typeof formSchema>

export function MakerQuoteForm({
  assignmentId,
  initial,
}: {
  assignmentId: string
  initial: Partial<FormValues> & { status?: string }
}) {
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState("")
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      price_min: initial.price_min ?? "",
      price_max: initial.price_max ?? "",
      turnaround_days: initial.turnaround_days ?? "",
      scope_included: initial.scope_included ?? "",
      exclusions: initial.exclusions ?? "",
      assumptions: initial.assumptions ?? "",
      questions: initial.questions ?? "",
      shipping_notes: initial.shipping_notes ?? "",
      rush_fee: initial.rush_fee ?? "",
    },
  })

  const submit = (values: FormValues, action: "draft" | "submitted" | "revert") => {
    const formData = new FormData()
    Object.entries(values).forEach(([key, value]) => formData.set(key, value))
    formData.set("assignment_id", assignmentId)
    formData.set("quote_action", action)
    setMessage("")
    startTransition(async () => {
      try {
        await saveQuote(formData)
        setMessage(action === "submitted" ? "Quote submitted." : action === "revert" ? "Quote reverted to draft." : "Draft saved.")
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Unable to save quote.")
      }
    })
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit((values) => submit(values, "submitted"))} ref={formRef}>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field><FieldLabel htmlFor="price_min">Minimum price ($)</FieldLabel><Input id="price_min" min="0" step="0.01" type="number" {...register("price_min")} /><FieldError errors={[errors.price_min]} /></Field>
        <Field><FieldLabel htmlFor="price_max">Maximum price ($)</FieldLabel><Input id="price_max" min="0" step="0.01" type="number" {...register("price_max")} /><FieldError errors={[errors.price_max]} /></Field>
        <Field><FieldLabel htmlFor="turnaround_days">Turnaround (days)</FieldLabel><Input id="turnaround_days" min="1" type="number" {...register("turnaround_days")} /><FieldError errors={[errors.turnaround_days]} /></Field>
      </div>
      {([
        ["scope_included", "Scope included", "What work is included in this quote?"],
        ["exclusions", "Exclusions", "What is not included?"],
        ["assumptions", "Assumptions", "What are you assuming about files, measurements, or approvals?"],
        ["questions", "Questions for buyer", "What do you need to clarify?"],
        ["shipping_notes", "Shipping notes", "Shipping method, packaging, or pickup details."],
      ] as const).map(([name, label, placeholder]) => <Field key={name}><FieldLabel htmlFor={name}>{label}</FieldLabel><Textarea id={name} placeholder={placeholder} {...register(name)} /><FieldError errors={[errors[name]]} /></Field>)}
      <Field><FieldLabel htmlFor="rush_fee">Optional rush fee ($)</FieldLabel><Input id="rush_fee" min="0" step="0.01" type="number" {...register("rush_fee")} /></Field>
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
      <div className="flex flex-wrap gap-2">
        <Button disabled={isPending} onClick={handleSubmit((values) => submit(values, "draft"))} type="button" variant="outline">Save draft</Button>
        <Button disabled={isPending} type="submit">Submit quote</Button>
        {initial.status === "submitted" && <Button disabled={isPending} onClick={handleSubmit((values) => submit(values, "revert"))} type="button" variant="ghost">Revert to draft</Button>}
      </div>
    </form>
  )
}

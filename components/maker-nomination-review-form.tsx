"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import { useState } from "react"
import { z } from "zod"

import { updateMakerNominationStatus } from "@/app/admin/actions"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const reviewSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  makerTypeId: z.string().uuid("Select a maker type.").or(z.literal("")),
}).superRefine((values, context) => {
  if (values.status === "approved" && !values.makerTypeId) {
    context.addIssue({
      code: "custom",
      message: "Select a maker type before approving.",
      path: ["makerTypeId"],
    })
  }
})

type ReviewValues = z.infer<typeof reviewSchema>

export function MakerNominationReviewForm({
  id,
  makerTypeOptions,
  makerTypeId,
  status,
}: {
  id: string
  makerTypeOptions: { id: string; label: string }[]
  makerTypeId: string | null
  status: "submitted" | "approved" | "rejected"
}) {
  const form = useForm<ReviewValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      status: status === "rejected" ? "rejected" : "approved",
      makerTypeId: makerTypeId ?? "",
    },
  })
  const selectedStatus = useWatch({ control: form.control, name: "status" })
  const selectedMakerTypeId = useWatch({
    control: form.control,
    name: "makerTypeId",
  })
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  async function submit(values: ReviewValues) {
    setSuccessMessage(null)
    const formData = new FormData()
    formData.set("id", id)
    formData.set("status", values.status)
    if (values.makerTypeId) {
      formData.set("maker_type_option_id", values.makerTypeId)
    }

    try {
      await updateMakerNominationStatus(formData)
      setSuccessMessage(
        values.status === "approved"
          ? "Maker published to the directory."
          : "Maker removed from the directory.",
      )
    } catch {
      form.setError("root", {
        message: "The review could not be saved. Please try again.",
      })
    }
  }

  return (
    <form
      className="flex flex-wrap items-end gap-3"
      onSubmit={form.handleSubmit(submit)}
    >
      <Field className="w-full sm:w-48">
        <FieldLabel htmlFor="nomination-review-status">Decision</FieldLabel>
        <Select
          value={selectedStatus}
          onValueChange={(value) =>
            form.setValue("status", value as ReviewValues["status"], {
              shouldValidate: true,
            })
          }
        >
          <SelectTrigger id="nomination-review-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="approved">Approve</SelectItem>
            <SelectItem value="rejected">Reject</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field className="w-full sm:w-56" data-invalid={Boolean(form.formState.errors.makerTypeId)}>
        <FieldLabel htmlFor="nomination-maker-type">Maker type</FieldLabel>
        <Select
          value={selectedMakerTypeId ?? ""}
          onValueChange={(value) =>
            form.setValue("makerTypeId", value ?? "", { shouldValidate: true })
          }
        >
          <SelectTrigger id="nomination-maker-type">
            <SelectValue placeholder="Select a maker type">
              {makerTypeOptions.find(
                (option) => option.id === selectedMakerTypeId,
              )?.label ?? "Select a maker type"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {makerTypeOptions.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError errors={[form.formState.errors.makerTypeId]} />
      </Field>
      <Button disabled={form.formState.isSubmitting} type="submit">
        {form.formState.isSubmitting ? "Saving…" : "Save decision"}
      </Button>
      <FieldError errors={[form.formState.errors.root]} />
      {successMessage ? (
        <p className="w-full text-sm text-forge-success" role="status">
          {successMessage}
        </p>
      ) : null}
    </form>
  )
}

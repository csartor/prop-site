"use client"

import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { updateBuyerRequestStatus, updateMakerApplicationStatus } from "@/app/admin/actions"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function AdminStatusForm({
  id,
  kind,
  value,
}: {
  id: string
  kind: "request" | "application"
  value: string
}) {
  const action = kind === "request" ? updateBuyerRequestStatus : updateMakerApplicationStatus
  const options = kind === "request"
    ? [["new", "New"], ["in_review", "In review"], ["matched", "Matched"], ["closed", "Closed"]]
    : [["pending", "Pending"], ["approved", "Approved"], ["rejected", "Rejected"], ["needs_follow_up", "Needs follow-up"]]

  const schema = z.object({
    status: z.enum(options.map(([option]) => option) as [string, ...string[]]),
  })
  const form = useForm<{ status: string }>({
    resolver: zodResolver(schema),
    defaultValues: { status: value },
  })

  async function submit({ status }: { status: string }) {
    const formData = new FormData()
    formData.set("id", id)
    formData.set(kind === "request" ? "status" : "review_status", status)
    await action(formData)
  }

  return (
    <form className="flex flex-wrap items-end gap-2" onSubmit={form.handleSubmit(submit)}>
      <input name="id" type="hidden" value={id} />
      <Field>
        <FieldLabel>Review status</FieldLabel>
        <Controller control={form.control} name="status" render={({ field }) => <Select value={field.value} onValueChange={field.onChange}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{options.map(([optionValue, label]) => <SelectItem key={optionValue} value={optionValue}>{label}</SelectItem>)}</SelectContent>
        </Select>} />
      </Field>
      <Button type="submit">Update status</Button>
    </form>
  )
}

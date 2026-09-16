"use client"

import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import {
  addRequestNote,
  assignMakers,
  selectRequestMaker,
  updateRoutingStatus,
} from "@/app/admin/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

const statuses = ["new", "reviewed", "routed", "quoted", "selected", "lost", "completed"]
const routingSchema = z.object({
  routing_status: z.enum(statuses),
  loss_reason: z.string().trim().max(1000),
})
const assignmentSchema = z.object({
  maker_user_ids: z.array(z.string().uuid()).min(1, "Select at least one maker.").max(10),
  quote_deadline: z.string().date().or(z.literal("")),
})
const noteSchema = z.object({ body: z.string().trim().min(1, "Add a note.").max(5000) })

export function RoutingStatusForm({ id, value, lossReason }: { id: string; value: string; lossReason: string | null }) {
  const form = useForm<z.infer<typeof routingSchema>>({
    resolver: zodResolver(routingSchema),
    defaultValues: { routing_status: value as z.infer<typeof routingSchema>["routing_status"], loss_reason: lossReason ?? "" },
  })
  const status = useWatch({ control: form.control, name: "routing_status" })
  async function submit(values: z.infer<typeof routingSchema>) {
    const data = new FormData()
    data.set("id", id)
    data.set("routing_status", values.routing_status)
    data.set("loss_reason", values.loss_reason)
    await updateRoutingStatus(data)
  }
  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-3">
      <input name="id" type="hidden" value={id} />
      <Field><FieldLabel htmlFor="routing_status">Routing status</FieldLabel>
      <Controller control={form.control} name="routing_status" render={({ field }) => <Select value={field.value} onValueChange={field.onChange}>
        <SelectTrigger id="routing_status"><SelectValue /></SelectTrigger>
        <SelectContent>{statuses.map((item) => <SelectItem key={item} value={item}>{item.replaceAll("_", " ")}</SelectItem>)}</SelectContent>
      </Select>} /></Field>
      {status === "lost" && <Field data-invalid={Boolean(form.formState.errors.loss_reason)}><FieldLabel htmlFor="loss_reason">Loss reason</FieldLabel><Input id="loss_reason" aria-invalid={Boolean(form.formState.errors.loss_reason)} placeholder="Why was this request lost?" {...form.register("loss_reason")} /><FieldError errors={[form.formState.errors.loss_reason]} /></Field>}
      <Button type="submit">Save routing status</Button>
    </form>
  )
}

export function AssignmentForm({
  requestId,
  makers,
  assignedMakerIds,
}: {
  requestId: string
  makers: Array<{ user_id: string; display_name: string; location: string | null }>
  assignedMakerIds: string[]
}) {
  const form = useForm<z.infer<typeof assignmentSchema>>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: { maker_user_ids: assignedMakerIds, quote_deadline: "" },
  })
  const selected = useWatch({ control: form.control, name: "maker_user_ids" }) ?? []
  async function submit(values: z.infer<typeof assignmentSchema>) {
    const data = new FormData()
    data.set("request_id", requestId)
    values.maker_user_ids.forEach((makerId) => data.append("maker_user_ids", makerId))
    if (values.quote_deadline) data.set("quote_deadline", values.quote_deadline)
    await assignMakers(data)
  }
  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
      <input name="request_id" type="hidden" value={requestId} />
      <div className="grid gap-2 sm:grid-cols-2">
        {makers.map((maker) => (
          <Field orientation="horizontal" className="items-start rounded-md border p-3 text-sm" key={maker.user_id}>
            <Controller control={form.control} name="maker_user_ids" render={({ field }) => <Checkbox
              checked={selected.includes(maker.user_id)}
              onCheckedChange={(checked) => field.onChange(checked ? [...selected, maker.user_id] : selected.filter((makerId) => makerId !== maker.user_id))}
            />} />
            <FieldLabel><span className="font-medium">{maker.display_name}</span><br /><span className="text-muted-foreground">{maker.location}</span></FieldLabel>
          </Field>
        ))}
      </div>
      <Field data-invalid={Boolean(form.formState.errors.maker_user_ids)}><FieldError errors={[form.formState.errors.maker_user_ids]} /></Field>
      <Field><FieldLabel htmlFor="quote_deadline">Quote deadline</FieldLabel><Input id="quote_deadline" type="date" {...form.register("quote_deadline")} /></Field>
      <Button disabled={selected.length === 0} type="submit">Assign selected makers</Button>
    </form>
  )
}

export function RequestNoteForm({ requestId }: { requestId: string }) {
  const form = useForm<z.infer<typeof noteSchema>>({ resolver: zodResolver(noteSchema), defaultValues: { body: "" } })
  async function submit(values: z.infer<typeof noteSchema>) {
    const data = new FormData()
    data.set("request_id", requestId)
    data.set("body", values.body)
    await addRequestNote(data)
    form.reset()
  }
  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-3">
      <input name="request_id" type="hidden" value={requestId} />
      <Field data-invalid={Boolean(form.formState.errors.body)}><FieldLabel htmlFor="body">Private note</FieldLabel><Textarea id="body" aria-invalid={Boolean(form.formState.errors.body)} placeholder="Add a private note for the team..." {...form.register("body")} /><FieldError errors={[form.formState.errors.body]} /></Field>
      <Button type="submit" variant="outline">Add private note</Button>
    </form>
  )
}

export function SelectMakerForm({ requestId, makerUserId }: { requestId: string; makerUserId: string }) {
  return (
    <form action={selectRequestMaker}>
      <input name="request_id" type="hidden" value={requestId} />
      <input name="maker_user_id" type="hidden" value={makerUserId} />
      <Button size="sm" type="submit">Select maker</Button>
    </form>
  )
}

export function RoutingPanels({
  requestId,
  status,
  lossReason,
  makers,
  assignedMakerIds,
}: {
  requestId: string
  status: string
  lossReason: string | null
  makers: Array<{ user_id: string; display_name: string; location: string | null }>
  assignedMakerIds: string[]
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card><CardHeader><CardTitle>Routing status</CardTitle></CardHeader><CardContent><RoutingStatusForm id={requestId} lossReason={lossReason} value={status} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Assign makers</CardTitle></CardHeader><CardContent><AssignmentForm assignedMakerIds={assignedMakerIds} makers={makers} requestId={requestId} /></CardContent></Card>
    </div>
  )
}

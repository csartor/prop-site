"use client"

import Image from "next/image"
import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import {
  fetchCampaignDebug,
  type CampaignDebugResult,
} from "@/app/debug/patreon/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { stripHtml } from "@/lib/text"

const schema = z.object({
  campaignId: z.string().trim().regex(/^\d+$/, "Enter a numeric Patreon campaign ID."),
})

function value(value: unknown) {
  if (value === null || value === undefined || value === "") return "Not reported"
  if (typeof value === "boolean") return value ? "Yes" : "No"
  if (typeof value === "string") return stripHtml(value) ?? "Not reported"
  return String(value)
}

function DebugField({ label, value: fieldValue }: { label: string; value: unknown }) {
  return (
    <div className="grid gap-1 border-b border-border/60 pb-2 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="wrap-break-word text-sm">{value(fieldValue)}</span>
    </div>
  )
}

export function PatreonCampaignDebugger() {
  const [result, setResult] = useState<CampaignDebugResult | null>(null)
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { campaignId: "" },
  })
  const isError = result && "error" in result

  async function submit({ campaignId }: z.infer<typeof schema>) {
    setResult(await fetchCampaignDebug(campaignId))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Campaign lookup</CardTitle>
        </CardHeader>
        <CardContent>
          <form noValidate onSubmit={form.handleSubmit(submit)}>
            <FieldGroup className="sm:flex-row sm:items-end">
              <Field data-invalid={Boolean(form.formState.errors.campaignId)}>
                <FieldLabel htmlFor="campaign-id">Patreon campaign ID</FieldLabel>
                <Input id="campaign-id" placeholder="3226160" aria-invalid={Boolean(form.formState.errors.campaignId)} {...form.register("campaignId")} />
                <FieldError errors={[form.formState.errors.campaignId]} />
              </Field>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Loading…" : "Fetch campaign"}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      {isError ? <Card><CardContent className="p-5 text-sm text-destructive">{result.error}</CardContent></Card> : null}
      {result && !isError ? (
        <Tabs defaultValue="summary">
          <TabsList>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="posts">Posts ({result.posts.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="summary" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>{value(result.campaign.attributes.name ?? result.campaign.attributes.creation_name)}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-5 md:grid-cols-[240px_1fr]">
                {typeof result.campaign.attributes.image_url === "string" ? <Image src={result.campaign.attributes.image_url} alt="" width={240} height={180} className="h-44 w-full rounded-md object-cover" /> : <div className="h-44 rounded-md bg-muted" />}
                <div className="grid gap-3"><DebugField label="Campaign ID" value={result.campaign.id} /><DebugField label="Description" value={result.campaign.attributes.summary} /><DebugField label="Pledge URL" value={result.campaign.attributes.pledge_url} /><DebugField label="Monthly" value={result.campaign.attributes.is_monthly} /><DebugField label="Patron count" value={result.campaign.attributes.patron_count} /></div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="posts" className="mt-4">
            <div className="space-y-4">
              {result.posts.length ? result.posts.map((post) => <Card key={post.id}><CardHeader><CardTitle>{value(post.attributes.title)}</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><DebugField label="Post ID" value={post.id} /><DebugField label="Published" value={post.attributes.currently_published_at ?? post.attributes.published_at} /><DebugField label="Public" value={post.attributes.is_public} /><DebugField label="URL" value={post.attributes.url} /><p className="whitespace-pre-wrap text-muted-foreground">{value(post.attributes.content)}</p></CardContent></Card>) : <Card><CardContent className="p-5 text-sm text-muted-foreground">No posts were returned for this campaign.</CardContent></Card>}
            </div>
          </TabsContent>
        </Tabs>
      ) : null}
    </div>
  )
}

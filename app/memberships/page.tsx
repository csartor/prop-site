import { redirect } from "next/navigation"
import type { ReactNode } from "react"
import Image from "next/image"

import { SignOutButton } from "@/components/sign-out-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { stripHtml } from "@/lib/text"

type Membership = {
  id: number
  patreon_membership_id: string
  campaign_id: string
  campaign_name: string | null
  campaign_description: string | null
  campaign_is_monthly: boolean | null
  campaign_pledge_url: string | null
  tier_name: string | null
  tier_description: string | null
  tier_amount_cents: number | null
  patron_status: string | null
  is_paid: boolean
  entitled_amount_cents: number | null
  last_charge_date: string | null
  last_charge_status: string | null
  lifetime_support_cents: number | null
  is_follower: boolean | null
  campaign_details: Record<string, unknown> | null
  synced_at: string
}

function formatStatus(status: string | null) {
  if (!status) return "Unknown status"
  return status.replaceAll("_", " ")
}

function formatAmount(amount: number | null) {
  return amount === null
    ? "No amount reported"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount / 100)
}

function formatCampaignValue(value: unknown) {
  if (value === null || value === undefined) return null
  if (typeof value === "boolean") return value ? "Yes" : "No"
  if (typeof value === "number") return value.toLocaleString()
  if (typeof value === "string") return stripHtml(value)
  return JSON.stringify(value)
}

function getCampaignImage(details: Record<string, unknown> | null) {
  if (typeof details?.image_url === "string") return details.image_url
  if (typeof details?.image_small_url === "string") {
    return details.image_small_url
  }
  return null
}

function getCampaignVideo(details: Record<string, unknown> | null) {
  if (typeof details?.main_video_url === "string") {
    return details.main_video_url || null
  }
  return null
}

function DebugField({
  field,
  label,
  value,
}: {
  field: string
  label: string
  value: ReactNode
}) {
  return (
    <div className="grid min-w-0 gap-1 border-b border-border/60 pb-2 last:border-0">
      <div className="flex min-w-0 items-baseline justify-between gap-3">
        <span className="text-muted-foreground">{label}</span>
        <code className="min-w-0 break-all text-right text-[10px] text-muted-foreground">
          {field}
        </code>
      </div>
      <div className="min-w-0 wrap-break-word text-right">
        {value ?? "Not reported"}
      </div>
    </div>
  )
}

export default async function MembershipsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data, error } = await supabase
    .from("patreon_memberships")
    .select(
      "id, patreon_membership_id, campaign_id, campaign_name, campaign_description, campaign_is_monthly, campaign_pledge_url, tier_name, tier_description, tier_amount_cents, patron_status, is_paid, entitled_amount_cents, last_charge_date, last_charge_status, lifetime_support_cents, is_follower, campaign_details, synced_at"
    )
    .order("campaign_name", { ascending: true })

  const memberships = (data ?? []) as Membership[]
  const lastSyncedAt = memberships[0]?.synced_at

  return (
    <main className="min-h-svh bg-muted/30">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10 md:px-10">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Patreon account
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Your memberships
            </h1>
            <p className="mt-2 text-muted-foreground">
              {user.email ?? "Signed-in user"} ·{" "}
              {lastSyncedAt
                ? `Synced ${new Date(lastSyncedAt).toLocaleString()}`
                : "No memberships found"}
            </p>
          </div>
          <SignOutButton />
        </header>

        {error ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-destructive">
                We couldn&apos;t load your membership snapshot. Please try
                signing in again.
              </p>
            </CardContent>
          </Card>
        ) : memberships.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No memberships found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                We didn&apos;t find any Patreon memberships for this account.
              </p>
            </CardContent>
          </Card>
        ) : (
          <section className="grid min-w-0 gap-4 xl:grid-cols-2">
            {memberships.map((membership) => (
              <Card key={membership.id} className="min-w-0">
                <CardHeader>
                  <CardTitle>
                    {membership.campaign_name ??
                      `Campaign ${membership.campaign_id}`}
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid min-w-0 gap-3 text-sm">
                  {getCampaignImage(membership.campaign_details) ? (
                    <Image
                      src={getCampaignImage(membership.campaign_details)!}
                      alt={
                        membership.campaign_name
                          ? `${membership.campaign_name} campaign`
                          : "Patreon campaign"
                      }
                      width={640}
                      height={360}
                      className="h-auto max-h-64 w-full rounded-md object-cover"
                    />
                  ) : null}
                  {getCampaignVideo(membership.campaign_details) ? (
                    <video
                      controls
                      preload="metadata"
                      playsInline
                      className="aspect-video w-full rounded-md bg-black object-contain"
                      aria-label={`${membership.campaign_name ?? "Campaign"} video`}
                    >
                      <source
                        src={getCampaignVideo(membership.campaign_details)!}
                      />
                      Your browser does not support embedded video.
                    </video>
                  ) : null}
                  <DebugField
                    field="member.id"
                    label="Patreon membership ID"
                    value={membership.patreon_membership_id}
                  />
                  <DebugField
                    field="member.relationships.campaign.data.id"
                    label="Campaign ID"
                    value={membership.campaign_id}
                  />
                  <DebugField
                    field="campaign.attributes.creation_name"
                    label="Campaign name"
                    value={membership.campaign_name}
                  />
                  <DebugField
                    field="campaign.attributes.summary"
                    label="Campaign description"
                    value={stripHtml(membership.campaign_description)}
                  />
                  <DebugField
                    field="campaign.attributes.is_monthly"
                    label="Monthly campaign"
                    value={
                      membership.campaign_is_monthly === null
                        ? null
                        : membership.campaign_is_monthly
                          ? "Yes"
                          : "No"
                    }
                  />
                  <DebugField
                    field="campaign.attributes.pledge_url"
                    label="Campaign pledge URL"
                    value={membership.campaign_pledge_url}
                  />
                  <DebugField
                    field="tier.attributes.title"
                    label="Tier name"
                    value={membership.tier_name}
                  />
                  <DebugField
                    field="tier.attributes.description"
                    label="Tier description"
                    value={stripHtml(membership.tier_description)}
                  />
                  <DebugField
                    field="tier.attributes.amount_cents"
                    label="Tier amount"
                    value={formatAmount(membership.tier_amount_cents)}
                  />
                  <DebugField
                    field="member.attributes.patron_status"
                    label="Patron status"
                    value={formatStatus(membership.patron_status)}
                  />
                  <DebugField
                    field="derived.is_paid"
                    label="Paid"
                    value={membership.is_paid ? "Yes" : "No"}
                  />
                  <DebugField
                    field="member.attributes.last_charge_status"
                    label="Last charge status"
                    value={membership.last_charge_status}
                  />
                  <DebugField
                    field="member.attributes.last_charge_date"
                    label="Last charge date"
                    value={
                      membership.last_charge_date
                        ? new Date(
                            membership.last_charge_date
                          ).toLocaleDateString()
                        : null
                    }
                  />
                  <DebugField
                    field="member.attributes.currently_entitled_amount_cents"
                    label="Entitled amount"
                    value={formatAmount(membership.entitled_amount_cents)}
                  />
                  <DebugField
                    field="member.attributes.lifetime_support_cents"
                    label="Lifetime support"
                    value={formatAmount(membership.lifetime_support_cents)}
                  />
                  <DebugField
                    field="member.attributes.is_follower"
                    label="Follower"
                    value={
                      membership.is_follower === null
                        ? null
                        : membership.is_follower
                          ? "Yes"
                          : "No"
                    }
                  />
                  {membership.campaign_details ? (
                    <div className="mt-2 grid gap-3 border-t border-border pt-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Campaign endpoint fields
                      </p>
                      {Object.entries(membership.campaign_details).map(
                        ([field, value]) => (
                          <DebugField
                            key={field}
                            field={`campaign.attributes.${field}`}
                            label={field}
                            value={formatCampaignValue(value)}
                          />
                        )
                      )}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </section>
        )}
      </div>
    </main>
  )
}

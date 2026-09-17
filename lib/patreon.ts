import { stripHtml } from "@/lib/text"

const PATREON_API_URL = "https://www.patreon.com/api/oauth2/v2/identity"
const PATREON_CAMPAIGNS_URL =
  "https://www.patreon.com/api/oauth2/v2/campaigns"
const PATREON_USER_AGENT = "MakersForge - Patreon Campaign Debugger"
const CAMPAIGN_FIELDS =
  "created_at,name,creation_name,currency,discord_server_id,image_small_url,image_url,is_charged_immediately,is_eligible_for_live,is_monthly,is_nsfw,main_video_embed,main_video_url,one_liner,patron_count,pay_per_name,pledge_url,published_at,rss_artwork_url,rss_feed_title,summary,thanks_embed,thanks_msg,thanks_video_url,has_rss,has_sent_rss_notify,google_analytics_id"

type PatreonResource = {
  id: string
  type: string
  attributes?: Record<string, unknown>
  relationships?: Record<
    string,
    { data?: { id: string; type: string } | { id: string; type: string }[] }
  >
}

type PatreonIdentityResponse = {
  included?: PatreonResource[]
}

export type PatreonMembershipSnapshot = {
  patreon_membership_id: string
  campaign_id: string
  campaign_name: string | null
  campaign_description: string | null
  campaign_is_monthly: boolean | null
  campaign_pledge_url: string | null
  tier_name: string | null
  tier_description: string | null
  patron_status: string | null
  is_paid: boolean
  entitled_amount_cents: number | null
  tier_amount_cents: number | null
  last_charge_date: string | null
  last_charge_status: string | null
  lifetime_support_cents: number | null
  is_follower: boolean | null
  campaign_details: Record<string, unknown> | null
}

export type PatreonCampaignDebug = {
  campaign: {
    id: string
    attributes: Record<string, unknown>
  }
  posts: Array<{
    id: string
    attributes: Record<string, unknown>
  }>
}

export type PatreonCampaign = {
  id: string
  attributes: Record<string, unknown>
}

function getRelationshipId(
  resource: PatreonResource,
  relationship: string
) {
  const data = resource.relationships?.[relationship]?.data

  if (Array.isArray(data)) {
    return data[0]?.id ?? null
  }

  return data?.id ?? null
}

function getRelationshipIds(resource: PatreonResource, relationship: string) {
  const data = resource.relationships?.[relationship]?.data

  return Array.isArray(data) ? data.map((item) => item.id) : data ? [data.id] : []
}

function getString(attributes: Record<string, unknown>, key: string) {
  const value = attributes[key]
  return typeof value === "string" ? value : null
}

function getNumber(attributes: Record<string, unknown>, key: string) {
  const value = attributes[key]
  return typeof value === "number" ? value : null
}

function getBoolean(attributes: Record<string, unknown>, key: string) {
  const value = attributes[key]
  return typeof value === "boolean" ? value : null
}

async function getPatreonCampaignDetails(
  accessToken: string,
  campaignId: string
) {
  const params = new URLSearchParams({
    "fields[campaign]": CAMPAIGN_FIELDS,
  })
  const response = await fetch(
    `${PATREON_CAMPAIGNS_URL}/${encodeURIComponent(campaignId)}?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "User-Agent": PATREON_USER_AGENT,
      },
      cache: "no-store",
    }
  )

  if (!response.ok) return null

  const payload = (await response.json()) as { data?: PatreonResource }
  return payload.data?.attributes ?? null
}

export async function getPatreonCampaign(
  accessToken: string,
  campaignId: string,
): Promise<PatreonCampaign> {
  const params = new URLSearchParams({
    "fields[campaign]": CAMPAIGN_FIELDS,
  })
  const response = await fetch(
    `${PATREON_CAMPAIGNS_URL}/${encodeURIComponent(campaignId)}?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "User-Agent": PATREON_USER_AGENT,
      },
      cache: "no-store",
    },
  )

  if (!response.ok) {
    throw new Error(`Patreon API returned ${response.status}`)
  }

  const payload = (await response.json()) as { data?: PatreonResource }
  if (!payload.data?.id) {
    throw new Error("Patreon did not return the requested campaign.")
  }

  return {
    id: payload.data.id,
    attributes: payload.data.attributes ?? {},
  }
}

export async function getPatreonMemberships(accessToken: string) {
  const params = new URLSearchParams({
    include: "memberships.campaign,memberships.currently_entitled_tiers",
    "fields[member]":
      "patron_status,last_charge_status,last_charge_date,lifetime_support_cents,currently_entitled_amount_cents,is_follower",
    "fields[campaign]": "name,creation_name,summary,is_monthly,pledge_url",
    "fields[tier]": "title,description,amount_cents",
  })

  const response = await fetch(`${PATREON_API_URL}?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      "User-Agent": PATREON_USER_AGENT,
    },
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`Patreon API returned ${response.status}`)
  }

  const payload = (await response.json()) as PatreonIdentityResponse
  const resources = payload.included ?? []
  const resourceByKey = new Map(
    resources.map((resource) => [`${resource.type}:${resource.id}`, resource])
  )

  const membershipSnapshots = resources
    .filter((resource) => resource.type === "member")
    .map((membership) => {
      const membershipAttributes = membership.attributes ?? {}
      const campaignId = getRelationshipId(membership, "campaign") ?? ""
      const campaign = resourceByKey.get(`campaign:${campaignId}`)
      const tierIds = getRelationshipIds(membership, "currently_entitled_tiers")
      const tiers = tierIds
        .map((tierId) => resourceByKey.get(`tier:${tierId}`))
        .filter((tier): tier is PatreonResource => Boolean(tier))
      const tierAttributes = tiers[0]?.attributes ?? {}
      const entitledAmount = getNumber(
        membershipAttributes,
        "currently_entitled_amount_cents"
      )
      const lastChargeStatus = getString(
        membershipAttributes,
        "last_charge_status"
      )
      const patronStatus = getString(membershipAttributes, "patron_status")

      return {
        patreon_membership_id: membership.id,
        campaign_id: campaignId,
        campaign_name: campaign
          ? getString(campaign.attributes ?? {}, "name") ??
            getString(campaign.attributes ?? {}, "creation_name")
          : null,
        campaign_description: campaign
          ? stripHtml(getString(campaign.attributes ?? {}, "summary"))
          : null,
        campaign_is_monthly: campaign
          ? getBoolean(campaign.attributes ?? {}, "is_monthly")
          : null,
        campaign_pledge_url: campaign
          ? getString(campaign.attributes ?? {}, "pledge_url")
          : null,
        tier_name:
          tiers
            .map((tier) => getString(tier.attributes ?? {}, "title"))
            .filter((title): title is string => Boolean(title))
            .join(", ") || null,
        tier_description: stripHtml(getString(tierAttributes, "description")),
        patron_status: patronStatus,
        is_paid:
          lastChargeStatus?.toLowerCase() === "paid" ||
          (patronStatus === "active_patron" && (entitledAmount ?? 0) > 0),
        entitled_amount_cents: entitledAmount,
        tier_amount_cents: getNumber(tierAttributes, "amount_cents"),
        last_charge_date: getString(membershipAttributes, "last_charge_date"),
        last_charge_status: lastChargeStatus,
        lifetime_support_cents: getNumber(
          membershipAttributes,
          "lifetime_support_cents"
        ),
        is_follower: getBoolean(membershipAttributes, "is_follower"),
        campaign_details: null,
      } satisfies PatreonMembershipSnapshot
    })

  const campaignIds = [
    ...new Set(
      membershipSnapshots
        .map((membership) => membership.campaign_id)
        .filter(Boolean)
    ),
  ]
  const campaignDetails = new Map<string, Record<string, unknown>>()

  await Promise.all(
    campaignIds.map(async (campaignId) => {
      const details = await getPatreonCampaignDetails(accessToken, campaignId)
      if (details) campaignDetails.set(campaignId, details)
    })
  )

  return membershipSnapshots.map((membership) => {
    const details = campaignDetails.get(membership.campaign_id)

    return {
      ...membership,
      campaign_name:
        membership.campaign_name ??
        (details
          ? getString(details, "name") ?? getString(details, "creation_name")
          : null),
      campaign_description:
        membership.campaign_description ??
        (details ? stripHtml(getString(details, "summary")) : null),
      campaign_is_monthly:
        membership.campaign_is_monthly ??
        (details ? getBoolean(details, "is_monthly") : null),
      campaign_pledge_url:
        membership.campaign_pledge_url ??
        (details ? getString(details, "pledge_url") : null),
      campaign_details: details ?? null,
    }
  })
}

export async function getPatreonCampaignDebug(
  accessToken: string,
  campaignId: string
): Promise<PatreonCampaignDebug> {
  const campaignParams = new URLSearchParams({
    "fields[campaign]": CAMPAIGN_FIELDS,
  })
  const postParams = new URLSearchParams({
    "page[count]": "10",
    "fields[post]": "content,embed_url,is_public,published_at,title,url",
  })
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json",
    "User-Agent": PATREON_USER_AGENT,
  }
  const campaignUrl = `${PATREON_CAMPAIGNS_URL}/${encodeURIComponent(campaignId)}?${campaignParams}`
  const postsUrl = `${PATREON_CAMPAIGNS_URL}/${encodeURIComponent(campaignId)}/posts?${postParams}`
  const [campaignResponse, postsResponse] = await Promise.all([
    fetch(campaignUrl, { headers, cache: "no-store" }),
    fetch(postsUrl, { headers, cache: "no-store" }),
  ])

  if (!campaignResponse.ok || !postsResponse.ok) {
    const status = !campaignResponse.ok
      ? campaignResponse.status
      : postsResponse.status
    throw new Error(`Patreon API returned ${status}`)
  }

  const campaignPayload = (await campaignResponse.json()) as {
    data?: PatreonResource
  }
  const postsPayload = (await postsResponse.json()) as {
    data?: PatreonResource[]
  }
  if (!campaignPayload.data?.id) {
    throw new Error("Patreon did not return the requested campaign.")
  }

  return {
    campaign: {
      id: campaignPayload.data.id,
      attributes: campaignPayload.data.attributes ?? {},
    },
    posts: (postsPayload.data ?? []).slice(0, 10).map((post) => ({
      id: post.id,
      attributes: post.attributes ?? {},
    })),
  }
}

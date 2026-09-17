import { notFound } from "next/navigation"

import { MakerNominationReviewForm } from "@/components/maker-nomination-review-form"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireAdmin } from "@/lib/admin"

function socialLinks(nomination: {
  website_url: string | null
  instagram_url: string | null
  patreon_url: string | null
  facebook_url: string | null
}) {
  return [
    ["Website", nomination.website_url],
    ["Instagram", nomination.instagram_url],
    ["Patreon", nomination.patreon_url],
    ["Facebook", nomination.facebook_url],
  ].filter(([, href]) => Boolean(href)) as [string, string][]
}

export default async function AdminMakerApplicationDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { supabase } = await requireAdmin()
  const { data: nomination, error } = await supabase
    .from("maker_nominations")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!nomination || nomination.status === "draft") notFound()

  const [
    { data: nominationFandoms },
    { data: makerTypes },
    { data: maker },
  ] = await Promise.all([
    supabase
      .from("maker_nomination_fandoms")
      .select("filter_option_id")
      .eq("nomination_id", id),
    supabase
      .from("maker_filter_options")
      .select("id, label")
      .eq("category", "maker_type")
      .eq("enabled", true)
      .order("sort_order"),
    supabase
      .from("makers")
      .select("maker_type_option_id")
      .eq("nomination_id", id)
      .maybeSingle(),
  ])
  const fandomIds = nominationFandoms?.map((item) => item.filter_option_id) ?? []
  const { data: fandoms } = fandomIds.length
    ? await supabase
        .from("maker_filter_options")
        .select("label")
        .in("id", fandomIds)
        .order("label")
    : { data: [] as { label: string }[] }
  const { data: thumbnail } = nomination.thumbnail_path
    ? await supabase.storage
        .from("maker-nomination-assets")
        .createSignedUrl(nomination.thumbnail_path, 60 * 10)
    : { data: null }
  const links = socialLinks(nomination)

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Directory submission</p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {nomination.maker_name}
          </h1>
        </div>
        <Badge variant="secondary">{nomination.status}</Badge>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Maker details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Descriptor</p>
                <p className="font-medium">{nomination.descriptor}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Location</p>
                <p className="font-medium">{nomination.location}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Contact email</p>
                <p className="font-medium">{nomination.contact_email}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Commissions</p>
                <p className="font-medium">
                  {nomination.accepting_commissions ? "Accepting" : "Not accepting"}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-muted-foreground">Description</p>
                <p className="mt-1 whitespace-pre-wrap">{nomination.description}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-muted-foreground">Fandoms</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {fandoms?.length ? (
                    fandoms.map((fandom) => (
                      <Badge key={fandom.label} variant="outline">
                        {fandom.label}
                      </Badge>
                    ))
                  ) : (
                    <span>No fandoms selected</span>
                  )}
                </div>
              </div>
              {links.length ? (
                <div className="sm:col-span-2">
                  <p className="text-muted-foreground">Links</p>
                  <div className="mt-2 flex flex-wrap gap-3">
                    {links.map(([label, href]) => (
                      <a
                        className="font-medium underline underline-offset-4"
                        href={href}
                        key={label}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {label}
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Review</CardTitle>
            </CardHeader>
            <CardContent>
              <MakerNominationReviewForm
                id={nomination.id}
                makerTypeId={maker?.maker_type_option_id ?? null}
                makerTypeOptions={makerTypes ?? []}
                status={nomination.status}
              />
            </CardContent>
          </Card>
          {thumbnail?.signedUrl ? (
            <Card>
              <CardHeader>
                <CardTitle>Thumbnail</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Signed private storage URLs are intentionally rendered directly. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={`${nomination.maker_name} submission thumbnail`}
                  className="aspect-square w-full rounded-md object-cover"
                  src={thumbnail.signedUrl}
                />
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  )
}

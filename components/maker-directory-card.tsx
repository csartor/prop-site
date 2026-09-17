"use client"

import {
  FacebookLogoIcon,
  GlobeIcon,
  InstagramLogoIcon,
  PatreonLogoIcon,
} from "@phosphor-icons/react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { type DirectoryUtm, withDirectoryUtm } from "@/lib/tracking"

type MakerDirectoryCardProps = {
  maker: {
    display_name: string
    descriptor: string
    description: string
    accepting_commissions: boolean
    makerType: string | null
    thumbnailUrl: string | null
    website_url: string | null
    instagram_url: string | null
    patreon_url: string | null
    facebook_url: string | null
  }
  fandoms: string[]
  utm: DirectoryUtm
}

export function MakerDirectoryCard({
  maker,
  fandoms,
  utm,
}: MakerDirectoryCardProps) {
  const links = [
    { label: "Website", href: maker.website_url, content: "website", icon: GlobeIcon },
    { label: "Instagram", href: maker.instagram_url, content: "instagram", icon: InstagramLogoIcon },
    { label: "Patreon", href: maker.patreon_url, content: "patreon", icon: PatreonLogoIcon },
    { label: "Facebook", href: maker.facebook_url, content: "facebook", icon: FacebookLogoIcon },
  ].filter((link): link is {
    label: string
    href: string
    content: string
    icon: typeof GlobeIcon
  } => Boolean(link.href))

  return (
    <Card className="border-white/10 bg-forge-surface py-0 text-forge-ink">
      <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
        {maker.thumbnailUrl ? (
          <>
            {/* Public storage URLs are data-driven; image optimization is not required. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt=""
              className="size-20 shrink-0 rounded-xl object-cover"
              src={maker.thumbnailUrl}
            />
          </>
        ) : (
          <div className="size-20 shrink-0 rounded-xl bg-forge-panel" />
        )}
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h2 className="font-heading text-lg font-bold">
                {maker.display_name}
              </h2>
              <span className="text-xl text-forge-muted">·</span>
              <p className="text-sm text-forge-muted">
                {maker.makerType ?? maker.descriptor}
              </p>
            </div>
            {maker.accepting_commissions ? (
              <p className="flex items-center gap-2 text-xs font-semibold text-forge-success">
                <span className="size-1.5 rounded-full bg-forge-success" />
                Open for commissions
              </p>
            ) : null}
          </div>
          <p className="text-sm leading-6 text-forge-muted">
            {maker.description}
          </p>
          <p className="font-heading text-[11px] font-medium uppercase text-forge-muted">
            Fandoms
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {fandoms.slice(0, 3).map((fandom) => (
              <Badge
                className="bg-forge-panel px-3 py-1 text-xs font-medium text-forge-muted"
                key={fandom}
                variant="secondary"
              >
                {fandom}
              </Badge>
            ))}
            {fandoms.length > 3 ? (
              <span className="px-2 text-xs text-forge-muted">
                +{fandoms.length - 3} more
              </span>
            ) : null}
          </div>
        </div>
        {links.length ? (
          <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
            {links.map(({ label, href, content, icon: Icon }) => (
              <Button
                key={label}
                nativeButton={false}
                render={
                  <a
                    href={withDirectoryUtm(href, content, utm)}
                    rel="noreferrer"
                    target="_blank"
                  />
                }
                size="sm"
                variant="outline"
              >
                <Icon />
                {label}
              </Button>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

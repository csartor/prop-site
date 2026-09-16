import Image from "next/image"
import { notFound } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"

/* eslint-disable @next/next/no-img-element */

const buildImages = [
  "/makersforge/build-progress.png",
  "/makersforge/build-helmet.png",
  "/makersforge/build-rifle.png",
]

function socialUrl(prefix: string, handle: string | null) {
  if (!handle) return null
  return `${prefix}/${handle.replace(/^@/, "")}`
}

export default async function MakerProfile({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .eq("visibility", "public")
    .not("published_at", "is", null)
    .maybeSingle()

  if (!profile) notFound()

  const links = [
    ["X", socialUrl("https://x.com", profile.twitter_handle)],
    ["Instagram", socialUrl("https://instagram.com", profile.instagram_handle)],
    ["GitHub", socialUrl("https://github.com", profile.github_handle)],
    ["Website", profile.website_url],
    ["YouTube", profile.youtube_url],
  ].filter((item): item is [string, string] => Boolean(item[1]))

  return (
    <main className="min-h-svh bg-background">
      <section className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[360px_1fr]">
        <Card className="overflow-hidden self-start">
          <div className="relative aspect-square bg-muted">
            {profile.avatar_url ? (
              <img
                alt=""
                className="size-full object-cover"
                src={profile.avatar_url}
              />
            ) : (
              <Image
                src="/makersforge/profile-hero.png"
                alt=""
                fill
                className="object-cover"
              />
            )}
            <Badge className="absolute left-4 top-4 bg-forge-orange text-black">
              Featured maker
            </Badge>
          </div>
          <CardContent className="p-5">
            <p className="font-medium">Maker identity</p>
            <p className="text-sm text-forge-orange">@{profile.username}</p>
          </CardContent>
        </Card>
        <div className="space-y-6">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge>Maker</Badge>
              {profile.accepting_commissions ? (
                <Badge variant="secondary">Creator</Badge>
              ) : null}
            </div>
            <h1 className="mt-4 font-heading text-4xl font-bold sm:text-5xl">
              {profile.display_name}
            </h1>
            <p className="mt-4 max-w-2xl text-muted-foreground">
              {profile.bio || "A maker building practical things for the forge."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button>Follow</Button>
              {links.map(([name, href]) => (
                <a
                  className={cn(
                    buttonVariants({ variant: "secondary", size: "sm" })
                  )}
                  href={href}
                  key={name}
                  rel="noreferrer"
                  target="_blank"
                >
                  {name}
                </a>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="border-forge-orange/30"><CardContent className="p-5"><p className="text-xs uppercase text-forge-orange">In progress builds</p><p className="mt-2 text-3xl font-bold">3 Builds</p><p className="text-sm text-forge-success">1 needs attention</p></CardContent></Card>
            <Card><CardContent className="p-5"><p className="text-xs uppercase text-muted-foreground">Completed builds</p><p className="mt-2 text-3xl font-bold">14 Projects</p><p className="text-sm text-forge-success">4 active guides</p></CardContent></Card>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-6 pb-16 lg:grid-cols-[1fr_320px]">
        <div className="space-y-10">
          <div>
            <h2 className="font-heading text-2xl font-bold">In Progress Builds</h2>
            <Card className="mt-4"><CardContent className="p-5"><Image src={buildImages[0]} alt="Placeholder prop build" width={1200} height={600} className="h-56 w-full rounded-lg object-cover" /><h3 className="mt-4 text-lg font-bold">M6D PDW Magnum Replica</h3><p className="mt-1 text-sm text-muted-foreground">Placeholder project: mechanical slide, recoil system, and glowing display.</p></CardContent></Card>
          </div>
          <div>
            <h2 className="font-heading text-2xl font-bold">Completed Builds</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">{buildImages.slice(1).map((src, index) => <Card key={src}><CardContent className="p-4"><Image src={src} alt="Placeholder completed build" width={800} height={500} className="h-44 w-full rounded-lg object-cover" /><p className="mt-3 font-medium">{index === 0 ? "Mjolnir Mark VI Helmet" : "Spartan Chest Plate"}</p></CardContent></Card>)}</div>
          </div>
          <div><h2 className="font-heading text-2xl font-bold">Published Guides & Articles</h2><div className="mt-4 space-y-3">{["Master Chief Mjolnir Mark VI Helmet Build Guide", "Weathering 101: Hand Painting Scratches & Laser Burns", "Dual Extrusion Configuration on Ender-3 S1 Pro"].map((title) => <Card key={title}><CardContent className="p-4"><p className="font-medium">{title}</p><p className="mt-1 text-sm text-muted-foreground">Placeholder guide content</p></CardContent></Card>)}</div></div>
        </div>
        <aside className="space-y-5">
          <Card><CardHeader><CardTitle>Specialties & Tools</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2">{profile.specialties.map((item: string) => <Badge key={item} variant="secondary">{item}</Badge>)}{profile.workshop_tools.map((item: string) => <Badge key={item} variant="outline">{item}</Badge>)}</CardContent></Card>
          <Card><CardHeader><CardTitle>Earned Badges</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><p>Forge Master · Placeholder</p><p>Super Filament Spool · Placeholder</p><p>Helpful Engineer · Placeholder</p></CardContent></Card>
          <Card><CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader><CardContent className="space-y-3 text-sm text-muted-foreground"><p>Updated build log · 2 hours ago</p><p>Replied to a help request · 1 day ago</p><p>Uploaded 3D print files · 3 days ago</p></CardContent></Card>
        </aside>
      </section>
    </main>
  )
}

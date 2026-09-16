import Link from "next/link"

import { MakerDirectoryFilters } from "@/components/maker-directory-filters"
import { Card, CardContent } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

type FilterCategory = "maker_type" | "fandom" | "availability"

export default async function MakersPage({
  searchParams,
}: {
  searchParams: Promise<Partial<Record<FilterCategory, string>>>
}) {
  const selectedFilters = await searchParams
  const supabase = await createClient()
  const [{ data: options }, { data: assignments }, { data: makers }] =
    await Promise.all([
      supabase
        .from("maker_filter_options")
        .select("category, label, slug, id")
        .eq("enabled", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("profile_filter_options")
        .select("profile_user_id, filter_option_id"),
      supabase
    .from("profiles")
    .select("user_id, username, display_name, bio, location, specialties")
    .eq("visibility", "public")
    .not("published_at", "is", null)
        .order("published_at", { ascending: false }),
    ])
  const directoryOptions = (options ?? []) as Array<{
    id: string
    category: FilterCategory
    label: string
    slug: string
  }>
  const selectedOptionIds = (Object.entries(selectedFilters) as Array<
    [FilterCategory, string | undefined]
  >)
    .map(([category, slug]) =>
      directoryOptions.find(
        (option) => option.category === category && option.slug === slug
      )?.id
    )
    .filter((id): id is string => Boolean(id))
  const visibleUserIds =
    selectedOptionIds.length === 0
      ? null
      : new Set(
          (assignments ?? [])
            .filter((assignment) =>
              selectedOptionIds.every((optionId) =>
                (assignments ?? []).some(
                  (candidate) =>
                    candidate.profile_user_id === assignment.profile_user_id &&
                    candidate.filter_option_id === optionId
                )
              )
            )
            .map((assignment) => assignment.profile_user_id)
        )
  const visibleMakers = (makers ?? []).filter((maker) =>
    visibleUserIds ? visibleUserIds.has(maker.user_id) : true
  )

  return (
    <main className="min-h-svh bg-background px-6 py-10">
      <section className="mx-auto max-w-6xl">
        <p className="text-sm text-muted-foreground">MakersForge Directory</p>
        <h1 className="mt-2 font-heading text-4xl font-bold">Meet the makers</h1>
        <div className="mt-8">
          <MakerDirectoryFilters
            options={directoryOptions.map(({ category, label, slug }) => ({
              category,
              label,
              slug,
            }))}
          />
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleMakers.map((maker) => (
            <Link href={`/makers/${maker.username}`} key={maker.username}>
              <Card className="h-full transition-colors hover:bg-accent">
                <CardContent className="p-5">
                  <h2 className="font-heading text-lg font-bold">
                    {maker.display_name}
                  </h2>
                  <p className="text-sm text-forge-orange">@{maker.username}</p>
                  <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
                    {maker.bio || "Maker profile"}
                  </p>
                  <p className="mt-4 text-xs text-muted-foreground">
                    {maker.location || "Location undisclosed"}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        {visibleMakers.length === 0 ? (
          <p className="mt-8 text-muted-foreground">No public maker profiles yet.</p>
        ) : null}
      </section>
    </main>
  )
}

import { MakerDirectoryCard } from "@/components/maker-directory-card"
import { MakerDirectoryFilters } from "@/components/maker-directory-filters"
import { createClient } from "@/lib/supabase/server"
import { normalizeDirectoryUtm } from "@/lib/tracking"

type FilterCategory = "maker_type" | "fandom" | "availability"

export default async function MakersPage({
  searchParams,
}: {
  searchParams: Promise<Partial<Record<FilterCategory, string>>>
}) {
  const selectedFilters = await searchParams
  const supabase = await createClient()
  const [{ data: options }, { data: assignments }, { data: makers }, { data: settings }] =
    await Promise.all([
      supabase
        .from("maker_filter_options")
        .select("category, label, slug, id")
        .eq("enabled", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("maker_fandoms")
        .select("maker_id, filter_option_id"),
      supabase
        .from("makers")
        .select("id, display_name, descriptor, description, location, accepting_commissions, maker_type_option_id, thumbnail_path, website_url, instagram_url, patreon_url, facebook_url")
        .not("published_at", "is", null)
        .order("published_at", { ascending: false }),
      supabase
        .from("site_settings")
        .select("utm_source, utm_medium, utm_campaign")
        .eq("singleton", true)
        .maybeSingle(),
    ])
  const directoryUtm = normalizeDirectoryUtm(settings)
  const directoryOptions = (options ?? []) as Array<{
    id: string
    category: FilterCategory
    label: string
    slug: string
  }>
  const selectedFandomId = directoryOptions.find(
    (option) =>
      option.category === "fandom" && option.slug === selectedFilters.fandom,
  )?.id
  const selectedMakerTypeId = directoryOptions.find(
    (option) =>
      option.category === "maker_type" &&
      option.slug === selectedFilters.maker_type,
  )?.id
  const fandomLabels = new Map<string, string[]>()
  for (const assignment of assignments ?? []) {
    const label = directoryOptions.find(
      (option) => option.id === assignment.filter_option_id,
    )?.label
    if (!label) continue
    fandomLabels.set(assignment.maker_id, [
      ...(fandomLabels.get(assignment.maker_id) ?? []),
      label,
    ])
  }
  const visibleMakers = (makers ?? []).filter((maker) => {
    if (
      selectedMakerTypeId &&
      maker.maker_type_option_id !== selectedMakerTypeId
    ) {
      return false
    }
    if (
      selectedFandomId &&
      !(assignments ?? []).some(
        (assignment) =>
          assignment.maker_id === maker.id &&
          assignment.filter_option_id === selectedFandomId,
      )
    ) {
      return false
    }

    return !(
      selectedFilters.availability === "commissions-open" &&
      !maker.accepting_commissions
    )
  })

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
        <div className="mt-8 space-y-4">
          {visibleMakers.map((maker) => (
            <MakerDirectoryCard
              fandoms={fandomLabels.get(maker.id) ?? []}
              key={maker.id}
              utm={directoryUtm}
              maker={{
                ...maker,
                makerType: directoryOptions.find(
                  (option) => option.id === maker.maker_type_option_id,
                )?.label ?? null,
                thumbnailUrl: maker.thumbnail_path
                  ? supabase.storage
                      .from("maker-assets")
                      .getPublicUrl(maker.thumbnail_path).data.publicUrl
                  : null,
              }}
            />
          ))}
        </div>
        {visibleMakers.length === 0 ? (
          <p className="mt-8 text-muted-foreground">No makers have been published yet.</p>
        ) : null}
      </section>
    </main>
  )
}

import { redirect } from "next/navigation";

import { MakerNominationLayout } from "@/components/maker-nomination-layout";
import { createClient } from "@/lib/supabase/server";

export default async function NominateMakerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: draft }, { data: fandomOptions }] = await Promise.all([
    supabase
      .from("maker_nominations")
      .select(
        `
        id, relationship, contact_email, maker_name, descriptor, description,
        location, website_url, instagram_url, patreon_url, facebook_url,
        accepting_commissions, thumbnail_path, terms_confirmed,
        maker_nomination_fandoms(filter_option_id)
      `,
      )
      .eq("submitter_user_id", user.id)
      .eq("status", "draft")
      .maybeSingle(),
    supabase
      .from("maker_filter_options")
      .select("id, label")
      .eq("category", "fandom")
      .eq("enabled", true)
      .order("sort_order")
      .order("label"),
  ]);

  const nominationDraft = draft
    ? {
        ...draft,
        relationship: draft.relationship as "self" | "recommendation",
        fandomIds: draft.maker_nomination_fandoms.map(
          (fandom) => fandom.filter_option_id,
        ),
      }
    : null;

  return (
    <main className="min-h-svh bg-background px-6 py-12 md:px-10">
      <div className="mx-auto max-w-7xl">
        <MakerNominationLayout
          userId={user.id}
          email={user.email ?? ""}
          draft={nominationDraft}
          fandomOptions={fandomOptions ?? []}
        />
      </div>
    </main>
  );
}

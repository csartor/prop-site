"use client";

import { CloudArrowUpIcon, ImageIcon, InfoIcon } from "@phosphor-icons/react";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
} from "@/components/ui/combobox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";

const schema = z.object({
  relationship: z.enum(["self", "recommendation"]),
  email: z.string().trim().email("Enter a valid contact email address."),
  name: z
    .string()
    .trim()
    .min(2, "Enter the maker or organization name.")
    .max(160),
  descriptor: z.string().trim().min(2, "Enter a concise descriptor.").max(200),
  description: z
    .string()
    .trim()
    .min(20, "Use at least 20 characters.")
    .max(400),
  location: z
    .string()
    .trim()
    .min(2, "Enter a location or service area.")
    .max(160),
  website: z.string().trim().url("Enter a valid URL.").or(z.literal("")),
  instagram: z.string().trim().url("Enter a valid URL.").or(z.literal("")),
  patreon: z.string().trim().url("Enter a valid URL.").or(z.literal("")),
  facebook: z.string().trim().url("Enter a valid URL.").or(z.literal("")),
  fandomIds: z.array(z.string().uuid()),
  commissionsOpen: z.boolean(),
  terms: z.boolean(),
});

type NominationValues = z.infer<typeof schema>;

type DraftNomination = {
  id: string;
  relationship: "self" | "recommendation";
  contact_email: string;
  maker_name: string;
  descriptor: string;
  description: string;
  location: string;
  website_url: string | null;
  instagram_url: string | null;
  patreon_url: string | null;
  facebook_url: string | null;
  accepting_commissions: boolean;
  thumbnail_path: string | null;
  terms_confirmed: boolean;
  fandomIds: string[];
};

type FandomOption = { id: string; label: string };

const supportedImageTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
const maxImageSize = 2 * 1024 * 1024;

function safeFileName(file: File) {
  return file.name.replaceAll(/[^a-zA-Z0-9._-]/g, "-");
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-white/10 bg-forge-surface py-0">
      <CardHeader className="px-6 pt-6">
        <CardTitle className="font-heading text-lg text-forge-ink">
          {title}
        </CardTitle>
        <p className="text-sm text-forge-muted">{description}</p>
      </CardHeader>
      <CardContent className="p-6 pt-0">{children}</CardContent>
    </Card>
  );
}

export function MakerNominationLayout({
  userId,
  email,
  draft,
  fandomOptions,
}: {
  userId: string;
  email: string;
  draft: DraftNomination | null;
  fandomOptions: FandomOption[];
}) {
  const router = useRouter();
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const form = useForm<NominationValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      relationship: draft?.relationship ?? "self",
      email: draft?.contact_email ?? email,
      name: draft?.maker_name ?? "",
      descriptor: draft?.descriptor ?? "",
      description: draft?.description ?? "",
      location: draft?.location ?? "",
      website: draft?.website_url ?? "",
      instagram: draft?.instagram_url ?? "",
      patreon: draft?.patreon_url ?? "",
      facebook: draft?.facebook_url ?? "",
      fandomIds: draft?.fandomIds ?? [],
      commissionsOpen: draft?.accepting_commissions ?? false,
      terms: draft?.terms_confirmed ?? false,
    },
  });
  const values = useWatch({ control: form.control });
  const selectedFandomIds = values.fandomIds ?? [];
  const selectedFandoms = fandomOptions.filter((option) =>
    selectedFandomIds.includes(option.id),
  );
  const errors = form.formState.errors;

  function onThumbnailChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;
    if (!supportedImageTypes.has(file.type) || file.size > maxImageSize) {
      setThumbnail(null);
      setThumbnailPreview("");
      setSaveError(
        "Thumbnail must be a PNG, JPEG, or WEBP image no larger than 2 MB.",
      );
      event.target.value = "";
      return;
    }
    setSaveError("");
    setThumbnail(file);
    const reader = new FileReader();
    reader.addEventListener("load", () =>
      setThumbnailPreview(String(reader.result)),
    );
    reader.readAsDataURL(file);
  }

  async function save(submit: boolean) {
    const requiredFields: Array<keyof NominationValues> = [
      "relationship",
      "email",
      "name",
      "descriptor",
      "description",
      "location",
      "website",
      "instagram",
      "patreon",
      "facebook",
    ];
    const valid = await form.trigger(requiredFields);
    if (!valid) return;

    const current = form.getValues();
    if (submit && !current.terms) {
      form.setError("terms", {
        message: "Confirm the accuracy of this nomination before submitting.",
      });
      return;
    }
    if (submit && !thumbnail && !draft?.thumbnail_path) {
      setSaveError("Add a thumbnail or logo before submitting.");
      return;
    }

    setIsSaving(true);
    setSaveError("");
    const supabase = createClient();
    let uploadedPath: string | null = null;

    try {
      if (thumbnail) {
        uploadedPath = `${userId}/${crypto.randomUUID()}-${safeFileName(thumbnail)}`;
        const { error } = await supabase.storage
          .from("maker-nomination-assets")
          .upload(uploadedPath, thumbnail, { contentType: thumbnail.type });
        if (error) throw error;
      }

      const { data: nomination, error: nominationError } = await supabase
        .from("maker_nominations")
        .upsert(
          {
            submitter_user_id: userId,
            relationship: current.relationship,
            contact_email: current.email.trim(),
            maker_name: current.name.trim(),
            descriptor: current.descriptor.trim(),
            description: current.description.trim(),
            location: current.location.trim(),
            website_url: current.website.trim() || null,
            instagram_url: current.instagram.trim() || null,
            patreon_url: current.patreon.trim() || null,
            facebook_url: current.facebook.trim() || null,
            accepting_commissions: current.commissionsOpen,
            thumbnail_path: uploadedPath ?? draft?.thumbnail_path ?? null,
            terms_confirmed: current.terms,
            status: "draft",
          },
          { onConflict: "submitter_user_id" },
        )
        .select("id")
        .single();
      if (nominationError || !nomination)
        throw nominationError ?? new Error("We couldn't save your nomination.");

      const { error: clearFandomsError } = await supabase
        .from("maker_nomination_fandoms")
        .delete()
        .eq("nomination_id", nomination.id);
      if (clearFandomsError) throw clearFandomsError;

      if (current.fandomIds.length) {
        const { error: fandomsError } = await supabase
          .from("maker_nomination_fandoms")
          .insert(
            current.fandomIds.map((filter_option_id) => ({
              nomination_id: nomination.id,
              filter_option_id,
            })),
          );
        if (fandomsError) throw fandomsError;
      }

      if (submit) {
        const { error: submitError } = await supabase
          .from("maker_nominations")
          .update({ status: "submitted" })
          .eq("id", nomination.id);
        if (submitError) throw submitError;
      }

      setThumbnail(null);
      setThumbnailPreview("");
      router.refresh();
    } catch (error) {
      if (uploadedPath) {
        await supabase.storage
          .from("maker-nomination-assets")
          .remove([uploadedPath]);
      }
      setSaveError(
        error instanceof Error
          ? error.message
          : "We couldn't save your nomination. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form
      className="grid gap-12 xl:grid-cols-[minmax(0,1fr)_320px]"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void save(true);
      }}
    >
      <div className="space-y-10">
        <header className="space-y-4">
          <h1 className="font-heading text-2xl font-bold text-forge-ink">
            Nominate a Maker
          </h1>
          <p className="max-w-3xl text-base leading-relaxed text-forge-muted">
            MakersForge is a curated, community-driven resource. Use this form
            to submit your own workshop or recommend another master creator.
            Ensure all links and specialties are as accurate as possible to
            guarantee swift verification.
          </p>
        </header>

        <Panel
          title="Submitter Details"
          description="Help us track who is adding this shop. Self-nominations and community references are both highly welcome."
        >
          <FieldGroup>
            <Field data-invalid={Boolean(errors.relationship)}>
              <FieldLabel>
                Your Relationship to this Maker{" "}
                <span className="text-forge-orange">*</span>
              </FieldLabel>
              <Controller
                control={form.control}
                name="relationship"
                render={({ field }) => (
                  <RadioGroup
                    className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <Field
                      orientation="horizontal"
                      className={`justify-center rounded-md border px-4 py-2.5 text-center ${
                        field.value === "self"
                          ? "border-forge-orange bg-forge-orange text-black"
                          : "border-white/10 bg-muted"
                      }`}
                    >
                      <RadioGroupItem id="self" value="self" />
                      <FieldLabel htmlFor="self">
                        I am this Maker (Self-Nomination)
                      </FieldLabel>
                    </Field>
                    <Field
                      orientation="horizontal"
                      className={`justify-center rounded-md border px-4 py-2.5 text-center ${
                        field.value === "recommendation"
                          ? "border-forge-orange bg-forge-orange text-black"
                          : "border-white/10 bg-muted"
                      }`}
                    >
                      <RadioGroupItem
                        id="recommendation"
                        value="recommendation"
                      />
                      <FieldLabel htmlFor="recommendation">
                        I am recommending another Maker
                      </FieldLabel>
                    </Field>
                  </RadioGroup>
                )}
              />
              <FieldError errors={[errors.relationship]} />
            </Field>
          </FieldGroup>
        </Panel>

        <Panel
          title="Maker Profile & Bio"
          description="Establish the primary public identity of the workshop."
        >
          <FieldGroup>
            <Field data-invalid={Boolean(errors.name)}>
              <FieldLabel htmlFor="maker-name">
                Maker or Organization Name{" "}
                <span className="text-forge-orange">*</span>
              </FieldLabel>
              <Input
                id="maker-name"
                placeholder="e.g. Spartan Forge"
                {...form.register("name")}
              />
              <FieldError errors={[errors.name]} />
            </Field>
            <Field data-invalid={Boolean(errors.descriptor)}>
              <FieldLabel htmlFor="descriptor">
                Concise Descriptor <span className="text-forge-orange">*</span>
              </FieldLabel>
              <Input
                id="descriptor"
                placeholder="e.g. Master Maker · Specialized in Halo Mjolnir replicas"
                {...form.register("descriptor")}
              />
              <FieldDescription>
                A one-line subtitle displayed directly below the Maker&apos;s
                name on search cards.
              </FieldDescription>
              <FieldError errors={[errors.descriptor]} />
            </Field>
            <Field data-invalid={Boolean(errors.description)}>
              <FieldLabel htmlFor="directory-description">
                Long Directory Description{" "}
                <span className="text-forge-orange">*</span>
              </FieldLabel>
              <Textarea
                id="directory-description"
                className="min-h-25"
                placeholder="Provide a detailed overview of the tools, techniques, commission availability, or past notable builds…"
                {...form.register("description")}
              />
              <FieldDescription>
                Give potential clients and collaborators a clear summary of what
                this maker creates.
              </FieldDescription>
              <FieldError errors={[errors.description]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="thumbnail">
                Thumbnail / Logo Upload{" "}
                <span className="text-forge-orange">*</span>
              </FieldLabel>
              <label
                htmlFor="thumbnail"
                className="grid h-36 cursor-pointer place-items-center rounded-md border border-dashed border-white/10 bg-muted text-center"
              >
                <div>
                  <CloudArrowUpIcon className="mx-auto size-8 text-muted-foreground" />
                  <p className="mt-2 text-sm font-medium text-forge-ink">
                    {thumbnail ? thumbnail.name : "Click to upload"}
                  </p>
                  <p className="mt-1 text-xs text-forge-muted">
                    PNG, JPG, or WEBP (Max 2MB, square 1:1 recommended)
                  </p>
                </div>
              </label>
              <Input
                id="thumbnail"
                className="sr-only"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={onThumbnailChange}
              />
            </Field>
          </FieldGroup>
        </Panel>

        <Panel
          title="Specialties & Logistics"
          description="Map the skills, equipment, and geographical service range."
        >
          <FieldGroup>
            <Field data-invalid={Boolean(errors.fandomIds)}>
              <FieldLabel>Select Fandoms</FieldLabel>
              <Controller
                control={form.control}
                name="fandomIds"
                render={({ field }) => (
                  <Combobox
                    items={fandomOptions}
                    multiple
                    value={selectedFandoms}
                    onValueChange={(options: FandomOption[]) =>
                      field.onChange(options.map((option) => option.id))
                    }
                  >
                    <ComboboxChips>
                      <ComboboxValue>
                        {(selected: FandomOption[]) =>
                          selected.map((option) => (
                            <ComboboxChip key={option.id}>
                              {option.label}
                            </ComboboxChip>
                          ))
                        }
                      </ComboboxValue>
                      <ComboboxChipsInput placeholder="Search fandoms…" />
                    </ComboboxChips>
                    <ComboboxContent>
                      <ComboboxEmpty>No enabled fandoms found.</ComboboxEmpty>
                      <ComboboxList>
                        <ComboboxCollection>
                          {(option: FandomOption) => (
                            <ComboboxItem key={option.id} value={option}>
                              {option.label}
                            </ComboboxItem>
                          )}
                        </ComboboxCollection>
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                )}
              />
              <FieldDescription>
                {selectedFandomIds.length} selected · search to add or remove
                fandoms
              </FieldDescription>
            </Field>
            <Field
              orientation="horizontal"
              className="items-start justify-between"
            >
              <FieldLabel htmlFor="commissions-open">
                <span className="block text-sm">Open to commissions</span>
                <span className="block text-xs font-normal text-forge-muted">
                  Show that you are actively accepting new commission requests
                  from makers.
                </span>
              </FieldLabel>
              <Controller
                control={form.control}
                name="commissionsOpen"
                render={({ field }) => (
                  <Switch
                    id="commissions-open"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </Field>
            <Field data-invalid={Boolean(errors.location)}>
              <FieldLabel htmlFor="maker-location">
                Location / Service Area
              </FieldLabel>
              <Input
                id="maker-location"
                placeholder="e.g. Austin, TX, USA or Worldwide shipping"
                {...form.register("location")}
              />
              <FieldDescription>
                When relevant, state your region or primary delivery limits.
              </FieldDescription>
              <FieldError errors={[errors.location]} />
            </Field>
          </FieldGroup>
        </Panel>

        <Panel
          title="Outbound Portfolios & Accounts"
          description="Provide the channels where the community can purchase, support, or follow your work."
        >
          <FieldGroup>
            <Field data-invalid={Boolean(errors.website)}>
              <FieldLabel htmlFor="website">Website</FieldLabel>
              <Input
                id="website"
                placeholder="https://spartanforge.com"
                {...form.register("website")}
              />
              <FieldError errors={[errors.website]} />
            </Field>
            <Field data-invalid={Boolean(errors.instagram)}>
              <FieldLabel htmlFor="instagram">Instagram Profile</FieldLabel>
              <Input
                id="instagram"
                placeholder="https://instagram.com/spartanforge"
                {...form.register("instagram")}
              />
              <FieldError errors={[errors.instagram]} />
            </Field>
            <Field data-invalid={Boolean(errors.patreon)}>
              <FieldLabel htmlFor="patreon">Patreon Account</FieldLabel>
              <Input
                id="patreon"
                placeholder="https://patreon.com/spartanforge"
                {...form.register("patreon")}
              />
              <FieldError errors={[errors.patreon]} />
            </Field>
            <Field data-invalid={Boolean(errors.facebook)}>
              <FieldLabel htmlFor="facebook">Facebook Group</FieldLabel>
              <Input
                id="facebook"
                placeholder="https://facebook.com/groups/spartanforge"
                {...form.register("facebook")}
              />
              <FieldError errors={[errors.facebook]} />
            </Field>
          </FieldGroup>
        </Panel>

        <Card className="border-white/10 bg-forge-surface py-0">
          <CardContent className="flex flex-col gap-4 p-6">
            <Field
              orientation="horizontal"
              className="items-start"
              data-invalid={Boolean(errors.terms)}
            >
              <Controller
                control={form.control}
                name="terms"
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <FieldLabel>
                I confirm that the submitted information is accurate and does
                not represent a duplicate entry or an existing listing. I
                understand that false listings are subject to instant moderation
                removal.
              </FieldLabel>
            </Field>
            <FieldError errors={[errors.terms]} />
            {saveError ? (
              <p className="text-sm text-destructive" role="alert">
                {saveError}
              </p>
            ) : null}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                disabled={isSaving}
                onClick={() => void save(false)}
              >
                {isSaving ? "Saving…" : "Save Draft"}
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-forge-orange text-black hover:bg-forge-orange/90"
                disabled={isSaving}
              >
                {isSaving ? "Saving…" : "Submit Nomination"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-4 self-start xl:sticky xl:top-6">
        <Card className="border-white/10 bg-forge-surface py-0">
          <CardHeader className="flex-row items-center justify-between px-5 pt-5">
            <CardTitle className="font-heading text-xs text-forge-orange">
              Live Directory Preview
            </CardTitle>
            <span className="font-heading text-[9px] text-forge-orange">
              DRAFT
            </span>
          </CardHeader>
          <CardContent className="space-y-3 p-5 pt-0">
            <div className="flex gap-3">
              {thumbnailPreview ? (
                <Image
                  src={thumbnailPreview}
                  alt=""
                  width={44}
                  height={44}
                  unoptimized
                  className="size-11 rounded-md object-cover"
                />
              ) : (
                <div className="grid size-11 place-items-center rounded-md bg-muted">
                  <ImageIcon className="size-5 text-muted-foreground" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-forge-ink">
                  {values.name || "[Maker Name / Organization]"}
                </p>
                <p className="text-xs text-forge-muted">
                  {values.descriptor || "[Concise Descriptor / Tagline]"}
                </p>
              </div>
            </div>
            <p className="border-b border-white/10 pb-3 text-xs text-forge-muted">
              {values.description ||
                "Provide details on the left. This real-time preview matches the active MakersForge artisan grid."}
            </p>
            <div className="flex gap-2">
              {selectedFandoms.length ? (
                selectedFandoms.map((fandom) => (
                  <span
                    key={fandom.id}
                    className="rounded-full bg-forge-orange/20 px-2 py-1 text-[9px] text-forge-orange"
                  >
                    {fandom.label}
                  </span>
                ))
              ) : (
                <span className="rounded-full bg-forge-orange/20 px-2 py-1 text-[9px] text-forge-orange">
                  Fandom
                </span>
              )}
            </div>
            {values.website ? (
              <span className="inline-block rounded bg-muted px-2 py-1 text-[9px] text-forge-muted">
                Website
              </span>
            ) : null}
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-forge-surface py-0">
          <CardHeader className="px-5 pt-5">
            <CardTitle className="font-heading text-sm text-forge-ink">
              Submission Lifecycle
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-5 pt-0">
            {[
              [
                "1",
                "Nomination Filed",
                "Your details are staged for validation against existing directory entries to prevent duplicates.",
              ],
              [
                "2",
                "Manual Peer Review",
                "Community moderators verify outbound portfolio links, location accuracy, and specialty tags.",
              ],
              [
                "3",
                "Active Directory Live",
                "Once verified, the profile goes live with a registered artisan card, and the maker can manage it.",
              ],
            ].map(([number, title, copy]) => (
              <div className="flex gap-3" key={number}>
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-forge-orange/20 text-[10px] text-forge-orange">
                  {number}
                </span>
                <div>
                  <p className="text-xs font-medium text-forge-ink">{title}</p>
                  <p className="mt-1 text-[10px] leading-relaxed text-forge-muted">
                    {copy}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <div className="px-1">
          <p className="font-heading text-[10px] font-semibold text-forge-ink">
            ANTI-SPAM POLICY
          </p>
          <p className="mt-1 text-[10px] leading-relaxed text-forge-muted">
            Multiple identical listings or automated bot submissions are flagged
            by our firewall. Re-nominating existing makers will instantly merge
            details.
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs text-forge-muted">
            <InfoIcon className="size-3.5" /> Updates as you type
          </div>
        </div>
      </aside>
    </form>
  );
}

"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { z } from "zod"

import {
  createAdminMaker,
  fetchAdminPatreonCampaign,
} from "@/app/admin/actions"
import { Button } from "@/components/ui/button"
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
} from "@/components/ui/combobox"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

const makerSchema = z.object({
  displayName: z.string().trim().min(2, "Enter a maker name.").max(160),
  descriptor: z.string().trim().min(2, "Enter a concise descriptor.").max(200),
  description: z.string().trim().min(20, "Use at least 20 characters.").max(1000),
  location: z.string().trim().max(160),
  website: z.string().trim().url("Enter a valid URL.").or(z.literal("")),
  instagram: z.string().trim().url("Enter a valid URL.").or(z.literal("")),
  patreon: z.string().trim().url("Enter a valid URL.").or(z.literal("")),
  facebook: z.string().trim().url("Enter a valid URL.").or(z.literal("")),
  patreonCampaignId: z.string().trim().regex(/^\d*$/, "Enter a numeric Patreon campaign ID."),
  makerTypeId: z.string().uuid("Select a maker type."),
  fandomIds: z.array(z.string().uuid()).min(1, "Select at least one fandom."),
  acceptingCommissions: z.boolean(),
})

type MakerValues = z.infer<typeof makerSchema>
type FandomOption = { id: string; label: string }

const supportedImageTypes = new Set(["image/png", "image/jpeg", "image/webp"])
const maxImageSize = 2 * 1024 * 1024

export function AdminMakerForm({
  fandomOptions,
  makerTypeOptions,
}: {
  fandomOptions: FandomOption[]
  makerTypeOptions: FandomOption[]
}) {
  const form = useForm<MakerValues>({
    resolver: zodResolver(makerSchema),
    defaultValues: {
      displayName: "",
      descriptor: "",
      description: "",
      location: "",
      website: "",
      instagram: "",
      patreon: "",
      facebook: "",
      patreonCampaignId: "",
      makerTypeId: "",
      fandomIds: [],
      acceptingCommissions: false,
    },
  })
  const [thumbnail, setThumbnail] = useState<File | null>(null)
  const [importedImageUrl, setImportedImageUrl] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const selectedFandomIds = useWatch({
    control: form.control,
    name: "fandomIds",
  }) ?? []
  const selectedMakerTypeId = useWatch({
    control: form.control,
    name: "makerTypeId",
  })
  const selectedFandoms = fandomOptions.filter((option) =>
    selectedFandomIds.includes(option.id),
  )

  function selectThumbnail(file: File | null) {
    if (!file) {
      setThumbnail(null)
      form.clearErrors("root")
      return
    }
    if (!supportedImageTypes.has(file.type) || file.size > maxImageSize) {
      form.setError("root", {
        message: "Thumbnail must be a PNG, JPEG, or WEBP under 2MB.",
      })
      return
    }
    setThumbnail(file)
    setImportedImageUrl(null)
    form.clearErrors("root")
  }

  async function importPatreonCampaign() {
    const campaignId = form.getValues("patreonCampaignId").trim()
    if (!campaignId) {
      form.setError("patreonCampaignId", {
        message: "Enter a Patreon campaign ID.",
      })
      return
    }

    setIsImporting(true)
    setSuccessMessage(null)
    form.clearErrors("root")
    const result = await fetchAdminPatreonCampaign(campaignId)
    setIsImporting(false)

    if ("error" in result) {
      form.setError("root", { message: result.error })
      return
    }

    const { campaign } = result
    form.setValue("displayName", campaign.name, { shouldValidate: true })
    if (campaign.descriptor) {
      form.setValue("descriptor", campaign.descriptor, { shouldValidate: true })
    }
    if (campaign.description) {
      form.setValue("description", campaign.description, { shouldValidate: true })
    }
    if (campaign.patreonUrl) {
      form.setValue("patreon", campaign.patreonUrl, { shouldValidate: true })
    }
    setImportedImageUrl(campaign.imageUrl)
    setSuccessMessage("Campaign details imported. Review the remaining fields before publishing.")
  }

  async function submit(values: MakerValues) {
    setSuccessMessage(null)
    const formData = new FormData()
    formData.set("display_name", values.displayName)
    formData.set("descriptor", values.descriptor)
    formData.set("description", values.description)
    formData.set("location", values.location)
    formData.set("website_url", values.website)
    formData.set("instagram_url", values.instagram)
    formData.set("patreon_url", values.patreon)
    formData.set("facebook_url", values.facebook)
    formData.set("accepting_commissions", String(values.acceptingCommissions))
    formData.set("maker_type_option_id", values.makerTypeId)
    formData.set("patreon_image_url", thumbnail ? "" : importedImageUrl ?? "")
    values.fandomIds.forEach((id) => formData.append("fandom_ids", id))
    if (thumbnail) formData.set("thumbnail", thumbnail)

    try {
      await createAdminMaker(formData)
      form.reset()
      setThumbnail(null)
      setSuccessMessage("Maker published to the directory.")
    } catch {
      form.setError("root", {
        message: "The maker could not be published. Please try again.",
      })
    }
  }

  return (
    <form className="space-y-6" onSubmit={form.handleSubmit(submit)}>
      <FieldGroup>
        <Field data-invalid={Boolean(form.formState.errors.patreonCampaignId)}>
          <FieldLabel htmlFor="patreon-campaign-id">
            Import from Patreon campaign
          </FieldLabel>
          <div className="flex flex-wrap gap-2">
            <Input
              id="patreon-campaign-id"
              inputMode="numeric"
              placeholder="Campaign ID"
              {...form.register("patreonCampaignId")}
            />
            <Button
              disabled={isImporting}
              onClick={() => void importPatreonCampaign()}
              type="button"
              variant="secondary"
            >
              {isImporting ? "Importing…" : "Populate form"}
            </Button>
          </div>
          <FieldDescription>
            Imports public campaign details using your connected Patreon account.
          </FieldDescription>
          <FieldError errors={[form.formState.errors.patreonCampaignId]} />
        </Field>
      </FieldGroup>
      <FieldGroup className="grid gap-5 md:grid-cols-2">
        <Field data-invalid={Boolean(form.formState.errors.displayName)}>
          <FieldLabel htmlFor="display-name">Maker name</FieldLabel>
          <Input id="display-name" {...form.register("displayName")} />
          <FieldError errors={[form.formState.errors.displayName]} />
        </Field>
        <Field data-invalid={Boolean(form.formState.errors.descriptor)}>
          <FieldLabel htmlFor="descriptor">Descriptor</FieldLabel>
          <Input id="descriptor" {...form.register("descriptor")} />
          <FieldError errors={[form.formState.errors.descriptor]} />
        </Field>
        <Field className="md:col-span-2" data-invalid={Boolean(form.formState.errors.description)}>
          <FieldLabel htmlFor="description">Directory description</FieldLabel>
          <Textarea id="description" className="min-h-28" {...form.register("description")} />
          <FieldError errors={[form.formState.errors.description]} />
        </Field>
        <Field data-invalid={Boolean(form.formState.errors.location)}>
          <FieldLabel htmlFor="location">Location / service area (optional)</FieldLabel>
          <Input id="location" {...form.register("location")} />
          <FieldError errors={[form.formState.errors.location]} />
        </Field>
        <Field data-invalid={Boolean(form.formState.errors.makerTypeId)}>
          <FieldLabel htmlFor="maker-type">Maker type</FieldLabel>
          <Controller
            control={form.control}
            name="makerTypeId"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger id="maker-type">
                  <SelectValue placeholder="Select a maker type">
                    {makerTypeOptions.find(
                      (option) => option.id === selectedMakerTypeId,
                    )?.label ?? "Select a maker type"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {makerTypeOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError errors={[form.formState.errors.makerTypeId]} />
        </Field>
        <Field>
          <FieldLabel htmlFor="thumbnail">Thumbnail / logo</FieldLabel>
          <Input
            id="thumbnail"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => selectThumbnail(event.target.files?.[0] ?? null)}
            type="file"
          />
          <FieldDescription>
            Optional PNG, JPEG, or WEBP image up to 2MB.
            {thumbnail ? ` Selected: ${thumbnail.name}` : ""}
          </FieldDescription>
          {importedImageUrl && !thumbnail ? (
            <>
              {/* The imported image is fetched server-side on publish. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="Imported Patreon campaign artwork"
                className="mt-3 size-20 rounded-md object-cover"
                src={importedImageUrl}
              />
            </>
          ) : null}
        </Field>
        <Field className="md:col-span-2" data-invalid={Boolean(form.formState.errors.fandomIds)}>
          <FieldLabel>Select fandoms</FieldLabel>
          <Controller
            control={form.control}
            name="fandomIds"
            render={({ field }) => (
              <Combobox
                items={fandomOptions}
                multiple
                onValueChange={(options: FandomOption[]) =>
                  field.onChange(options.map((option) => option.id))
                }
                value={selectedFandoms}
              >
                <ComboboxChips>
                  <ComboboxValue>
                    {(selected: FandomOption[]) =>
                      selected.map((option) => (
                        <ComboboxChip key={option.id}>{option.label}</ComboboxChip>
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
          <FieldError errors={[form.formState.errors.fandomIds]} />
        </Field>
        <Field className="md:col-span-2" orientation="horizontal">
          <div className="flex-1">
            <FieldLabel htmlFor="accepting-commissions">Open for commissions</FieldLabel>
            <FieldDescription>
              Show the commission status on the public directory card.
            </FieldDescription>
          </div>
          <Controller
            control={form.control}
            name="acceptingCommissions"
            render={({ field }) => (
              <Switch
                checked={field.value}
                id="accepting-commissions"
                onCheckedChange={field.onChange}
              />
            )}
          />
        </Field>
      </FieldGroup>

      <FieldGroup className="grid gap-5 md:grid-cols-2">
        {[
          ["website", "Website"],
          ["instagram", "Instagram"],
          ["patreon", "Patreon"],
          ["facebook", "Facebook"],
        ].map(([name, label]) => (
          <Field
            data-invalid={Boolean(form.formState.errors[name as keyof MakerValues])}
            key={name}
          >
            <FieldLabel htmlFor={name}>{label}</FieldLabel>
            <Input id={name} type="url" {...form.register(name as keyof MakerValues)} />
            <FieldError errors={[form.formState.errors[name as keyof MakerValues]]} />
          </Field>
        ))}
      </FieldGroup>

      <FieldError errors={[form.formState.errors.root]} />
      {successMessage ? (
        <p className="text-sm text-forge-success" role="status">{successMessage}</p>
      ) : null}
      <Button disabled={form.formState.isSubmitting} type="submit">
        {form.formState.isSubmitting ? "Publishing…" : "Publish maker"}
      </Button>
    </form>
  )
}

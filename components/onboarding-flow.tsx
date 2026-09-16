"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import type { User } from "@supabase/supabase-js"
import { zodResolver } from "@hookform/resolvers/zod"
import { CheckIcon } from "@phosphor-icons/react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"

type Profile = Record<string, unknown> | null

const profileSchema = z.object({
  display_name: z.string().trim().max(100, "Use 100 characters or fewer."),
  username: z
    .string()
    .trim()
    .regex(/^$|^[a-z0-9][a-z0-9_-]{2,49}$/, "Use 3–50 lowercase letters, numbers, underscores, or hyphens."),
  bio: z.string().max(300, "Use 300 characters or fewer."),
  location: z.string().trim().max(100, "Use 100 characters or fewer."),
  avatar_url: z.string().url("Enter a valid URL.").or(z.literal("")),
  workshop_tools: z.string().max(500, "Use 500 characters or fewer."),
  favorite_materials: z.string().max(500, "Use 500 characters or fewer."),
  experience_level: z.enum(["Growing Maker", "Experienced Maker", "Master Maker"]),
  specialties: z.array(z.string()),
  accepting_commissions: z.boolean(),
  open_to_collaboration: z.boolean(),
  twitter_handle: z.string().trim().max(50),
  instagram_handle: z.string().trim().max(50),
  github_handle: z.string().trim().max(50),
  website_url: z.string().url("Enter a valid URL.").or(z.literal("")),
  youtube_url: z.string().url("Enter a valid URL.").or(z.literal("")),
  visibility: z.enum(["public", "unlisted"]),
})

type ProfileFormValues = z.infer<typeof profileSchema>

const steps = ["Overview", "Basic Info", "Maker Bio", "Review"]
const specialties = [
  "FDM 3D Printing",
  "Resin (SLA) Slicing",
  "Electronics Modding",
  "CAD Modeling",
  "Cosplay Foamwork",
  "Airbrushing",
  "Weathering",
]

const asset = (name: string) => `/makersforge/onboarding/${name}`

function Overview({ onStart, saving }: { onStart: () => void; saving: boolean }) {
  const stepRows = [
    ["check.svg", "Account Creation", "Completed", "text-forge-success", false],
    ["circle-dot.svg", "Basic Identity Details", "Up Next", "text-forge-orange", false],
    ["lock.svg", "Maker Experience & Specialties", "Locked", "text-forge-muted", true],
    ["lock.svg", "Social Links & Privacy Settings", "Locked", "text-forge-muted", true],
  ] as const
  const socialRows = [
    ["instagram.svg", "@handle"], ["youtube.svg", "@handle"], ["link.svg", "@handle"],
    ["twitter.svg", "@handle"], ["slack.svg", "@handle"], ["music.svg", "@handle"],
  ]

  return (
    <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_420px]">
      <section className="space-y-6">
        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-forge-ink">
            Forge Your Identity
          </h1>
          <p className="max-w-xl text-base text-forge-muted">
            Complete your profile setup to join search lists, showcase your machinery,
            and accept collaborative build commissions.
          </p>
        </div>
        <div className="flex items-center gap-5 rounded-xl border border-white/10 bg-forge-surface p-6">
          <div className="relative grid size-[60px] shrink-0 place-items-center">
            <Image src={asset("progress-track.svg")} alt="" fill />
            <Image
              src={asset("progress-fill.svg")}
              alt=""
              width={30}
              height={60}
              className="absolute inset-y-0 right-0"
            />
            <span className="relative font-heading text-sm font-bold text-forge-orange">35%</span>
          </div>
          <div>
            <p className="font-semibold text-forge-ink">Profile Strength: Getting There</p>
            <p className="mt-1 text-[13px] text-forge-muted">
              Add your workshop tools and social verification to hit 100%.
            </p>
          </div>
        </div>
        <div>
          <p className="mb-3 font-heading text-sm font-semibold tracking-[0.56px] text-forge-muted uppercase">
            Required Steps
          </p>
          <div className="overflow-hidden rounded-lg bg-white/10">
            {stepRows.map(([icon, label, state, stateColor, locked]) => (
              <div className={`flex items-center justify-between bg-forge-surface p-4 ${locked ? "opacity-60" : ""}`} key={label}>
                <div className="flex items-center gap-3">
                  <Image src={asset(icon)} alt="" width={18} height={18} />
                  <p className={locked ? "text-sm text-forge-muted" : "text-sm font-medium text-forge-ink"}>{label}</p>
                </div>
                <span className={`text-xs ${stateColor} ${state === "Up Next" ? "font-semibold" : ""}`}>{state}</span>
              </div>
            ))}
          </div>
        </div>
        <Button className="bg-forge-orange text-black hover:bg-forge-orange/90" onClick={onStart} disabled={saving}>
          {saving ? "Saving..." : "Continue to basic identity"}
        </Button>
      </section>

      <section className="min-w-0">
        <p className="mb-4 font-heading text-xs font-semibold tracking-[0.48px] text-forge-muted uppercase">Card Preview</p>
        <div className="overflow-hidden rounded-[4px] border-[1.5px] border-[#303032] bg-[#060607] text-[#f8f8f8]">
          <header className="flex items-center justify-between bg-[#18181b] px-3.5 py-2.5">
            <div><p className="text-xl tracking-tight">Makers<span className="font-black">Forge</span></p><p className="font-heading text-[7px] tracking-[1.4px] text-[#626369]">BUILD · MAKE · SHARE · BELONG</p></div>
            <div className="text-right"><p className="font-heading text-[8px] tracking-[0.4px] text-forge-orange">MEMBER ID</p><p className="font-heading text-[11px] font-bold tracking-[0.33px] text-[#cdcdd4]">#F-7328-0418</p><Image className="ml-auto mt-0.5" src={asset("barcode.svg")} alt="" width={53} height={16} /></div>
          </header>
          <div className="grid grid-cols-[160px_minmax(0,1fr)]">
            <div className="border-r border-white/5 bg-[#030304]">
              <div className="relative size-40 overflow-hidden bg-[#111114]">
                <Image src={asset("member-portrait.png")} alt="" fill className="object-cover" />
                <span className="absolute top-3 left-0 bg-forge-orange px-2 py-[3px] font-heading text-[7px] font-bold tracking-[0.7px] text-black">{"// MEMBER"}</span>
                <span className="absolute right-2 bottom-2 rounded-[2px] border border-forge-orange bg-[#030303] px-1.5 py-0.5 font-heading text-[8px] text-forge-orange">v1.0</span>
              </div>
              <div className="space-y-2 p-2.5 font-heading text-[8px]">
                <p className="text-[7px] tracking-[0.7px] text-forge-orange">{"// CRAFT"}</p><p className="text-[#9d9da8]">3D PRINT · PAINT · MORE</p>
                <Image src={asset("divider.svg")} alt="" width={140} height={1} />
                <p className="text-[7px] tracking-[0.7px] text-forge-orange">{"// SAVE"}</p><div className="space-y-[3px] text-[#626369]"><p>MATERIALS</p><p>EQUIPMENT</p><p>MODULES</p></div>
              </div>
            </div>
            <div className="space-y-3 p-4">
              <div className="flex items-center justify-between"><p className="font-heading text-[9px] tracking-[0.9px] text-forge-orange">{"// MEMBER"}</p><span className="rounded-[2px] border border-forge-orange bg-[#1a1a1d] px-2 py-[3px] font-heading text-[8px] tracking-[0.4px] text-forge-orange">ELITE · CREATOR</span></div>
              <div><p className="font-heading text-[28px] font-black leading-none tracking-[-0.28px]">Your Name</p><p className="text-sm text-forge-orange">@handle</p></div>
              <div><p className="font-heading text-[8px] tracking-[0.8px] text-[#626369]">{"// BIO"}</p><p className="mt-1 text-[11px] leading-[1.6] text-[#9d9da8]">Specify your bio in the next steps to let the community know what you forge...</p></div>
              <Image src={asset("divider-wide.svg")} alt="" width={228} height={1} className="w-full" />
              <div className="flex justify-between gap-3">
                <div><p className="font-heading text-[8px] tracking-[0.8px] text-[#626369]">{"// SOCIALS"}</p><div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1">{socialRows.map(([icon, handle]) => <div className="flex items-center gap-1" key={icon}><Image src={asset(icon)} alt="" width={10} height={10} /><span className="font-heading text-[9px] text-[#8e8e98]">{handle}</span></div>)}</div></div>
                <div className="text-center"><p className="font-heading text-[8px] tracking-[0.8px] text-[#626369]">{"// SCAN TO CONNECT"}</p><div className="mt-1.5 grid size-[76px] place-items-center rounded bg-[#f8f8f8]"><div className="grid grid-cols-[18px_4px_18px] gap-0.5"><span className="size-[18px] rounded-sm bg-black" /><span className="h-[18px] bg-black" /><span className="size-[18px] rounded-sm bg-black" /><span className="size-1 bg-black" /><Image src={asset("qr-detail.svg")} alt="" width={18} height={4} /><span className="size-1 bg-black" /><span className="size-[18px] rounded-sm bg-black" /><span className="h-[18px] bg-black" /><span className="size-2 bg-black" /></div></div><p className="mt-1 font-heading text-[7px] text-[#626369]">MOBILE<br />MKS-9862</p></div>
              </div>
            </div>
          </div>
          <div className="h-0.5 bg-[#303032]" />
          <footer className="flex items-center justify-between bg-[#020202] px-3.5 py-2 font-heading text-[7px]"><div className="flex items-center gap-1.5 text-forge-orange"><Image src={asset("chevron-right.svg")} alt="" width={10} height={10} />MAKERSFORGE.CLUB</div><p className="hidden text-[#3a3a40] sm:block">A COMMUNITY FOR MAKERS. BY MAKERS.</p><p className="text-right text-[#47474d]">01 · ENTER PERMIT<br />IN PROGRESS ▓▓▓▓░░░</p></footer>
        </div>
      </section>
    </div>
  )
}

export function OnboardingFlow({
  user,
  profile,
}: {
  user: User
  profile: Profile
}) {
  const router = useRouter()
  const [step, setStep] = useState(Number(profile?.onboarding_step ?? 1))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const {
    control,
    getValues,
    register,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
    display_name:
      (profile?.display_name as string | undefined) ??
      (user.user_metadata.full_name as string | undefined) ??
      "",
    username: (profile?.username as string | undefined) ?? "",
    bio: (profile?.bio as string | undefined) ?? "",
    location: (profile?.location as string | undefined) ?? "",
    avatar_url:
      (profile?.avatar_url as string | undefined) ??
      (user.user_metadata.avatar_url as string | undefined) ??
      "",
    workshop_tools: ((profile?.workshop_tools as string[] | undefined) ?? []).join(
      ", "
    ),
    favorite_materials: (
      (profile?.favorite_materials as string[] | undefined) ?? []
    ).join(", "),
    experience_level:
      (profile?.experience_level as ProfileFormValues["experience_level"] | undefined) ??
      "Growing Maker",
    specialties: (profile?.specialties as string[] | undefined) ?? [],
    accepting_commissions:
      (profile?.accepting_commissions as boolean | undefined) ?? false,
    open_to_collaboration:
      (profile?.open_to_collaboration as boolean | undefined) ?? false,
    twitter_handle: (profile?.twitter_handle as string | undefined) ?? "",
    instagram_handle: (profile?.instagram_handle as string | undefined) ?? "",
    github_handle: (profile?.github_handle as string | undefined) ?? "",
    website_url: (profile?.website_url as string | undefined) ?? "",
    youtube_url: (profile?.youtube_url as string | undefined) ?? "",
    visibility: (profile?.visibility as "public" | "unlisted" | undefined) ?? "public",
    },
  })
  const form = useWatch({ control })
  const selectedSpecialties = form.specialties ?? []

  function update(
    name: keyof ProfileFormValues,
    value: ProfileFormValues[keyof ProfileFormValues]
  ) {
    setValue(name, value, { shouldDirty: true, shouldValidate: true })
  }

  async function save(nextStep: number, publish = false) {
    const fieldsByStep: Record<number, Array<keyof ProfileFormValues>> = {
      1: [],
      2: ["display_name", "username", "location", "avatar_url", "bio"],
      3: ["workshop_tools", "favorite_materials", "experience_level"],
      4: ["twitter_handle", "instagram_handle", "github_handle", "website_url", "youtube_url", "visibility"],
    }
    const valid = await trigger(fieldsByStep[step])
    if (!valid) return

    const values = getValues()
    const username = values.username
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")

    if (publish && !username) {
      setError("Choose a username before publishing your profile.")
      return
    }

    setSaving(true)
    setError("")
    const supabase = createClient()
    const payload = {
      user_id: user.id,
      ...values,
      username: username || null,
      workshop_tools: values.workshop_tools
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      favorite_materials: values.favorite_materials
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      onboarding_step: publish ? 4 : nextStep,
      onboarding_completed_at: publish ? new Date().toISOString() : null,
      published_at: publish ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }
    const { error: saveError } = await supabase.from("profiles").upsert(payload)
    setSaving(false)
    if (saveError) {
      setError(saveError.message)
      return
    }
    if (publish) {
      router.push(`/makers/${username}`)
      router.refresh()
      return
    }
    setStep(nextStep)
  }

  return (
    <main className="min-h-svh bg-background px-4 py-8 text-foreground sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center gap-3">
          {steps.map((label, index) => {
            const number = index + 1
            return (
              <div className="flex items-center gap-2" key={label}>
                <span
                  className={`grid size-6 place-items-center rounded-full text-xs font-bold ${
                    number < step
                      ? "bg-forge-success text-black"
                      : number === step
                        ? "bg-forge-orange text-black"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {number < step ? <CheckIcon className="size-3.5" /> : number}
                </span>
                <span
                  className={
                    number === step ? "font-medium" : "text-muted-foreground"
                  }
                >
                  {label}
                </span>
              </div>
            )
          })}
        </div>

        <Card className="border-border bg-card">
          <CardContent className="p-6 sm:p-10">
            {step === 1 ? <Overview onStart={() => save(2)} saving={saving} /> : null}

            {step === 2 ? (
              <div className="space-y-6">
                <div>
                  <p className="font-heading text-2xl font-bold">Basic identity details</p>
                  <p className="mt-1 text-sm text-muted-foreground">How should makers find you?</p>
                </div>
                <FieldGroup className="grid gap-5 md:grid-cols-2">
                  <Field data-invalid={Boolean(errors.display_name)}><FieldLabel htmlFor="display_name">Display name</FieldLabel><Input id="display_name" aria-invalid={Boolean(errors.display_name)} {...register("display_name")} /><FieldError errors={[errors.display_name]} /></Field>
                  <Field data-invalid={Boolean(errors.username)}><FieldLabel htmlFor="username">Username handle</FieldLabel><Input id="username" aria-invalid={Boolean(errors.username)} placeholder="spartan_forge" {...register("username")} /><FieldError errors={[errors.username]} /></Field>
                  <Field className="md:col-span-2" data-invalid={Boolean(errors.location)}><FieldLabel htmlFor="location">Location / Outpost</FieldLabel><Input id="location" aria-invalid={Boolean(errors.location)} placeholder="Seattle, WA" {...register("location")} /><FieldError errors={[errors.location]} /></Field>
                  <Field className="md:col-span-2" data-invalid={Boolean(errors.avatar_url)}><FieldLabel htmlFor="avatar_url">Profile picture URL</FieldLabel><Input id="avatar_url" type="url" aria-invalid={Boolean(errors.avatar_url)} placeholder="https://…" {...register("avatar_url")} /><FieldError errors={[errors.avatar_url]} /></Field>
                  <Field className="md:col-span-2" data-invalid={Boolean(errors.bio)}><FieldLabel htmlFor="bio">Maker biography</FieldLabel><Textarea id="bio" maxLength={300} aria-invalid={Boolean(errors.bio)} placeholder="Introduce yourself to the Forge." {...register("bio")} /><FieldError errors={[errors.bio]} /></Field>
                </FieldGroup>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="grid gap-8 lg:grid-cols-2">
                <div className="space-y-5">
                  <div><p className="font-heading text-2xl font-bold">Machinery & material gear</p><p className="mt-1 text-sm text-muted-foreground">Select your specialties and workshop equipment.</p></div>
                  <div className="flex flex-wrap gap-2">
                    {specialties.map((specialty) => {
                      const selected = selectedSpecialties.includes(specialty)
                      return <Button key={specialty} type="button" aria-pressed={selected} size="sm" variant={selected ? "default" : "secondary"} onClick={() => update("specialties", selected ? selectedSpecialties.filter((item) => item !== specialty) : [...selectedSpecialties, specialty])}>{specialty}</Button>
                    })}
                  </div>
                  <Field data-invalid={Boolean(errors.workshop_tools)}><FieldLabel htmlFor="workshop_tools">Primary workshop printers / tools</FieldLabel><Input id="workshop_tools" aria-invalid={Boolean(errors.workshop_tools)} placeholder="Creality K1 Max, Elegoo Saturn 3" {...register("workshop_tools")} /><FieldError errors={[errors.workshop_tools]} /></Field>
                  <Field data-invalid={Boolean(errors.favorite_materials)}><FieldLabel htmlFor="favorite_materials">Favorite build materials</FieldLabel><Input id="favorite_materials" aria-invalid={Boolean(errors.favorite_materials)} placeholder="Epoxy Resin, EVA Foam" {...register("favorite_materials")} /><FieldError errors={[errors.favorite_materials]} /></Field>
                </div>
                <div className="space-y-5">
                  <Field data-invalid={Boolean(errors.experience_level)}><FieldLabel>Maker experience level</FieldLabel><Controller control={control} name="experience_level" render={({ field }) => <Select value={field.value} onValueChange={field.onChange}><SelectTrigger aria-invalid={Boolean(errors.experience_level)}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Growing Maker">Growing Maker</SelectItem><SelectItem value="Experienced Maker">Experienced Maker</SelectItem><SelectItem value="Master Maker">Master Maker</SelectItem></SelectContent></Select>} /><FieldError errors={[errors.experience_level]} /></Field>
                  <Field orientation="horizontal" className="justify-between rounded-lg border p-4"><FieldLabel htmlFor="accepting_commissions"><span className="block font-medium">Accepting custom commissions</span><span className="text-sm text-muted-foreground">Let other makers reach out for builds.</span></FieldLabel><Controller control={control} name="accepting_commissions" render={({ field }) => <Switch id="accepting_commissions" checked={field.value} onCheckedChange={field.onChange} />} /></Field>
                  <Field orientation="horizontal" className="justify-between rounded-lg border p-4"><FieldLabel htmlFor="open_to_collaboration"><span className="block font-medium">Open for local collaboration</span><span className="text-sm text-muted-foreground">Share workshop knowledge locally.</span></FieldLabel><Controller control={control} name="open_to_collaboration" render={({ field }) => <Switch id="open_to_collaboration" checked={field.value} onCheckedChange={field.onChange} />} /></Field>
                </div>
              </div>
            ) : null}

            {step === 4 ? (
              <div className="grid gap-8 lg:grid-cols-2">
                <FieldGroup className="space-y-4">
                  <p className="font-heading text-2xl font-bold">Social links & privacy</p>
                  {(["twitter_handle", "instagram_handle", "github_handle", "website_url", "youtube_url"] as const).map((field) => <Field key={field} data-invalid={Boolean(errors[field])}><FieldLabel htmlFor={field}>{field.replaceAll("_", " ")}</FieldLabel><Input id={field} aria-invalid={Boolean(errors[field])} {...register(field)} /><FieldError errors={[errors[field]]} /></Field>)}
                </FieldGroup>
                <div className="space-y-4">
                  <p className="font-heading text-xl font-bold">Profile visibility</p>
                  <Controller control={control} name="visibility" render={({ field }) => <RadioGroup value={field.value} onValueChange={field.onChange}><Field orientation="horizontal" className="rounded-lg border p-4"><RadioGroupItem id="public" value="public" /><FieldLabel htmlFor="public"><span className="block font-medium">Public discoverable</span><span className="text-sm text-muted-foreground">Appear in the MakersForge directory.</span></FieldLabel></Field><Field orientation="horizontal" className="rounded-lg border p-4"><RadioGroupItem id="unlisted" value="unlisted" /><FieldLabel htmlFor="unlisted"><span className="block font-medium">Direct link only</span><span className="text-sm text-muted-foreground">Only visitors with your profile URL can view it.</span></FieldLabel></Field></RadioGroup>} />
                </div>
              </div>
            ) : null}

            {error ? <p className="mt-6 text-sm text-destructive">{error}</p> : null}
            {step > 1 ? <div className="mt-8 flex justify-between border-t pt-6"><Button variant="outline" onClick={() => setStep(step - 1)}>Back</Button><Button onClick={() => save(step === 4 ? 4 : step + 1, step === 4)} disabled={saving}>{saving ? "Saving..." : step === 4 ? "Publish profile" : "Save & continue"}</Button></div> : null}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

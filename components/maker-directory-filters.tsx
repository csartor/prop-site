"use client"

import { MagnifyingGlassIcon } from "@phosphor-icons/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Field, FieldGroup } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const filterSchema = z.object({
  search: z.string(),
  sort: z.enum(["active", "recent"]),
})

type FilterOption = {
  category: "maker_type" | "fandom" | "availability"
  label: string
  slug: string
}

export function MakerDirectoryFilters({
  options,
}: {
  options: FilterOption[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [selectedFilters, setSelectedFilters] = useState<
    Record<FilterOption["category"], string>
  >({
    maker_type: searchParams.get("maker_type") ?? "all",
    fandom: searchParams.get("fandom") ?? "all",
    availability: searchParams.get("availability") ?? "all",
  })
  const form = useForm<z.infer<typeof filterSchema>>({
    resolver: zodResolver(filterSchema),
    defaultValues: { search: "", sort: "active" },
  })

  function updateFilter(key: FilterOption["category"], value: string) {
    setSelectedFilters((current) => ({ ...current, [key]: value }))
    const params = new URLSearchParams(searchParams)
    if (value === "all") params.delete(key)
    else params.set(key, value)
    startTransition(() => {
      router.push(`/makers${params.size ? `?${params}` : ""}`)
    })
  }

  function chips(category: FilterOption["category"], allLabel: string) {
    const selected = selectedFilters[category]
    const categoryOptions = options.filter((option) => option.category === category)
    return (
      <div className="flex flex-wrap items-center gap-2">
        <p className={category === "maker_type" ? "font-heading text-xs font-bold uppercase text-forge-orange" : "font-heading text-[11px] font-medium uppercase text-muted-foreground"}>
          {category.replace("_", " ")}:
        </p>
        {[{ label: allLabel, slug: "all" }, ...categoryOptions].map((option) => {
          const active = selected === option.slug
          return (
            <Button
              key={option.slug}
              type="button"
              size="sm"
              variant={active ? "default" : "outline"}
              disabled={isPending && active}
              className={active ? "rounded-full bg-forge-orange px-3.5 text-[#0f0f10] hover:bg-forge-orange/90" : "rounded-full border-white/10 bg-[#0f0f10] px-3.5 text-muted-foreground hover:bg-muted"}
              onClick={() => updateFilter(category, option.slug)}
            >
              {option.label}
            </Button>
          )
        })}
      </div>
    )
  }

  return (
    <Card className="border-white/10 bg-forge-surface py-0">
      <CardContent className="space-y-5 p-6">
        <form onSubmit={(event) => event.preventDefault()}>
          <FieldGroup className="flex-col gap-4 md:flex-row">
            <Field>
              <InputGroup className="h-11 border-white/10 bg-[#0f0f10]">
                <InputGroupAddon>
                  <MagnifyingGlassIcon className="size-4.5" />
                </InputGroupAddon>
                <InputGroupInput
                  className="text-sm"
                  placeholder="Search makers, fandoms, specialties, or availability"
                  {...form.register("search")}
                />
              </InputGroup>
            </Field>
            <Field className="md:w-50">
              <Select defaultValue="active" onValueChange={(value) => value && form.setValue("sort", value as "active" | "recent")}>
                <SelectTrigger className="h-11 w-full border-white/10 bg-[#0f0f10] px-4 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Sort: Most Active</SelectItem>
                  <SelectItem value="recent">Sort: Recently Joined</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
        </form>
        {chips("maker_type", "All Creators")}
        <div className="h-px bg-white/10" />
        <div className="space-y-4">
          {chips("fandom", "All")}
          {chips("availability", "All")}
        </div>
      </CardContent>
    </Card>
  )
}

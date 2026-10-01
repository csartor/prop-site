"use client"

import { ImagesIcon } from "@phosphor-icons/react"
import Image from "next/image"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "cn"

export function ProjectGallery({ urls }: { urls: string[] }) {
  const [selected, setSelected] = useState(0)
  const slide = urls[selected] ?? urls[0]

  if (!slide) {
    return (
      <div className="flex aspect-4/3 items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground">
        No photos yet.
      </div>
    )
  }

  return (
    <div className="grid gap-3 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-stretch">
      <div className="order-2 flex gap-2 overflow-x-auto lg:order-1 lg:h-full lg:flex-col lg:overflow-y-auto">
        {urls.map((url, index) => {
          const isSelected = index === selected
          return (
            <button
              aria-label={`Photo ${index + 1}`}
              aria-pressed={isSelected}
              className={cn(
                "relative size-18 shrink-0 overflow-hidden rounded-lg bg-muted",
                isSelected ? undefined : "opacity-80",
              )}
              key={`${url}-${index}`}
              onClick={() => setSelected(index)}
              type="button"
            >
              <Image alt="" className="object-cover" fill sizes="4.5rem" src={url} />
              {isSelected ? (
                <span className="pointer-events-none absolute inset-0 rounded-lg ring-2 ring-primary ring-inset" />
              ) : null}
            </button>
          )
        })}
      </div>
      <div className="relative order-1 aspect-4/3 overflow-hidden rounded-lg bg-black shadow-lg lg:order-2">
        <Image
          alt=""
          className="object-contain"
          fill
          sizes="(min-width: 1024px) 42rem, 100vw"
          src={slide}
        />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-35% from-transparent to-black/50" />
        <Button
          className="absolute right-4 bottom-4 rounded-full bg-black/80 text-foreground hover:bg-black/80"
          size="sm"
          type="button"
          variant="outline"
        >
          <ImagesIcon />
          See all {urls.length} {urls.length === 1 ? "photo" : "photos"}
        </Button>
      </div>
    </div>
  )
}

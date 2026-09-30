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
      <div className="flex aspect-[4/3] items-center justify-center rounded-[10px] bg-muted text-sm text-muted-foreground lg:min-h-80">
        No photos yet.
      </div>
    )
  }

  return (
    <div className="grid gap-3 lg:grid-cols-[4.625rem_minmax(0,1fr)] lg:items-stretch">
      <div className="order-2 flex gap-2.5 overflow-x-auto lg:order-1 lg:h-full lg:flex-col lg:overflow-y-auto">
        {urls.map((url, index) => {
          const isSelected = index === selected
          return (
            <button
              aria-label={`Photo ${index + 1}`}
              aria-pressed={isSelected}
              className={cn(
                "relative size-[4.625rem] shrink-0 overflow-hidden rounded-[7px] bg-muted",
                isSelected ? undefined : "opacity-80",
              )}
              key={`${url}-${index}`}
              onClick={() => setSelected(index)}
              type="button"
            >
              <Image alt="" className="object-cover" fill sizes="74px" src={url} />
              {isSelected ? (
                <span className="pointer-events-none absolute inset-0 rounded-[7px] ring-2 ring-primary ring-inset" />
              ) : null}
            </button>
          )
        })}
      </div>
      <div className="relative order-1 aspect-[4/3] overflow-hidden rounded-[10px] bg-black shadow-[0_14px_18px_rgba(0,0,0,0.32)] lg:order-2 lg:aspect-auto lg:min-h-[28rem]">
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

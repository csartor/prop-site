"use client"

import Image from "next/image"
import { useState } from "react"
import { WrenchIcon } from "@phosphor-icons/react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { ProjectUpdate } from "@/lib/projects"
import { cn } from "cn"

export function ProjectUpdates({ updates }: { updates: ProjectUpdate[] }) {
  const [order, setOrder] = useState<"newest" | "oldest">("newest")
  const ordered = order === "newest" ? updates : [...updates].reverse()

  return (
    <section className="flex min-w-0 flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-medium tracking-[0.18em] text-primary">BUILD LOG</p>
          <h2 className="font-heading text-[1.875rem] leading-none tracking-[-0.04em]">
            Project updates
          </h2>
        </div>
        <Select
          onValueChange={(value) => {
            if (value === "newest" || value === "oldest") setOrder(value)
          }}
          value={order}
        >
          <SelectTrigger className="w-40">
            <SelectValue>{order === "newest" ? "Newest first" : "Oldest first"}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {ordered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No updates yet.</p>
      ) : (
        <ol className="flex flex-col">
          {ordered.map((update, index) => {
            const last = index === ordered.length - 1
            return (
              <li className="grid grid-cols-[3.625rem_minmax(0,1fr)] gap-4" key={update.id}>
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-md border font-mono text-xs",
                      update.milestone
                        ? "border-primary text-primary"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    #{String(update.number).padStart(2, "0")}
                  </div>
                  {last ? (
                    <span aria-hidden className="mt-3 size-1.5 rounded-full bg-border" />
                  ) : (
                    <span aria-hidden className="mt-2 w-px flex-1 bg-border" />
                  )}
                </div>
                <div
                  className={cn(
                    "flex min-w-0 flex-col gap-4 pb-10",
                    !last && "border-b border-border",
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      {update.milestone ? (
                        <p className="mb-1 text-[10px] font-medium tracking-[0.16em] text-primary uppercase">
                          {update.milestone}
                        </p>
                      ) : null}
                      <h3 className="text-2xl leading-tight tracking-[-0.03em]">{update.title}</h3>
                    </div>
                    <p className="shrink-0 pt-1 text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
                      {update.createdLabel}
                    </p>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">{update.body}</p>
                  <UpdatePhotos urls={update.imageUrls} />
                  {update.processNote ? (
                    <p className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <WrenchIcon className="size-3.5 shrink-0" />
                      {update.processNote}
                    </p>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}

function UpdatePhotos({ urls }: { urls: string[] }) {
  if (!urls.length) return null

  if (urls.length === 1) {
    return (
      <div className="relative aspect-4/3 overflow-hidden rounded-lg md:aspect-auto md:h-[390px]">
        <Image alt="" className="object-cover" fill sizes="(min-width: 768px) 40rem, 100vw" src={urls[0]} />
      </div>
    )
  }

  if (urls.length === 2) {
    return (
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {urls.map((url) => (
          <div
            className="relative aspect-4/3 overflow-hidden rounded-lg md:aspect-auto md:h-[330px]"
            key={url}
          >
            <Image alt="" className="object-cover" fill sizes="(min-width: 768px) 20rem, 100vw" src={url} />
          </div>
        ))}
      </div>
    )
  }

  const extra = urls.length - 3
  const shown = urls.slice(0, 3)

  return (
    <div className="grid grid-cols-1 gap-2 md:h-[390px] md:grid-cols-[minmax(0,1fr)_17rem]">
      <div className="relative aspect-4/3 overflow-hidden rounded-lg md:aspect-auto md:h-full">
        <Image alt="" className="object-cover" fill sizes="(min-width: 768px) 28rem, 100vw" src={shown[0]} />
      </div>
      <div className="grid grid-cols-1 gap-2 md:grid-rows-2">
        {shown.slice(1).map((url, index) => (
          <div
            className="relative aspect-4/3 overflow-hidden rounded-lg md:aspect-auto md:h-full"
            key={url}
          >
            <Image alt="" className="object-cover" fill sizes="(min-width: 768px) 17rem, 100vw" src={url} />
            {index === 1 && extra > 0 ? (
              <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-2xl font-medium text-white">
                +{extra}
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

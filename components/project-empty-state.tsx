"use client"

import { PlusIcon } from "@phosphor-icons/react"
import Link from "next/link"

import { Card } from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { cn } from "cn"

export function ProjectEmptyState({
  href,
  onCreate,
  className,
}: {
  href?: string
  onCreate?: () => void
  className?: string
}) {
  const content = (
    <Card
      className={cn(
        "h-68 w-68 shrink-0 justify-center rounded-xl border border-dashed bg-card py-0 ring-0",
        className,
      )}
    >
      <Empty className="h-full border-0 p-4">
        <EmptyHeader className="gap-4">
          <EmptyMedia className="size-12 rounded-full bg-muted" variant="icon">
            <PlusIcon className="size-5" />
          </EmptyMedia>
          <div className="flex flex-col gap-1.5">
            <EmptyTitle className="font-semibold">Create new project</EmptyTitle>
            <EmptyDescription>Start a new build and document your journey.</EmptyDescription>
          </div>
        </EmptyHeader>
      </Empty>
    </Card>
  )

  if (href) {
    return (
      <Link aria-label="Create new project" className="block w-68 shrink-0" href={href}>
        {content}
      </Link>
    )
  }

  return (
    <button className="block w-68 shrink-0 text-left" onClick={onCreate} type="button">
      {content}
    </button>
  )
}

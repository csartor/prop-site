"use client"

import { CaretLeftIcon, CaretRightIcon, ImagesIcon } from "@phosphor-icons/react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

import type { GalleryPost } from "@/components/gallery-card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ProjectStatusBadge } from "@/components/project-status-badge"
import { Tag } from "@/components/tag"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"
export function PostPreviewSheet({
  post,
  open,
  onOpenChange,
}: {
  post: GalleryPost | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent
        className="w-[calc(100%-4.5rem)] gap-0 overflow-hidden border-0 bg-transparent p-0 text-sm shadow-none data-[side=right]:w-[calc(100%-4.5rem)] data-[side=right]:border-l-0 data-[side=right]:sm:max-w-none"
        side="right"
      >
        {post ? <PostPreview key={post.id} post={post} /> : null}
      </SheetContent>
    </Sheet>
  )
}

function PostPreview({ post }: { post: GalleryPost }) {
  const slides = post.imageUrls.length > 0 ? post.imageUrls : [post.imageUrl]
  const [slide, setSlide] = useState(0)

  function showSlide(index: number) {
    setSlide((index + slides.length) % slides.length)
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
      <div className="flex min-h-80 shrink-0 flex-col lg:min-h-0 lg:flex-1">
        <div className="relative min-h-64 flex-1 lg:min-h-0">
          <Image
            alt=""
            className="object-contain"
            fill
            sizes="(min-width: 1024px) 60vw, 100vw"
            src={slides[slide]}
          />
          {slides.length > 1 ? (
            <Badge className="absolute top-4 left-4" variant="secondary">
              <ImagesIcon />
              {slide + 1} / {slides.length}
            </Badge>
          ) : null}
          {slides.length > 1 ? (
            <>
              <Button
                aria-label="Previous image"
                className="absolute top-1/2 left-4 -translate-y-1/2 rounded-full"
                onClick={() => showSlide(slide - 1)}
                size="icon"
                type="button"
                variant="secondary"
              >
                <CaretLeftIcon />
              </Button>
              <Button
                aria-label="Next image"
                className="absolute top-1/2 right-4 -translate-y-1/2 rounded-full"
                onClick={() => showSlide(slide + 1)}
                size="icon"
                type="button"
                variant="secondary"
              >
                <CaretRightIcon />
              </Button>
            </>
          ) : null}
        </div>
        {slides.length > 1 ? (
          <div className="flex gap-2 overflow-x-auto p-4">
            {slides.map((url, index) => (
              <button
                className="relative size-16 shrink-0 overflow-hidden rounded-md"
                key={`${url}-${index}`}
                onClick={() => setSlide(index)}
                type="button"
              >
                <Image alt="" className="object-cover" fill sizes="64px" src={url} />
                {index === slide ? (
                  <span className="pointer-events-none absolute inset-0 rounded-md ring-2 ring-primary" />
                ) : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div className="flex min-h-0 w-full flex-1 flex-col border-t bg-popover shadow-lg lg:w-96 lg:flex-none lg:border-t-0 lg:border-l">
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-6 pr-14">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar>
              {post.avatarUrl ? <AvatarImage alt="" src={post.avatarUrl} /> : null}
              <AvatarFallback>{post.author.slice(0, 1)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{post.author}</p>
              <p className="truncate text-xs text-muted-foreground">@{post.username}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <SheetTitle className="text-base font-medium">{post.title}</SheetTitle>
            <SheetDescription className="text-sm whitespace-pre-wrap text-muted-foreground">
              {post.body}
            </SheetDescription>
            <p className="text-xs text-muted-foreground">{post.createdLabel}</p>
          </div>
          {post.project ? (
            <div className="flex items-center gap-3 rounded-lg border p-3">
              {post.project.coverUrl ? (
                <Image
                  alt=""
                  className="size-12 shrink-0 rounded-md object-cover"
                  height={48}
                  src={post.project.coverUrl}
                  width={48}
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Project</p>
                <p className="truncate text-sm font-medium">{post.project.title}</p>
                <ProjectStatusBadge className="mt-1" status={post.project.status} />
              </div>
              <Button
                nativeButton={false}
                render={<Link href={`/projects/${post.project.id}`} />}
                variant="outline"
              >
                View project
              </Button>
            </div>
          ) : null}
          {post.tags.length ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">Tags</p>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

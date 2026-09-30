"use client"

import { BookmarkSimpleIcon, HeartIcon } from "@phosphor-icons/react"
import Image from "next/image"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

export type GalleryPost = {
  id: string
  imageUrl: string
  imageUrls: string[]
  author: string
  username: string
  avatarUrl: string | null
  title: string
  body: string
  tags: string[]
  createdLabel: string
  project: {
    id: string
    title: string
    status: string
    coverUrl: string | null
  } | null
}

const imageAspect = "319.19 / 385.582"

export function GalleryCard({
  post,
  onOpen,
}: {
  post: GalleryPost
  onOpen: (post: GalleryPost) => void
}) {
  return (
    <article
      className="group flex min-w-0 cursor-pointer flex-col gap-4"
      onClick={() => onOpen(post)}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return
        if ((event.target as HTMLElement).closest("button")) return
        event.preventDefault()
        onOpen(post)
      }}
      tabIndex={0}
    >
      <div
        className="relative overflow-hidden rounded-lg"
        style={{ aspectRatio: imageAspect }}
      >
        <Image
          alt=""
          className="object-cover"
          fill
          sizes="(max-width: 40rem) 100vw, 20rem"
          src={post.imageUrl}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/4 group-hover:pointer-events-auto">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/90 opacity-0 transition-opacity delay-100 duration-200 ease-out group-hover:opacity-100 group-hover:delay-0 motion-reduce:transition-none" />
          <div className="flex h-full items-end p-4">
            <div className="flex min-w-0 flex-1 translate-y-4 items-center gap-3 opacity-0 transition-[opacity,translate] duration-150 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-hover:delay-100 motion-reduce:transition-none">
              <p className="min-w-0 flex-1 truncate text-sm font-medium leading-none tracking-tight text-foreground">
                {post.title}
              </p>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  aria-label="Save"
                  className="size-10 rounded-full"
                  onClick={(event) => event.stopPropagation()}
                  size="icon"
                  tabIndex={-1}
                  type="button"
                  variant="secondary"
                >
                  <BookmarkSimpleIcon className="size-5" />
                </Button>
                <Button
                  aria-label="Like"
                  className="size-10 rounded-full"
                  onClick={(event) => event.stopPropagation()}
                  size="icon"
                  tabIndex={-1}
                  type="button"
                  variant="secondary"
                >
                  <HeartIcon className="size-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar>
            {post.avatarUrl ? <AvatarImage alt="" src={post.avatarUrl} /> : null}
            <AvatarFallback>{post.author.slice(0, 1)}</AvatarFallback>
          </Avatar>
          <p className="truncate text-base text-muted-foreground">{post.author}</p>
        </div>
      </div>
    </article>
  )
}

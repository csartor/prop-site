"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { DotsThreeIcon, PencilSimpleIcon, PlusIcon, WrenchIcon } from "@phosphor-icons/react"

import { deletePost } from "@/app/posts/actions"
import { useComposer } from "@/components/composer"
import { EditUpdateDialog } from "@/components/edit-update-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { ProjectUpdate } from "@/lib/projects"
import { cn } from "cn"

export function ProjectUpdates({
  updates,
  isOwner = false,
  projectId,
}: {
  updates: ProjectUpdate[]
  isOwner?: boolean
  projectId?: string
}) {
  const composer = useComposer()
  const router = useRouter()
  const [order, setOrder] = useState<"newest" | "oldest">("newest")
  const [editingUpdate, setEditingUpdate] = useState<ProjectUpdate | null>(null)
  const [deletingUpdate, setDeletingUpdate] = useState<ProjectUpdate | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const ordered = order === "newest" ? updates : [...updates].reverse()

  return (
    <section className="flex min-w-0 flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium tracking-widest text-primary">BUILD LOG</p>
          <h2 className="font-heading text-3xl tracking-tight">Project updates</h2>
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
      {isOwner ? (
        <Card>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-col gap-1.5">
                <p className="text-xs font-medium tracking-widest text-primary uppercase">
                  Extend the story
                </p>
                <h3 className="text-lg font-semibold text-foreground">Add a new update</h3>
                <p className="text-xs leading-normal text-muted-foreground">
                  Capture the next milestone, repair, technique, or progress note.
                </p>
              </div>
              <Button
                className="shrink-0"
                size="lg"
                onClick={() => composer?.openComposer({ projectId })}
                type="button"
              >
                Add update
                <PlusIcon data-icon="inline-end" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
      {ordered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No updates yet.</p>
      ) : (
        <ol className="flex flex-col">
          {ordered.map((update, index) => {
            const last = index === ordered.length - 1
            return (
              <li className="grid grid-cols-[auto_minmax(0,1fr)] gap-4" key={update.id}>
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
                  {isOwner ? (
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Button
                          className="rounded-full"
                          size="sm"
                          onClick={() => setEditingUpdate(update)}
                          type="button"
                          variant="outline"
                        >
                          <PencilSimpleIcon className="size-4" />
                          Edit
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            aria-label="More update actions"
                            className="inline-flex size-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground outline-none hover:bg-input/50"
                          >
                            <DotsThreeIcon className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuItem onClick={() => setEditingUpdate(update)}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setDeleteError(null)
                                setDeletingUpdate(update)
                              }}
                              variant="destructive"
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <p className="text-xs text-muted-foreground">Owner view</p>
                    </div>
                  ) : null}
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      {update.milestone ? (
                        <p className="mb-1 text-xs font-medium tracking-widest text-primary uppercase">
                          {update.milestone}
                        </p>
                      ) : null}
                      <h3 className="text-2xl tracking-tight">{update.title}</h3>
                    </div>
                    <p className="shrink-0 pt-1 text-xs tracking-wide text-muted-foreground uppercase">
                      {update.createdLabel}
                    </p>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">{update.body}</p>
                  <UpdatePhotos urls={update.imageUrls} />
                  {update.processNote ? (
                    <p className="flex items-center gap-2 text-xs text-muted-foreground">
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
      <EditUpdateDialog
        onOpenChange={(open) => {
          if (!open) setEditingUpdate(null)
        }}
        update={editingUpdate}
      />
      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setDeletingUpdate(null)
            setDeleteError(null)
          }
        }}
        open={Boolean(deletingUpdate)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this update?</DialogTitle>
            <DialogDescription>
              {deletingUpdate
                ? `“${deletingUpdate.title}” will be removed from this build.`
                : "This update will be removed from this build."}
            </DialogDescription>
          </DialogHeader>
          {deleteError ? (
            <p className="text-sm text-destructive" role="alert">
              {deleteError}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              disabled={deleting}
              onClick={() => setDeletingUpdate(null)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={deleting}
              onClick={async () => {
                if (!deletingUpdate) return
                setDeleting(true)
                setDeleteError(null)
                const result = await deletePost(deletingUpdate.id)
                setDeleting(false)
                if (result.error) {
                  setDeleteError(result.error)
                  return
                }
                setDeletingUpdate(null)
                router.refresh()
              }}
              type="button"
              variant="destructive"
            >
              Delete update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}

function UpdatePhotos({ urls }: { urls: string[] }) {
  if (!urls.length) return null

  if (urls.length === 1) {
    return (
      <div className="relative aspect-4/3 overflow-hidden rounded-lg">
        <Image alt="" className="object-cover" fill sizes="(min-width: 768px) 40rem, 100vw" src={urls[0]} />
      </div>
    )
  }

  if (urls.length === 2) {
    return (
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {urls.map((url) => (
          <div
            className="relative aspect-4/3 overflow-hidden rounded-lg"
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
    <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
      <div className="relative aspect-4/3 overflow-hidden rounded-lg md:col-span-2">
        <Image alt="" className="object-cover" fill sizes="(min-width: 768px) 28rem, 100vw" src={shown[0]} />
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-1">
        {shown.slice(1).map((url, index) => (
          <div
            className="relative aspect-4/3 overflow-hidden rounded-lg"
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

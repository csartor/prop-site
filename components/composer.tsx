"use client"

import { createContext, useContext, useMemo, useState, type ReactNode } from "react"

export type ComposerFocus = "photo" | "process"

export type ComposerIntent = {
  key: number
  projectId: string | null
  focus: ComposerFocus | null
}

type ComposerContextValue = {
  intent: ComposerIntent | null
  open: boolean
  setOpen: (open: boolean) => void
  openComposer: (request?: { projectId?: string; focus?: ComposerFocus }) => void
}

const ComposerContext = createContext<ComposerContextValue | null>(null)

export function ComposerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [intent, setIntent] = useState<ComposerIntent | null>(null)
  const value = useMemo<ComposerContextValue>(
    () => ({
      intent,
      open,
      setOpen,
      openComposer: (request) => {
        setIntent(
          request
            ? {
                key: Date.now(),
                projectId: request.projectId ?? null,
                focus: request.focus ?? null,
              }
            : null,
        )
        setOpen(true)
      },
    }),
    [intent, open],
  )

  return <ComposerContext.Provider value={value}>{children}</ComposerContext.Provider>
}

export function useComposer() {
  return useContext(ComposerContext)
}

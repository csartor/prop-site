import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import { cn } from "cn"

export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Badge
      className={cn("h-7 bg-card px-2.5 text-[10px] font-normal text-secondary-foreground", className)}
      variant="outline"
    >
      {children}
    </Badge>
  )
}

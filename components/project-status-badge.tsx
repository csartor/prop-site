import { cva } from "class-variance-authority"

import { Badge } from "@/components/ui/badge"
import { projectStatusLabel, type ProjectStatus } from "@/lib/project-status"
import { cn } from "cn"

const projectStatusBadgeVariants = cva(
  "h-auto gap-1.5 rounded-full border-current bg-background/70 px-2.5 py-1 text-xs font-medium backdrop-blur-[2px]",
  {
    variants: {
      status: {
        completed:
          "border-status-complete bg-status-complete-background text-status-complete dark:border-status-complete dark:bg-status-complete-background dark:text-status-complete",
        in_progress: "text-primary",
        paused: "text-warning",
        cancelled: "text-destructive",
      },
    },
  },
)

function isProjectStatus(status: string): status is ProjectStatus {
  return status in { in_progress: true, completed: true, paused: true, cancelled: true }
}

export function ProjectStatusBadge({
  status,
  className,
}: {
  status: string
  className?: string
}) {
  const knownStatus = isProjectStatus(status) ? status : "in_progress"

  return (
    <Badge className={cn(projectStatusBadgeVariants({ status: knownStatus }), className)} variant="outline">
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {projectStatusLabel(knownStatus)}
    </Badge>
  )
}

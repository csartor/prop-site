import { cva } from "class-variance-authority"

import { Badge } from "@/components/ui/badge"
import { projectStatusLabel, type ProjectStatus } from "@/lib/project-status"
import { cn } from "cn"

const projectStatusBadgeVariants = cva(
  "h-auto gap-1.5 px-2.5 py-1.5 text-[10px] font-normal",
  {
    variants: {
      status: {
        completed: "border-success/30 bg-success/10 text-success",
        in_progress: "border-primary/30 bg-primary/10 text-primary",
        paused: "border-warning/30 bg-warning/10 text-warning",
        cancelled: "border-destructive/30 bg-destructive/10 text-destructive",
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

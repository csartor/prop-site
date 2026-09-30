export const projectStatuses = ["in_progress", "completed", "paused", "cancelled"] as const

export type ProjectStatus = (typeof projectStatuses)[number]

const projectStatusLabels: Record<ProjectStatus, string> = {
  in_progress: "In progress",
  completed: "Completed",
  paused: "Paused",
  cancelled: "Cancelled",
}

export function projectStatusLabel(status: string) {
  if (status in projectStatusLabels) return projectStatusLabels[status as ProjectStatus]
  return projectStatusLabels.in_progress
}

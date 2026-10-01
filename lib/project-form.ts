import { z } from "zod"

import { projectStatuses } from "@/lib/project-status"

const optionalText = z.string().trim().max(200, "Use 200 characters or fewer.")

export const projectFormSchema = z.object({
  title: z.string().trim().min(1, "Enter a title.").max(160, "Use 160 characters or fewer."),
  description: z
    .string()
    .trim()
    .min(1, "Enter a description.")
    .max(2000, "Use 2000 characters or fewer."),
  status: z.enum(projectStatuses),
  isPublic: z.boolean(),
  tags: z.array(z.string().trim().min(1).max(40)).max(10, "Use 10 tags or fewer."),
  startedOn: z.string(),
  completedOn: z.string(),
  material: optionalText,
  scale: optionalText,
  techniques: optionalText,
  tools: optionalText,
})

export type ProjectFormValues = z.infer<typeof projectFormSchema>

export const emptyProjectForm: ProjectFormValues = {
  title: "",
  description: "",
  status: "in_progress",
  isPublic: false,
  tags: [],
  startedOn: "",
  completedOn: "",
  material: "",
  scale: "",
  techniques: "",
  tools: "",
}

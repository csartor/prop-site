import { redirect } from "next/navigation"

import { AppFrame } from "@/components/app-frame"
import { ProfileManager } from "@/components/profile-manager"
import { getOwnerWorkspace } from "@/lib/projects"

export default async function ProfilePage() {
  const workspace = await getOwnerWorkspace()
  if (workspace.status !== "ready") {
    redirect(workspace.status === "anonymous" ? "/login" : "/onboarding")
  }

  return (
    <AppFrame projects={workspace.projects} viewer={workspace.viewer}>
      <ProfileManager posts={workspace.posts} projects={workspace.projects} />
    </AppFrame>
  )
}

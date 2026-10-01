import { Button } from "@/components/ui/button"

export function ProjectsExploreHeader() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex max-w-xl flex-col gap-1">
        <h2 className="text-2xl font-semibold">Explore projects</h2>
        <p className="text-sm text-muted-foreground">
          Follow the whole build, not just the finished thing.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button className="h-9 rounded-lg" type="button" variant="secondary">
          All projects
        </Button>
        <Button className="h-9 rounded-lg" disabled type="button" variant="outline">
          Following
        </Button>
      </div>
    </div>
  )
}

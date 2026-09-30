import { Button } from "@/components/ui/button"
import { cn } from "cn"

export function ProjectNavigation({ updateCount }: { updateCount: number }) {
  const tabs = [
    { label: "Updates", count: String(updateCount), active: true },
    { label: "Resources", count: "00", active: false },
    { label: "About", count: null, active: false },
    { label: "Followers", count: "0", active: false },
  ]

  return (
    <nav aria-label="Project sections" className="flex h-[50px] min-w-max items-stretch gap-[38px]">
      {tabs.map((tab) => (
        <Button
          className={cn(
            "relative h-full gap-[7px] rounded-none px-0 hover:bg-transparent",
            tab.active
              ? "text-sm font-normal text-foreground"
              : "text-xs font-medium text-muted-foreground",
          )}
          key={tab.label}
          type="button"
          variant="ghost"
        >
          {tab.label}
          {tab.count ? (
            <span
              className={cn(
                "font-mono text-[10px] font-semibold",
                tab.active ? "text-primary" : "text-muted-foreground",
              )}
            >
              {tab.count}
            </span>
          ) : null}
          {tab.active ? (
            <span aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" />
          ) : null}
        </Button>
      ))}
    </nav>
  )
}

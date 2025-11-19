"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Keyboard, Search, Plus, Sidebar as SidebarIcon } from "lucide-react"

interface KeyboardShortcutsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const shortcuts = [
  {
    category: "Navigation",
    items: [
      { keys: ["Ctrl", "B"], description: "Toggle sidebar", icon: SidebarIcon },
      { keys: ["Ctrl", "K"], description: "Open search", icon: Search },
      { keys: ["Ctrl", "N"], description: "Create new job", icon: Plus },
    ],
  },
  {
    category: "Actions",
    items: [
      { keys: ["Esc"], description: "Close dialogs" },
      { keys: ["/"], description: "Focus search" },
    ],
  },
]

export function KeyboardShortcuts({ open, onOpenChange }: KeyboardShortcutsProps) {
  const router = useRouter()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + K for search
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault()
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
        }
      }

      // Ctrl/Cmd + N for new job
      if ((event.ctrlKey || event.metaKey) && event.key === "n") {
        event.preventDefault()
        router.push("/jobs-ai")
        // Trigger create dialog if available
        setTimeout(() => {
          const createButton = document.querySelector('button:has-text("Create")') as HTMLButtonElement
          createButton?.click()
        }, 100)
      }

      // ? for shortcuts
      if (event.key === "?" && !event.ctrlKey && !event.metaKey) {
        const activeElement = document.activeElement
        if (activeElement?.tagName !== "INPUT" && activeElement?.tagName !== "TEXTAREA") {
          event.preventDefault()
          onOpenChange(true)
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [router, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
          </div>
          <DialogDescription>
            Speed up your workflow with these keyboard shortcuts
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {shortcuts.map((category, idx) => (
            <div key={category.category}>
              <h3 className="text-sm font-semibold mb-3">{category.category}</h3>
              <div className="space-y-2">
                {category.items.map((item, itemIdx) => {
                  const Icon = 'icon' in item ? item.icon : undefined
                  return (
                    <div
                      key={itemIdx}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                        <span className="text-sm">{item.description}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {item.keys.map((key, keyIdx) => (
                          <span key={keyIdx}>
                            <Badge
                              variant="outline"
                              className="font-mono text-xs px-2 py-1 font-semibold"
                            >
                              {key}
                            </Badge>
                            {keyIdx < item.keys.length - 1 && (
                              <span className="mx-1 text-muted-foreground">+</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
              {idx < shortcuts.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
          <div className="pt-2">
            <p className="text-xs text-muted-foreground">
              Press <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted border rounded">?</kbd>{" "}
              to open this dialog from anywhere
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


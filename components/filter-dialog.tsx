"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Filter } from "lucide-react"

interface FilterDialogProps {
  filter: string
  onFilterChange: (filter: string) => void
  options: { value: string; label: string }[]
  title?: string
  description?: string
}

export function FilterDialog({
  filter,
  onFilterChange,
  options,
  title = "Filter Jobs",
  description = "Select a status to filter jobs",
}: FilterDialogProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (value: string) => {
    onFilterChange(value)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </DialogTrigger>
      <DialogContent className="shadow-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <Card className="border-border/50 shadow-sm">
          <CardContent className="pt-6">
            <div className="space-y-2">
              {options.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={filter === option.value ? "default" : "outline"}
                  onClick={() => handleSelect(option.value)}
                  className="w-full justify-start"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


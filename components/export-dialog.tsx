"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, FileJson, FileSpreadsheet, FileText, Loader2 } from "lucide-react"
import { useToast } from "@/components/toast"
import type { ExportFormat, ExportScope, ExportDataLevel } from "@/lib/export-utils"

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onExport: (options: {
    format: ExportFormat
    scope: ExportScope
    dataLevel: ExportDataLevel
  }) => Promise<void>
  totalCount: number
  filteredCount: number
  selectedCount?: number
  jobType?: "regular" | "ai"
}

export function ExportDialog({
  open,
  onOpenChange,
  onExport,
  totalCount,
  filteredCount,
  selectedCount = 0,
  jobType = "regular",
}: ExportDialogProps) {
  const { addToast } = useToast()
  const [format, setFormat] = React.useState<ExportFormat>("xlsx")
  const [scope, setScope] = React.useState<ExportScope>("filtered")
  const [dataLevel, setDataLevel] = React.useState<ExportDataLevel>("summary")
  const [exporting, setExporting] = React.useState(false)

  const handleExport = async () => {
    try {
      setExporting(true)
      await onExport({ format, scope, dataLevel })
      addToast(
        `Successfully exported ${scope === "all" ? totalCount : scope === "filtered" ? filteredCount : selectedCount} ${jobType === "ai" ? "AI " : ""}jobs`,
        "success"
      )
      onOpenChange(false)
    } catch (error: any) {
      console.error("Export failed:", error)
      addToast(`Export failed: ${error.message}`, "error")
    } finally {
      setExporting(false)
    }
  }

  const formatOptions: { value: ExportFormat; label: string; icon: React.ReactNode; description: string }[] = [
    {
      value: "xlsx",
      label: "Excel (.xlsx)",
      icon: <FileSpreadsheet className="h-4 w-4" />,
      description: "Best for data analysis and editing",
    },
    {
      value: "csv",
      label: "CSV (.csv)",
      icon: <FileText className="h-4 w-4" />,
      description: "Universal format, works everywhere",
    },
    {
      value: "json",
      label: "JSON (.json)",
      icon: <FileJson className="h-4 w-4" />,
      description: "Structured data with full details",
    },
  ]

  const scopeOptions: { value: ExportScope; label: string; count: number; description: string }[] = [
    {
      value: "all",
      label: "All Jobs",
      count: totalCount,
      description: "Export all jobs in the system",
    },
    {
      value: "filtered",
      label: "Filtered Jobs",
      count: filteredCount,
      description: "Export only jobs matching current filters",
    },
    ...(selectedCount > 0
      ? [
          {
            value: "selected" as ExportScope,
            label: "Selected Jobs",
            count: selectedCount,
            description: "Export only selected jobs",
          },
        ]
      : []),
  ]

  const dataLevelOptions: { value: ExportDataLevel; label: string; description: string }[] = [
    {
      value: "basic",
      label: "Basic Info",
      description: "Job ID, URL, status, timestamps only",
    },
    {
      value: "summary",
      label: "Summary",
      description: "Basic info + metadata, flags, and summaries",
    },
    {
      value: "full",
      label: "Full Data",
      description: "All available fields including S3 keys and data references",
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export {jobType === "ai" ? "AI " : ""}Jobs
          </DialogTitle>
          <DialogDescription>
            Choose export format, scope, and data level for your {jobType === "ai" ? "AI " : ""}jobs
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Export Format */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Export Format</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-3">
                {formatOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFormat(option.value)}
                    className={`flex flex-col items-start gap-2 p-3 rounded-lg border-2 transition-all text-left ${
                      format === option.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {option.icon}
                      <span className="font-medium text-sm">{option.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Export Scope */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Export Scope</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {scopeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setScope(option.value)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all text-left ${
                      scope === option.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{option.label}</span>
                        <span className="text-xs text-muted-foreground">
                          ({option.count} {option.count === 1 ? "job" : "jobs"})
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Data Level */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Data Level</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dataLevelOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setDataLevel(option.value)}
                    className={`w-full flex flex-col items-start gap-1 p-3 rounded-lg border-2 transition-all text-left ${
                      dataLevel === option.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <span className="font-medium text-sm">{option.label}</span>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={exporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={exporting}>
            {exporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}



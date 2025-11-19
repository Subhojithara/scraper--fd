"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { RefreshCw, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react"
import { useToast } from "@/components/toast"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface BulkRetryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobs: Array<{ job_id: string; url: string; status: string; error_message?: string | null }>
  onRetry: (jobIds: string[]) => Promise<void>
  jobType?: "regular" | "ai"
}

export function BulkRetryDialog({
  open,
  onOpenChange,
  jobs,
  onRetry,
  jobType = "ai",
}: BulkRetryDialogProps) {
  const { addToast } = useToast()
  const [selectedJobIds, setSelectedJobIds] = React.useState<Set<string>>(new Set())
  const [retrying, setRetrying] = React.useState(false)
  const [retryResults, setRetryResults] = React.useState<{
    success: string[]
    failed: Array<{ jobId: string; error: string }>
  } | null>(null)

  // Filter jobs that can be retried (failed or cancelled)
  const retryableJobs = React.useMemo(() => {
    return jobs.filter((job) => 
      job.status === "failed" || 
      job.status === "cancelled" ||
      (jobType === "regular" && job.status === "failed")
    )
  }, [jobs, jobType])

  React.useEffect(() => {
    if (open) {
      // Select all retryable jobs by default
      setSelectedJobIds(new Set(retryableJobs.map((job) => job.job_id)))
      setRetryResults(null)
    }
  }, [open, retryableJobs])

  const handleToggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedJobIds(new Set(retryableJobs.map((job) => job.job_id)))
    } else {
      setSelectedJobIds(new Set())
    }
  }

  const handleToggleJob = (jobId: string, checked: boolean) => {
    const newSelected = new Set(selectedJobIds)
    if (checked) {
      newSelected.add(jobId)
    } else {
      newSelected.delete(jobId)
    }
    setSelectedJobIds(newSelected)
  }

  const handleRetry = async () => {
    if (selectedJobIds.size === 0) {
      addToast("Please select at least one job to retry", "warning")
      return
    }

    setRetrying(true)
    setRetryResults(null)

    const jobIdsArray = Array.from(selectedJobIds)
    const results = {
      success: [] as string[],
      failed: [] as Array<{ jobId: string; error: string }>,
    }

    try {
      // Retry jobs one by one to handle individual failures
      for (const jobId of jobIdsArray) {
        try {
          await onRetry([jobId])
          results.success.push(jobId)
        } catch (error: any) {
          results.failed.push({
            jobId,
            error: error.message || "Unknown error",
          })
        }
      }

      setRetryResults(results)

      if (results.success.length > 0) {
        addToast(
          `Successfully retried ${results.success.length} job${results.success.length === 1 ? "" : "s"}`,
          "success"
        )
      }

      if (results.failed.length > 0) {
        addToast(
          `Failed to retry ${results.failed.length} job${results.failed.length === 1 ? "" : "s"}`,
          "error"
        )
      }

      // Close dialog if all succeeded
      if (results.failed.length === 0) {
        setTimeout(() => {
          onOpenChange(false)
          setSelectedJobIds(new Set())
        }, 1500)
      }
    } catch (error: any) {
      addToast(`Bulk retry failed: ${error.message}`, "error")
    } finally {
      setRetrying(false)
    }
  }

  const allSelected = selectedJobIds.size === retryableJobs.length && retryableJobs.length > 0
  const someSelected = selectedJobIds.size > 0 && selectedJobIds.size < retryableJobs.length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Bulk Retry {jobType === "ai" ? "AI " : ""}Jobs
          </DialogTitle>
          <DialogDescription>
            Select jobs to retry. Only failed or cancelled jobs can be retried.
          </DialogDescription>
        </DialogHeader>

        {retryableJobs.length === 0 ? (
          <div className="py-8 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              No retryable jobs found. Only failed or cancelled jobs can be retried.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="select-all"
                    checked={allSelected}
                    onCheckedChange={handleToggleAll}
                  />
                  <Label
                    htmlFor="select-all"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Select All ({retryableJobs.length} jobs)
                  </Label>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {selectedJobIds.size} selected
                </Badge>
              </div>

              <Separator />

              <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                <div className="space-y-2">
                  {retryableJobs.map((job) => {
                    const isSelected = selectedJobIds.has(job.job_id)
                    return (
                      <div
                        key={job.job_id}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <Checkbox
                          id={job.job_id}
                          checked={isSelected}
                          onCheckedChange={(checked) =>
                            handleToggleJob(job.job_id, checked as boolean)
                          }
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <Label
                              htmlFor={job.job_id}
                              className="text-sm font-medium cursor-pointer truncate"
                            >
                              {job.url}
                            </Label>
                            <Badge
                              variant="destructive"
                              className="text-xs shrink-0"
                            >
                              {job.status}
                            </Badge>
                          </div>
                          {job.error_message && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {job.error_message}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>

              {retryResults && (
                <div className="space-y-2 p-3 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Retry Results</span>
                  </div>
                  {retryResults.success.length > 0 && (
                    <div className="space-y-1">
                      <Badge variant="default" className="text-xs">
                        Success: {retryResults.success.length}
                      </Badge>
                    </div>
                  )}
                  {retryResults.failed.length > 0 && (
                    <div className="space-y-2 mt-2">
                      <Badge variant="destructive" className="text-xs">
                        Failed: {retryResults.failed.length}
                      </Badge>
                      <ScrollArea className="h-24 w-full rounded-md border p-2">
                        <div className="space-y-1">
                          {retryResults.failed.map(({ jobId, error }) => (
                            <div key={jobId} className="text-xs text-destructive">
                              <span className="font-mono">{jobId.substring(0, 8)}...</span>: {error}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={retrying}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRetry}
                disabled={retrying || selectedJobIds.size === 0}
              >
                {retrying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry {selectedJobIds.size} Job{selectedJobIds.size === 1 ? "" : "s"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}



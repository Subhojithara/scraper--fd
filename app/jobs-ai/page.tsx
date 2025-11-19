"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AIJobCardAdvanced } from "@/components/ai-job-card-advanced"
import { DeleteAllDialog } from "@/components/delete-all-dialog"
import { CreateAIJobDialog } from "@/components/create-ai-job-dialog"
import { FilterDialog } from "@/components/filter-dialog"
import {
  getAllAIJobs,
  deleteAIJob,
  deleteAllAIJobs,
  cancelAIJob,
  retryAIJob,
  getAIJobAnalytics,
  type JobAI,
  type JobAnalytics,
} from "@/lib/api"
import { Search, Loader2, ChevronDown, ChevronUp, Activity, Download, RefreshCw, Trash2, Mail } from "lucide-react"
import { ExportDialog } from "@/components/export-dialog"
import { BulkRetryDialog } from "@/components/bulk-retry-dialog"
import { exportAIJobs } from "@/lib/export-utils"
import { useToast } from "@/components/toast"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination"
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts"
import { QuickActions } from "@/components/quick-actions"
import { CostDashboard } from "@/components/cost-dashboard"
import { ScratcherView } from "@/components/scratcher-view"
import { BulkFollowUpDialog } from "@/components/bulk-follow-up-dialog"

export default function JobsAIPage() {
  const { addToast } = useToast()
  const [jobs, setJobs] = useState<JobAI[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState<"all" | "pending" | "processing" | "completed" | "failed">("all")
  const [analytics, setAnalytics] = useState<JobAnalytics | null>(null)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [showBulkRetryDialog, setShowBulkRetryDialog] = useState(false)
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showBulkFollowUp, setShowBulkFollowUp] = useState(false)
  const [activeTab, setActiveTab] = useState<"jobs" | "scratcher">("jobs")

  useEffect(() => {
    fetchJobs()
    // Only poll if there are active jobs (pending/processing)
    // Use a ref to avoid stale closure issues
    let intervalId: NodeJS.Timeout | null = null
    const checkAndFetch = () => {
      const hasActiveJobs = jobs.some(j => j.status === "pending" || j.status === "processing")
      if (hasActiveJobs) {
        fetchJobs().catch(() => {
          // Silently handle errors during polling
        })
      }
    }
    intervalId = setInterval(checkAndFetch, 60000) // Poll every 60 seconds to reduce rate limit issues
    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [jobs.length]) // Only depend on jobs.length to avoid recreating interval

  useEffect(() => {
    fetchAnalytics()
    // Increase interval to 30 seconds to avoid rate limiting
    const interval = setInterval(fetchAnalytics, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const fetchedJobs = await getAllAIJobs(0, 1000)
      setJobs(fetchedJobs)
    } catch (error: any) {
      console.error("Failed to fetch AI jobs:", error)
      // Don't show error for rate limits, just log it
      if (error?.message?.includes("Too Many Requests") || error?.message?.includes("429")) {
        // Silently handle rate limits - don't update state to avoid UI flicker
        return
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const data = await getAIJobAnalytics()
      setAnalytics(data)
    } catch (error: any) {
      console.error("Failed to fetch analytics:", error)
      // Don't show error for rate limits or network errors during auto-refresh
      if (error?.message?.includes("Too Many Requests") || 
          error?.message?.includes("429") ||
          error?.message?.includes("Failed to fetch")) {
        // Silently handle - will retry on next interval
        return
      }
    }
  }

  const handleDelete = async (jobId: string) => {
    try {
      await deleteAIJob(jobId)
      setJobs((prev) => prev.filter((j) => j.job_id !== jobId))
      addToast("Job deleted successfully", "success")
    } catch (error: any) {
      console.error("Failed to delete job:", error)
      addToast(`Failed to delete job: ${error.message}`, "error")
    }
  }

  const handleCancel = async (jobId: string) => {
    try {
      await cancelAIJob(jobId)
      await fetchJobs()
      addToast("Job cancellation requested", "info")
    } catch (error: any) {
      console.error("Failed to cancel job:", error)
      addToast(`Failed to cancel job: ${error.message}`, "error")
    }
  }

  const handleRetry = async (jobId: string) => {
    try {
      await retryAIJob(jobId)
      await fetchJobs()
      addToast("Job retry requested", "success")
    } catch (error: any) {
      console.error("Failed to retry job:", error)
      addToast(`Failed to retry job: ${error.message}`, "error")
    }
  }

  const handleBulkRetry = async (jobIds: string[]) => {
    const results = {
      success: 0,
      failed: 0,
    }
    
    for (const jobId of jobIds) {
      try {
        await retryAIJob(jobId)
        results.success++
      } catch (error: any) {
        results.failed++
        console.error(`Failed to retry job ${jobId}:`, error)
      }
    }
    
    await fetchJobs()
    
    if (results.success > 0) {
      addToast(`Successfully retried ${results.success} job${results.success === 1 ? "" : "s"}`, "success")
    }
    if (results.failed > 0) {
      addToast(`Failed to retry ${results.failed} job${results.failed === 1 ? "" : "s"}`, "error")
    }
  }

  const handleExport = async (options: {
    format: "json" | "csv" | "xlsx"
    scope: "all" | "filtered" | "selected"
    dataLevel: "basic" | "summary" | "full"
  }) => {
    await exportAIJobs(jobs, filteredJobs, Array.from(selectedJobIds), options)
  }

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = job.url.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filter === "all" || job.status === filter
    return matchesSearch && matchesFilter
  })

  // Pagination
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedJobs = filteredJobs.slice(startIndex, endIndex)

  const handleSelectJob = (jobId: string, selected: boolean) => {
    setSelectedJobIds((prev) => {
      const newSet = new Set(prev)
      if (selected) {
        newSet.add(jobId)
      } else {
        newSet.delete(jobId)
      }
      return newSet
    })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedJobIds(new Set(paginatedJobs.map((job) => job.job_id)))
    } else {
      setSelectedJobIds(new Set())
    }
  }

  const handleBulkDelete = async () => {
    if (selectedJobIds.size === 0) {
      addToast("Please select at least one job to delete", "warning")
      return
    }

    const jobIdsArray = Array.from(selectedJobIds)
    let success = 0
    let failed = 0

    for (const jobId of jobIdsArray) {
      try {
        await deleteAIJob(jobId)
        success++
      } catch (error: any) {
        failed++
        console.error(`Failed to delete job ${jobId}:`, error)
      }
    }

    setSelectedJobIds(new Set())
    await fetchJobs()

    if (success > 0) {
      addToast(`Successfully deleted ${success} job${success === 1 ? "" : "s"}`, "success")
    }
    if (failed > 0) {
      addToast(`Failed to delete ${failed} job${failed === 1 ? "" : "s"}`, "error")
    }
  }

  const allSelected = paginatedJobs.length > 0 && paginatedJobs.every((job) => selectedJobIds.has(job.job_id))

  const filterOptions = [
    { value: "all", label: "All Status" },
    { value: "pending", label: "Pending" },
    { value: "processing", label: "Processing" },
    { value: "completed", label: "Completed" },
    { value: "failed", label: "Failed" },
  ]

  const currentFilterLabel = filterOptions.find((opt) => opt.value === filter)?.label || "All Status"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">AI Jobs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI-powered web scraping with LLM extraction
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === "jobs" ? "default" : "outline"}
            onClick={() => setActiveTab("jobs")}
            size="sm"
          >
            Jobs
          </Button>
          <Button
            variant={activeTab === "scratcher" ? "default" : "outline"}
            onClick={() => setActiveTab("scratcher")}
            size="sm"
          >
            Scratcher
          </Button>
        </div>
      </div>

      {activeTab === "scratcher" ? (
        <ScratcherView />
      ) : (
        <>
      <div className="flex items-center justify-between">
        <div></div>
        <div className="flex items-center gap-2">
          <QuickActions />
          <CreateAIJobDialog onSuccess={fetchJobs} />
          {jobs.length > 0 && (
            <>
              <Button
                variant="outline"
                onClick={() => setShowExportDialog(true)}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowBulkRetryDialog(true)}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Bulk Retry
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowBulkFollowUp(true)}
                className="gap-2"
              >
                <Mail className="h-4 w-4" />
                Bulk Follow-ups
              </Button>
              <DeleteAllDialog
                onConfirm={async () => {
                  try {
                    const result = await deleteAllAIJobs()
                  setJobs([])
                  await fetchJobs()
                    addToast(
                      `All AI jobs deleted successfully (${result.jobs_deleted} jobs, ${result.s3_objects_deleted} S3 objects)`,
                      "success"
                    )
                  } catch (error: any) {
                    addToast(error.message || "Failed to delete all AI jobs", "error")
                  }
                }}
                title="Delete All AI Jobs"
                description="This will permanently delete all AI jobs, emails, follow-ups, and their associated data (S3 files)."
                itemType="AI Jobs"
              />
            </>
          )}
        </div>
      </div>

      {analytics && (
        <Card>
          <CardHeader className="pb-3">
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="flex items-center justify-between w-full"
            >
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Analytics
              </CardTitle>
              {showAnalytics ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </CardHeader>
          {showAnalytics && (
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <div className="text-2xl font-bold">{analytics.total_jobs}</div>
                  <div className="text-xs text-muted-foreground">Total Jobs</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{analytics.completed_jobs}</div>
                  <div className="text-xs text-muted-foreground">Completed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{analytics.failed_jobs}</div>
                  <div className="text-xs text-muted-foreground">Failed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    ${analytics.total_cost_usd.toFixed(4)}
                  </div>
                  <div className="text-xs text-muted-foreground">Total Cost</div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Success Rate: {analytics.success_rate}% | Avg Time:{" "}
                {analytics.avg_processing_time_ms
                  ? `${(analytics.avg_processing_time_ms / 1000).toFixed(1)}s`
                  : "N/A"}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      <CostDashboard />

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <FilterDialog
          filter={filter}
          onFilterChange={(value: any) => setFilter(value)}
          options={filterOptions}
          title="Filter AI Jobs"
          description="Select a status to filter jobs"
        />
        <div className="text-sm text-muted-foreground min-w-[100px] text-right">
          {currentFilterLabel}
        </div>
      </div>

      {filteredJobs.length > 0 && (
        <Card>
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="select-all"
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label htmlFor="select-all" className="text-sm cursor-pointer">
                    Select All ({paginatedJobs.length} on this page)
                  </Label>
                </div>
                {selectedJobIds.size > 0 && (
                  <>
                    <Separator orientation="vertical" className="h-6" />
                    <Badge variant="outline" className="text-sm">
                      {selectedJobIds.size} selected
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkDelete}
                      className="gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Selected
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const jobIdsArray = Array.from(selectedJobIds)
                        handleBulkRetry(jobIdsArray)
                        setSelectedJobIds(new Set())
                      }}
                      className="gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Retry Selected
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && jobs.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredJobs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">
              {jobs.length === 0
                ? "No AI jobs yet. Create your first job above."
                : "No jobs match your filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {paginatedJobs.map((job) => (
              <AIJobCardAdvanced
                key={job.job_id}
                job={job}
                onDelete={handleDelete}
                onCancel={handleCancel}
                onRetry={handleRetry}
                selected={selectedJobIds.has(job.job_id)}
                onSelect={handleSelectJob}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center pt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        if (currentPage > 1) setCurrentPage((prev) => prev - 1)
                      }}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  {Array.from({ length: Math.min(10, totalPages) }, (_, i) => {
                    let pageNum: number
                    if (totalPages <= 10) {
                      pageNum = i + 1
                    } else if (currentPage <= 5) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 4) {
                      pageNum = totalPages - 9 + i
                    } else {
                      pageNum = currentPage - 5 + i
                    }
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            setCurrentPage(pageNum)
                          }}
                          isActive={currentPage === pageNum}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  })}
                  {totalPages > 10 && currentPage < totalPages - 4 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        if (currentPage < totalPages) setCurrentPage((prev) => prev + 1)
                      }}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}

      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        onExport={handleExport}
        totalCount={jobs.length}
        filteredCount={filteredJobs.length}
        selectedCount={selectedJobIds.size}
        jobType="ai"
      />

      <BulkRetryDialog
        open={showBulkRetryDialog}
        onOpenChange={setShowBulkRetryDialog}
        jobs={filteredJobs}
        onRetry={handleBulkRetry}
        jobType="ai"
      />

      <BulkFollowUpDialog
        open={showBulkFollowUp}
        onOpenChange={setShowBulkFollowUp}
        onSuccess={fetchJobs}
      />

      <KeyboardShortcuts open={showShortcuts} onOpenChange={setShowShortcuts} />
        </>
      )}
    </div>
  )
}

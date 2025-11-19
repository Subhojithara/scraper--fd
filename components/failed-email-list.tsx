"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, RefreshCw, AlertCircle, RotateCcw, Filter, X } from "lucide-react"
import { getFailedEmails, retryEmail, bulkRetryEmails, retryEmailsByError, getFailedEmailStats, getUnifiedJobs, EmailJob, JobAI } from "@/lib/api"
import { useToast } from "@/components/toast"
import { formatDistanceToNow } from "date-fns"

interface FailedEmailListProps {
  onRetry?: () => void
}

export function FailedEmailList({ onRetry }: FailedEmailListProps) {
  const { addToast } = useToast()
  const [emails, setEmails] = React.useState<EmailJob[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedEmails, setSelectedEmails] = React.useState<Set<string>>(new Set())
  const [retryingIds, setRetryingIds] = React.useState<Set<string>>(new Set())
  const [errorTypeFilter, setErrorTypeFilter] = React.useState<string>("")
  const [errorPattern, setErrorPattern] = React.useState<string>("")
  const [jobFilter, setJobFilter] = React.useState<string>("")
  const [availableErrorTypes, setAvailableErrorTypes] = React.useState<string[]>([])
  const [availableJobs, setAvailableJobs] = React.useState<JobAI[]>([])

  const loadEmails = React.useCallback(async () => {
    try {
      setLoading(true)
      const data = await getFailedEmails(0, 100, errorTypeFilter || undefined, jobFilter || undefined)
      setEmails(data)
    } catch (error: any) {
      addToast(error.message || "Failed to load failed emails", "error")
    } finally {
      setLoading(false)
    }
  }, [errorTypeFilter, jobFilter, addToast])

  const loadFilters = React.useCallback(async () => {
    try {
      // Load error types from stats
      const stats = await getFailedEmailStats()
      const errorTypes = Object.keys(stats.failed_by_error_type)
      setAvailableErrorTypes(errorTypes)
      
      // Load available jobs
      const jobsData = await getUnifiedJobs(0, 1000)
      setAvailableJobs(jobsData.ai_jobs)
    } catch (error: any) {
      console.error("Failed to load filters:", error)
    }
  }, [])

  React.useEffect(() => {
    loadFilters()
  }, [loadFilters])

  React.useEffect(() => {
    loadEmails()
  }, [loadEmails])

  const handleRetry = async (emailId: string) => {
    try {
      setRetryingIds(prev => new Set(prev).add(emailId))
      await retryEmail(emailId)
      addToast("Email retry initiated", "success")
      loadEmails()
      onRetry?.()
    } catch (error: any) {
      addToast(error.message || "Failed to retry email", "error")
    } finally {
      setRetryingIds(prev => {
        const next = new Set(prev)
        next.delete(emailId)
        return next
      })
    }
  }

  const handleBulkRetry = async () => {
    if (selectedEmails.size === 0) {
      addToast("Please select emails to retry", "warning")
      return
    }

    try {
      setRetryingIds(selectedEmails)
      const bulkRequest: any = {}
      if (errorTypeFilter) {
        bulkRequest.error_type = errorTypeFilter
      }
      if (jobFilter) {
        bulkRequest.job_ai_id = jobFilter
      }
      await bulkRetryEmails(bulkRequest)
      addToast(`Retrying ${selectedEmails.size} emails`, "success")
      setSelectedEmails(new Set())
      loadEmails()
      onRetry?.()
    } catch (error: any) {
      addToast(error.message || "Failed to bulk retry emails", "error")
    } finally {
      setRetryingIds(new Set())
    }
  }

  const handleRetryByError = async () => {
    if (!errorPattern.trim()) {
      addToast("Please enter an error pattern", "warning")
      return
    }

    try {
      await retryEmailsByError({ error_pattern: errorPattern })
      addToast("Retrying emails by error pattern", "success")
      setErrorPattern("")
      loadEmails()
      onRetry?.()
    } catch (error: any) {
      addToast(error.message || "Failed to retry by error pattern", "error")
    }
  }

  const toggleSelect = (emailId: string) => {
    setSelectedEmails(prev => {
      const next = new Set(prev)
      if (next.has(emailId)) {
        next.delete(emailId)
      } else {
        next.add(emailId)
      }
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedEmails.size === emails.length) {
      setSelectedEmails(new Set())
    } else {
      setSelectedEmails(new Set(emails.map(e => e.email_id)))
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Failed Emails</CardTitle>
            <CardDescription>Manage and retry failed email generations</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadEmails}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-2 flex-wrap items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            
            <Select value={errorTypeFilter || "all"} onValueChange={(value) => setErrorTypeFilter(value === "all" ? "" : value)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Error Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Error Types</SelectItem>
                {availableErrorTypes.map((errorType) => (
                  <SelectItem key={errorType} value={errorType}>
                    {errorType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={jobFilter || "all"} onValueChange={(value) => setJobFilter(value === "all" ? "" : value)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Job" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jobs</SelectItem>
                {availableJobs.map((job) => (
                  <SelectItem key={job.job_id} value={job.job_id}>
                    {job.url || job.job_id.substring(0, 8)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(errorTypeFilter || jobFilter) && (
              <Button variant="outline" size="sm" onClick={() => {
                setErrorTypeFilter("")
                setJobFilter("")
              }}>
                <X className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            )}
          </div>

          {/* Retry by Error Pattern */}
          <div className="flex gap-2 items-center">
            <Input
              placeholder="Retry emails matching error pattern..."
              value={errorPattern}
              onChange={(e) => setErrorPattern(e.target.value)}
              className="max-w-xs"
            />
            <Button onClick={handleRetryByError} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Retry by Pattern
            </Button>
          </div>

          {/* Bulk Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {selectedEmails.size > 0 && (
              <div className="flex items-center gap-2 p-2 bg-muted rounded">
                <span className="text-sm font-medium">{selectedEmails.size} selected</span>
                <Button size="sm" onClick={handleBulkRetry} disabled={retryingIds.size > 0}>
                  {retryingIds.size > 0 ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4 mr-2" />
                  )}
                  Retry Selected
                </Button>
                <Button size="sm" variant="outline" onClick={() => setSelectedEmails(new Set())}>
                  Clear Selection
                </Button>
              </div>
            )}
            
            {/* Bulk retry by filters */}
            {(errorTypeFilter || jobFilter) && emails.length > 0 && (
              <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950 rounded">
                <span className="text-sm font-medium">Filtered: {emails.length} emails</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    try {
                      const bulkRequest: any = {}
                      if (errorTypeFilter) {
                        bulkRequest.error_type = errorTypeFilter
                      }
                      if (jobFilter) {
                        bulkRequest.job_ai_id = jobFilter
                      }
                      await bulkRetryEmails(bulkRequest)
                      addToast("Bulk retry initiated for filtered emails", "success")
                      loadEmails()
                      onRetry?.()
                    } catch (error: any) {
                      addToast(error.message || "Failed to bulk retry", "error")
                    }
                  }}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retry All Filtered
                </Button>
              </div>
            )}
          </div>

          {/* Email List */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : emails.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No failed emails found</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 border-b">
                <Checkbox
                  checked={selectedEmails.size === emails.length && emails.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
                <span className="text-sm font-medium">Select All</span>
              </div>
              {emails.map((email) => (
                <div
                  key={email.email_id}
                  className="flex items-center gap-3 p-3 border rounded hover:bg-muted/50"
                >
                  <Checkbox
                    checked={selectedEmails.has(email.email_id)}
                    onCheckedChange={() => toggleSelect(email.email_id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="destructive">Failed</Badge>
                      {email.retry_count > 0 && (
                        <Badge variant="outline">Retries: {email.retry_count}</Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(email.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm font-medium truncate">{email.email_prompt}</p>
                    {email.error_message && (
                      <p className="text-xs text-destructive mt-1 line-clamp-2">
                        {email.error_message}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRetry(email.email_id)}
                    disabled={retryingIds.has(email.email_id)}
                  >
                    {retryingIds.has(email.email_id) ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Retry
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}


"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Download,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Eye,
  Mail,
  FileText,
  Loader2,
  ExternalLink,
} from "lucide-react"
import { getAllAIJobs, getEmailsForJob, getFollowUpsForEmail, JobAI, EmailJob, FollowUp } from "@/lib/api"
import { useToast } from "@/components/toast"
import { exportScratcherData } from "@/lib/export-utils-scratcher"

interface ScratcherJobData {
  job: JobAI
  emails: EmailJob[]
  followUps: FollowUp[]
  markdownContent?: string
}

export function ScratcherView() {
  const { addToast } = useToast()
  const [loading, setLoading] = React.useState(true)
  const [jobsData, setJobsData] = React.useState<ScratcherJobData[]>([])
  const [filteredData, setFilteredData] = React.useState<ScratcherJobData[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set())
  const [loadingMarkdown, setLoadingMarkdown] = React.useState<Set<string>>(new Set())
  const [markdownCache, setMarkdownCache] = React.useState<Record<string, string>>({})

  React.useEffect(() => {
    loadData()
  }, [])

  React.useEffect(() => {
    filterData()
  }, [searchQuery, jobsData])

  const loadData = async () => {
    setLoading(true)
    try {
      const jobs = await getAllAIJobs(0, 1000)
      const data: ScratcherJobData[] = []

      for (const job of jobs) {
        try {
          const emails = await getEmailsForJob(job.job_id)
          const followUps: FollowUp[] = []
          
          for (const email of emails) {
            try {
              const emailFollowUps = await getFollowUpsForEmail(email.email_id)
              followUps.push(...emailFollowUps)
            } catch (error) {
              // Silently fail for follow-ups
            }
          }

          // Try to load markdown content if available
          let markdownContent = ""
          if (job.markdown_s3_key) {
            try {
              const { getAIJobMarkdown } = await import("@/lib/api")
              markdownContent = await getAIJobMarkdown(job.job_id)
            } catch (error) {
              // Silently fail - markdown will be empty
            }
          }

          data.push({
            job,
            emails,
            followUps,
            markdownContent,
          })
        } catch (error) {
          // Continue with empty emails/follow-ups
          data.push({
            job,
            emails: [],
            followUps: [],
            markdownContent: "",
          })
        }
      }

      setJobsData(data)
      setFilteredData(data)
    } catch (error: any) {
      addToast(error.message || "Failed to load data", "error")
    } finally {
      setLoading(false)
    }
  }

  const filterData = () => {
    if (!searchQuery.trim()) {
      setFilteredData(jobsData)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = jobsData.filter((item) => {
      return (
        item.job.url.toLowerCase().includes(query) ||
        item.job.job_id.toLowerCase().includes(query) ||
        item.job.status.toLowerCase().includes(query) ||
        item.emails.some((e) => e.email_content?.toLowerCase().includes(query)) ||
        item.followUps.some((f) => f.email_content?.toLowerCase().includes(query))
      )
    })
    setFilteredData(filtered)
  }

  const toggleRow = (jobId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(jobId)) {
      newExpanded.delete(jobId)
    } else {
      newExpanded.add(jobId)
    }
    setExpandedRows(newExpanded)
  }

  const loadMarkdown = async (jobId: string, s3Key?: string) => {
    if (markdownCache[jobId] || !s3Key) return

    setLoadingMarkdown((prev) => new Set(prev).add(jobId))
    try {
      const { getAIJobMarkdown } = await import("@/lib/api")
      const content = await getAIJobMarkdown(jobId)
      setMarkdownCache((prev) => ({
        ...prev,
        [jobId]: content,
      }))
      // Update the data with markdown content for export
      setJobsData((prev) =>
        prev.map((item) =>
          item.job.job_id === jobId
            ? { ...item, markdownContent: content }
            : item
        )
      )
      setFilteredData((prev) =>
        prev.map((item) =>
          item.job.job_id === jobId
            ? { ...item, markdownContent: content }
            : item
        )
      )
    } catch (error) {
      addToast("Failed to load markdown content", "error")
    } finally {
      setLoadingMarkdown((prev) => {
        const newSet = new Set(prev)
        newSet.delete(jobId)
        return newSet
      })
    }
  }

  const handleExport = async (format: "csv" | "json" | "excel") => {
    try {
      await exportScratcherData(filteredData, format)
      addToast(`Exported to ${format.toUpperCase()} successfully`, "success")
    } catch (error: any) {
      addToast(error.message || "Export failed", "error")
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      failed: "destructive",
      processing: "secondary",
      pending: "outline",
    }
    return (
      <Badge variant={variants[status] || "outline"}>
        {status}
      </Badge>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">Loading data...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Scratcher - All AI Jobs</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Comprehensive view of all jobs, emails, and follow-ups
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleExport("csv")}>
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("json")}>
              Export as JSON
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("excel")}>
              Export as Excel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <Input
              placeholder="Search by URL, ID, status, or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Job ID</TableHead>
                  <TableHead>Website URL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Emails</TableHead>
                  <TableHead>Follow-ups</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No data found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((item) => {
                    const isExpanded = expandedRows.has(item.job.job_id)
                    const totalCost = item.emails.reduce((sum, e) => sum + (e.cost_usd || 0), 0) +
                      item.followUps.reduce((sum, f) => sum + (f.cost_usd || 0), 0)

                    return (
                      <React.Fragment key={item.job.job_id}>
                        <TableRow>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRow(item.job.job_id)}
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {item.job.job_id.substring(0, 8)}...
                          </TableCell>
                          <TableCell>
                            <a
                              href={item.job.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-1"
                            >
                              {item.job.url}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </TableCell>
                          <TableCell>{getStatusBadge(item.job.status)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.emails.length}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.followUps.length}</Badge>
                          </TableCell>
                          <TableCell>${totalCost.toFixed(4)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(item.job.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow>
                            <TableCell colSpan={8} className="bg-muted/50">
                              <div className="p-4 space-y-4">
                                {/* Markdown Data */}
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-medium flex items-center gap-2">
                                      <FileText className="h-4 w-4" />
                                      Markdown Data
                                    </h4>
                                    {item.job.markdown_s3_key && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => loadMarkdown(item.job.job_id, item.job.markdown_s3_key || undefined)}
                                        disabled={loadingMarkdown.has(item.job.job_id)}
                                      >
                                        {loadingMarkdown.has(item.job.job_id) ? (
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                          <Eye className="h-3 w-3" />
                                        )}
                                        View
                                      </Button>
                                    )}
                                  </div>
                                  {markdownCache[item.job.job_id] ? (
                                    <div className="p-3 bg-background rounded border text-sm max-h-40 overflow-y-auto">
                                      <pre className="whitespace-pre-wrap">{markdownCache[item.job.job_id]}</pre>
                                    </div>
                                  ) : item.job.markdown_s3_key ? (
                                    <p className="text-sm text-muted-foreground">
                                      Click "View" to load markdown content
                                    </p>
                                  ) : (
                                    <p className="text-sm text-muted-foreground">No markdown data available</p>
                                  )}
                                </div>

                                {/* Emails */}
                                {item.emails.length > 0 && (
                                  <div>
                                    <h4 className="font-medium flex items-center gap-2 mb-2">
                                      <Mail className="h-4 w-4" />
                                      Emails ({item.emails.length})
                                    </h4>
                                    <div className="space-y-2">
                                      {item.emails.map((email) => (
                                        <div key={email.email_id} className="p-3 bg-background rounded border">
                                          <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                              {getStatusBadge(email.status)}
                                              <span className="text-xs text-muted-foreground">
                                                ${email.cost_usd?.toFixed(4) || "0.0000"}
                                              </span>
                                            </div>
                                          </div>
                                          {email.email_content && (
                                            <p className="text-sm line-clamp-3 mt-2">
                                              {email.email_content}
                                            </p>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Follow-ups */}
                                {item.followUps.length > 0 && (
                                  <div>
                                    <h4 className="font-medium flex items-center gap-2 mb-2">
                                      <Mail className="h-4 w-4" />
                                      Follow-ups ({item.followUps.length})
                                    </h4>
                                    <div className="space-y-2">
                                      {item.followUps.map((followUp) => (
                                        <div key={followUp.follow_up_id} className="p-3 bg-background rounded border">
                                          <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                              {getStatusBadge(followUp.status)}
                                              <span className="text-xs text-muted-foreground">
                                                Sequence {followUp.sequence_number} • ${followUp.cost_usd?.toFixed(4) || "0.0000"}
                                              </span>
                                            </div>
                                          </div>
                                          {followUp.email_content && (
                                            <p className="text-sm line-clamp-3 mt-2">
                                              {followUp.email_content}
                                            </p>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


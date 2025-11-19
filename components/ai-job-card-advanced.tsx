"use client"

import * as React from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ExternalLink,
  Trash2,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
  DollarSign,
  Brain,
  FileJson,
  FileText,
  Database,
  Code,
  Info,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { JobAI } from "@/lib/api"
import { AdvancedDataViewer } from "@/components/advanced-data-viewer"
import { StructuredJSONViewer } from "@/components/structured-json-viewer"
import { useToast } from "@/components/toast"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { EmailGenerationDialog } from "@/components/email-generation-dialog"
import { EmailListCollapsible } from "@/components/email-list-collapsible"
import { Mail } from "lucide-react"
import { getEmailsForJob } from "@/lib/api"

interface AIJobCardAdvancedProps {
  job: JobAI
  onDelete?: (jobId: string) => void
  onRetry?: (jobId: string) => void
  onCancel?: (jobId: string) => void
  selected?: boolean
  onSelect?: (jobId: string, selected: boolean) => void
}

const statusConfig = {
  pending: { label: "Pending", variant: "secondary" as const, icon: Clock },
  processing: { label: "Processing", variant: "default" as const, icon: Loader2 },
  cleaning: { label: "Cleaning", variant: "default" as const, icon: Loader2 },
  completed: { label: "Completed", variant: "default" as const, icon: CheckCircle2 },
  failed: { label: "Failed", variant: "destructive" as const, icon: XCircle },
  cancelled: { label: "Cancelled", variant: "secondary" as const, icon: X },
}

export function AIJobCardAdvanced({
  job,
  onDelete,
  onRetry,
  onCancel,
  selected = false,
  onSelect,
}: AIJobCardAdvancedProps) {
  const [failedEmailCount, setFailedEmailCount] = React.useState<number | null>(null)

  // Load failed email count for completed jobs
  React.useEffect(() => {
    if (job.status === "completed") {
      getEmailsForJob(job.job_id)
        .then(emails => {
          const failed = emails.filter(e => e.status === "failed").length
          setFailedEmailCount(failed)
        })
        .catch(() => {
          // Silently fail - not critical
        })
    }
  }, [job.job_id, job.status])
  const { addToast } = useToast()
  const [jsonData, setJsonData] = React.useState<any>(null)
  const [markdownData, setMarkdownData] = React.useState<string | null>(null)
  const [metadataData, setMetadataData] = React.useState<any>(null)
  const [cleanedData, setCleanedData] = React.useState<string | null>(null)
  const [loadingData, setLoadingData] = React.useState<string | null>(null)
  const [openSection, setOpenSection] = React.useState<string | null>(null)

  const handleLoadData = async (type: "json" | "markdown" | "metadata" | "cleaned") => {
    if (openSection === type) {
      setOpenSection(null)
      return
    }
    
    setOpenSection(type)
    setLoadingData(type)
    try {
      const api = await import("@/lib/api")
      if (type === "json") {
        const data = await api.getAIJobJSON(job.job_id)
        setJsonData(data)
        addToast(`JSON data loaded successfully`, "success")
      } else if (type === "markdown") {
        const data = await api.getAIJobMarkdown(job.job_id)
        setMarkdownData(data)
        addToast(`Markdown data loaded successfully`, "success")
      } else if (type === "metadata") {
        const data = await api.getAIJobMetadata(job.job_id)
        setMetadataData(data)
        addToast(`Metadata loaded successfully`, "success")
      } else if (type === "cleaned") {
        const data = await api.getAIJobCleanedData(job.job_id)
        setCleanedData(data)
        addToast(`Cleaned data loaded successfully`, "success")
      }
    } catch (error: any) {
      console.error(`Failed to load ${type} data:`, error)
      addToast(`Failed to load ${type} data: ${error.message}`, "error")
    } finally {
      setLoadingData(null)
    }
  }

  const handleDelete = () => {
    if (onDelete) {
      onDelete(job.job_id)
      addToast("Job deleted successfully", "success")
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel(job.job_id)
      addToast("Job cancellation requested", "info")
    }
  }

  const handleRetry = () => {
    if (onRetry) {
      onRetry(job.job_id)
      addToast("Job retry requested", "info")
    }
  }

  const status = statusConfig[job.status as keyof typeof statusConfig] || statusConfig.pending
  const StatusIcon = status.icon

  return (
    <Card className={cn(
      "group relative overflow-hidden border-border/50 hover:border-border/80 transition-all duration-300 shadow-sm hover:shadow-md",
      "bg-gradient-to-br from-card via-card to-card/95",
      selected && "border-primary/50 bg-primary/5 shadow-lg shadow-primary/10 ring-2 ring-primary/20",
      "hover:scale-[1.01]"
    )}>
      {/* Gradient accent bar */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r transition-opacity duration-300",
        job.status === "completed" && "from-green-500 via-emerald-500 to-green-400",
        job.status === "processing" && "from-blue-500 via-cyan-500 to-blue-400 animate-pulse",
        job.status === "failed" && "from-red-500 via-rose-500 to-red-400",
        job.status === "pending" && "from-yellow-500 via-amber-500 to-yellow-400",
        "opacity-60 group-hover:opacity-100"
      )} />
      
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03] bg-[radial-gradient(circle_at_50%_50%,var(--primary)_1px,transparent_1px)] bg-[length:20px_20px]" />
      
      <CardHeader className="pb-3 relative">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {onSelect && (
              <Checkbox
                checked={selected}
                onCheckedChange={(checked) => onSelect?.(job.job_id, checked as boolean)}
                className="mt-1 shrink-0 border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge 
                  variant={status.variant} 
                  className={cn(
                    "text-xs font-semibold shadow-sm transition-all duration-200",
                    "border-2",
                    job.status === "completed" && "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
                    job.status === "processing" && "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
                    job.status === "failed" && "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
                    job.status === "pending" && "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20"
                  )}
                >
                  <StatusIcon className={cn(
                    "h-3 w-3 mr-1",
                    (job.status === "processing" || job.status === "cleaning") && "animate-spin"
                  )} />
                  {status.label}
                </Badge>
                <Badge 
                  variant="outline" 
                  className="text-xs font-medium bg-muted/50 border-border/50 hover:bg-muted transition-colors"
                >
                  <Brain className="h-3 w-3 mr-1 text-primary" />
                  {job.llm_provider === "none" ? "No LLM" : job.llm_provider}
                </Badge>
                <span className="text-xs text-muted-foreground font-medium px-2 py-0.5 rounded-md bg-muted/30">
                  {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                </span>
              </div>
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold hover:text-primary transition-colors flex items-center gap-1.5 truncate group/link"
              >
                <span className="truncate">{job.url}</span>
                <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 opacity-60 group-hover/link:opacity-100 group-hover/link:translate-x-0.5 transition-all" />
              </a>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {["pending", "processing", "cleaning"].includes(job.status) && onCancel && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleCancel}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            {job.status === "failed" && onRetry && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleRetry}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 relative">
        {job.error_message && (
          <div className="rounded-lg border-2 border-destructive/50 bg-destructive/10 backdrop-blur-sm p-3 text-sm text-destructive font-medium shadow-sm">
            <div className="flex items-start gap-2">
              <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{job.error_message}</span>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 hover:bg-accent/80 hover:border-accent-foreground/20 transition-all shadow-sm">
                <Info className="h-3.5 w-3.5" />
                Basic Info
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-80">
              <DropdownMenuLabel>Basic Information</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="p-2 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{new Date(job.created_at).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Updated:</span>
                  <span>{new Date(job.updated_at).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Strategy:</span>
                  <Badge variant="outline" className="text-xs">{job.strategy}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Output Format:</span>
                  <Badge variant="outline" className="text-xs">{job.output_format}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pages Crawled:</span>
                  <span>{job.pages_crawled}</span>
                </div>
                {job.processing_time_ms && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Processing Time:</span>
                    <span>{(job.processing_time_ms / 1000).toFixed(2)}s</span>
                  </div>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {(job.cost_usd || job.tokens_used) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 hover:bg-accent/80 hover:border-accent-foreground/20 transition-all shadow-sm">
                  <DollarSign className="h-3.5 w-3.5" />
                  Costs & Tokens
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuLabel>Costs & Tokens</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="p-2 space-y-2 text-xs">
                  {job.cost_usd && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cost:</span>
                      <span className="font-medium">${job.cost_usd.toFixed(6)}</span>
                    </div>
                  )}
                  {job.tokens_used && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tokens:</span>
                      <span className="font-medium">{job.tokens_used.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Show JSON button if S3 key exists OR if job is completed with output format that includes JSON */}
          {(job.json_s3_key || (job.status === "completed" && (job.output_format === "json" || job.output_format === "both"))) && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 hover:bg-accent/80 hover:border-accent-foreground/20 transition-all shadow-sm"
              onClick={() => handleLoadData("json")}
              disabled={loadingData === "json"}
            >
              <FileJson className="h-3.5 w-3.5" />
              JSON Data
              {loadingData === "json" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            </Button>
          )}

          {/* Show Markdown button if S3 key exists OR if job is completed with output format that includes markdown */}
          {(job.markdown_s3_key || (job.status === "completed" && (job.output_format === "markdown" || job.output_format === "both"))) && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 hover:bg-accent/80 hover:border-accent-foreground/20 transition-all shadow-sm"
              onClick={() => handleLoadData("markdown")}
              disabled={loadingData === "markdown"}
            >
              <FileText className="h-3.5 w-3.5" />
              Markdown Data
              {loadingData === "markdown" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            </Button>
          )}

          {/* Show Metadata button if S3 key exists OR if job is completed */}
          {(job.metadata_s3_key || job.status === "completed") && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 hover:bg-accent/80 hover:border-accent-foreground/20 transition-all shadow-sm"
              onClick={() => handleLoadData("metadata")}
              disabled={loadingData === "metadata"}
            >
              <Database className="h-3.5 w-3.5" />
              Metadata
              {loadingData === "metadata" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            </Button>
          )}

          {job.cleaned_s3_key && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-green-500/50 hover:border-green-500 hover:bg-green-500/10 transition-all shadow-sm"
              onClick={() => handleLoadData("cleaned")}
              disabled={loadingData === "cleaned"}
            >
              <Code className="h-3.5 w-3.5 text-green-600" />
              <span className="font-medium">Cleaned Data</span>
              {loadingData === "cleaned" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            </Button>
          )}

          {job.extracted_data && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 hover:bg-accent/80 hover:border-accent-foreground/20 transition-all shadow-sm"
              onClick={() => setOpenSection(openSection === "extracted" ? null : "extracted")}
            >
              <FileJson className="h-3.5 w-3.5" />
              Extracted Data
            </Button>
          )}

          {/* Email Generation - show for completed jobs (markdown may exist even if not in response) */}
          {job.status === "completed" && (
            <div className="flex items-center gap-2">
              <EmailGenerationDialog
                jobId={job.job_id}
                onSuccess={() => {
                  setOpenSection(openSection === "emails" ? null : "emails")
                  // Refresh failed count
                  getEmailsForJob(job.job_id)
                    .then(emails => {
                      const failed = emails.filter(e => e.status === "failed").length
                      setFailedEmailCount(failed)
                    })
                    .catch(() => {})
                }}
              />
              {failedEmailCount !== null && failedEmailCount > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <Mail className="h-3 w-3" />
                  {failedEmailCount} Failed
                </Badge>
              )}
            </div>
          )}
        </div>

        {openSection === "json" && jsonData && (
          <StructuredJSONViewer title="JSON Data" data={jsonData} defaultOpen />
        )}

        {openSection === "markdown" && markdownData && (
          <AdvancedDataViewer title="Markdown Data" data={markdownData} type="markdown" defaultOpen />
        )}

        {openSection === "metadata" && metadataData && (
          <StructuredJSONViewer title="Metadata" data={metadataData} defaultOpen />
        )}

        {openSection === "cleaned" && cleanedData && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
          <AdvancedDataViewer title="Cleaned Data" data={cleanedData} type="cleaned" defaultOpen />
          </div>
        )}
        
        {job.cleaned_s3_key && !cleanedData && openSection !== "cleaned" && (
          <div className="mt-2 p-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded text-sm text-green-700 dark:text-green-300">
            ✅ Cleaned data is available. Click "Cleaned Data" button to view.
          </div>
        )}

        {openSection === "extracted" && job.extracted_data && (
          <StructuredJSONViewer title="Extracted Data" data={job.extracted_data} defaultOpen />
        )}

        {/* Email List Section - Show for completed jobs (emails may exist even if markdown_s3_key is not in response) */}
        {job.status === "completed" && (
          <div className="mt-4">
            <EmailListCollapsible
              jobId={job.job_id}
              onRefresh={() => {
                // Refresh can be handled by EmailListCollapsible internally
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}


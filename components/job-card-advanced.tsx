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
  Info,
  FileText,
  Code,
  Search,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { Job } from "@/lib/api"
import { AdvancedDataViewer } from "@/components/advanced-data-viewer"
import { StructuredJSONViewer } from "@/components/structured-json-viewer"
import { JobTimeline } from "@/components/job-timeline"
import { useToast } from "@/components/toast"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

interface JobCardAdvancedProps {
  job: Job
  onDelete?: (jobId: string) => void
  onRetry?: (jobId: string) => void
  onViewData?: (jobId: string, type: "raw" | "cleaned" | "research") => Promise<void>
  selected?: boolean
  onSelect?: (jobId: string, selected: boolean) => void
}

const statusConfig = {
  pending: { label: "Pending", variant: "secondary" as const, icon: Clock },
  scraping: { label: "Scraping", variant: "default" as const, icon: Loader2 },
  scraped: { label: "Scraped", variant: "default" as const, icon: CheckCircle2 },
  cleaning: { label: "Cleaning", variant: "default" as const, icon: Loader2 },
  completed: { label: "Completed", variant: "default" as const, icon: CheckCircle2 },
  failed: { label: "Failed", variant: "destructive" as const, icon: XCircle },
  researching: { label: "Researching", variant: "default" as const, icon: Loader2 },
  research_completed: { label: "Research Complete", variant: "default" as const, icon: CheckCircle2 },
}

export function JobCardAdvanced({
  job,
  onDelete,
  onRetry,
  onViewData,
  selected = false,
  onSelect,
}: JobCardAdvancedProps) {
  const { addToast } = useToast()
  const [rawData, setRawData] = React.useState<any>(null)
  const [cleanedData, setCleanedData] = React.useState<any>(null)
  const [researchData, setResearchData] = React.useState<any>(null)
  const [loadingData, setLoadingData] = React.useState<string | null>(null)
  const [openSection, setOpenSection] = React.useState<string | null>(null)
  const [jobHistory, setJobHistory] = React.useState<any[]>([])
  const [showTimeline, setShowTimeline] = React.useState(false)

  const handleViewData = async (type: "raw" | "cleaned" | "research") => {
    if (openSection === type) {
      setOpenSection(null)
      return
    }

    setOpenSection(type)
    if (onViewData) {
      await onViewData(job.job_id, type)
      return
    }

    setLoadingData(type)
    try {
      const api = await import("@/lib/api")
      if (type === "raw") {
        const data = await api.getRawData(job.job_id)
        setRawData(data)
        addToast("Raw data loaded successfully", "success")
      } else if (type === "cleaned") {
        const data = await api.getCleanedData(job.job_id)
        setCleanedData(data)
        addToast("Cleaned data loaded successfully", "success")
      } else if (type === "research") {
        const data = await api.getResearchData(job.job_id)
        setResearchData(data)
        addToast("Research data loaded successfully", "success")
      }
    } catch (error: any) {
      console.error(`Failed to load ${type} data:`, error)
      addToast(`Failed to load ${type} data: ${error.message}`, "error")
    } finally {
      setLoadingData(null)
    }
  }

  const status = statusConfig[job.status as keyof typeof statusConfig] || statusConfig.pending
  const StatusIcon = status.icon
  
  // Calculate job duration
  const jobDuration = React.useMemo(() => {
    if (!job.created_at) return null
    const start = new Date(job.created_at)
    const end = job.updated_at ? new Date(job.updated_at) : new Date()
    const diffMs = end.getTime() - start.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)
    const diffHours = Math.floor(diffMinutes / 60)
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes % 60}m`
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m ${diffSeconds % 60}s`
    } else {
      return `${diffSeconds}s`
    }
  }, [job.created_at, job.updated_at])
  
  // Load job history when timeline is opened
  React.useEffect(() => {
    if (showTimeline && jobHistory.length === 0) {
      const loadHistory = async () => {
        try {
          const api = await import("@/lib/api")
          const history = await api.getJobStatusHistory(job.job_id)
          setJobHistory(history)
        } catch (error) {
          console.error("Failed to load job history:", error)
        }
      }
      loadHistory()
    }
  }, [showTimeline, job.job_id, jobHistory.length])

  return (
    <Card className={cn("border-border/50 hover:border-border transition-colors shadow-sm", selected && "border-primary bg-primary/5")}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {onSelect && (
              <Checkbox
                checked={selected}
                onCheckedChange={(checked) => onSelect?.(job.job_id, checked as boolean)}
                className="mt-1 shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={status.variant} className="text-xs">
                <StatusIcon className="h-3 w-3 mr-1" />
                {status.label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
              </span>
              {jobDuration && (
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {jobDuration}
                </Badge>
              )}
            </div>
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium hover:underline flex items-center gap-1 truncate"
            >
              {job.url}
              <ExternalLink className="h-3 w-3 flex-shrink-0" />
            </a>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {job.status === "failed" && onRetry && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 gap-1"
                onClick={() => onRetry(job.job_id)}
                title="Retry job"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="text-xs">Retry</span>
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                onClick={() => onDelete(job.job_id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {job.error_message && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
            {job.error_message}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
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
                  <span className="text-muted-foreground">Scraping:</span>
                  <Badge variant={job.enable_scraping ? "default" : "secondary"} className="text-xs">
                    {job.enable_scraping ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cleaning:</span>
                  <Badge variant={job.enable_cleaning ? "default" : "secondary"} className="text-xs">
                    {job.enable_cleaning ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Research:</span>
                  <Badge variant={job.enable_research ? "default" : "secondary"} className="text-xs">
                    {job.enable_research ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {job.s3_key && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => handleViewData("raw")}
              disabled={loadingData === "raw"}
            >
              <FileText className="h-3.5 w-3.5" />
              Raw Data
              {loadingData === "raw" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            </Button>
          )}

          {job.cleaned_s3_key && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-green-500/50 hover:border-green-500 hover:bg-green-500/10"
              onClick={() => handleViewData("cleaned")}
              disabled={loadingData === "cleaned"}
            >
              <Code className="h-3.5 w-3.5 text-green-600" />
              <span className="font-medium">Cleaned Data</span>
              {loadingData === "cleaned" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            </Button>
          )}

          {job.research_s3_key && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => handleViewData("research")}
              disabled={loadingData === "research"}
            >
              <Search className="h-3.5 w-3.5" />
              Research Data
              {loadingData === "research" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setShowTimeline(!showTimeline)}
          >
            <Clock className="h-3.5 w-3.5" />
            Timeline
          </Button>
        </div>

        {showTimeline && (
          <div className="mt-4">
            <JobTimeline history={jobHistory} />
          </div>
        )}

        {openSection === "raw" && rawData && (
          <AdvancedDataViewer
            title="Raw Data"
            data={rawData.content || rawData}
            type="raw"
            defaultOpen
          />
        )}

        {openSection === "cleaned" && cleanedData && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
            <AdvancedDataViewer
              title="Cleaned Data"
              data={cleanedData.content || cleanedData}
              type="cleaned"
              defaultOpen
            />
          </div>
        )}
        
        {job.cleaned_s3_key && !cleanedData && openSection !== "cleaned" && (
          <div className="mt-2 p-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded text-sm text-green-700 dark:text-green-300">
            ✅ Cleaned data is available. Click "Cleaned Data" button to view.
          </div>
        )}

        {openSection === "research" && researchData && (
          <div className="space-y-2">
            {researchData.summary && (
              <AdvancedDataViewer
                title="Research Summary"
                data={typeof researchData.summary === "string" ? researchData.summary : JSON.stringify(researchData.summary, null, 2)}
                type="research"
                defaultOpen
              />
            )}
            {researchData.insights && (
              <StructuredJSONViewer
                title="Research Insights"
                data={researchData.insights}
                defaultOpen
              />
            )}
            {researchData.topics && (
              <StructuredJSONViewer
                title="Research Topics"
                data={researchData.topics}
                defaultOpen
              />
            )}
            {researchData.entities && (
              <StructuredJSONViewer
                title="Research Entities"
                data={researchData.entities}
                defaultOpen
              />
            )}
            {researchData.metadata && (
              <StructuredJSONViewer
                title="Research Metadata"
                data={researchData.metadata}
                defaultOpen
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}


"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  Mail, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Loader2,
  Calendar,
  Eye,
  RotateCcw
} from "lucide-react"
import { 
  getFollowUpsForEmail, 
  retryFollowUp, 
  FollowUp,
  FollowUpRetryRequest 
} from "@/lib/api"
import { useToast } from "@/components/toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface FollowUpListProps {
  emailId: string
  onRetry?: () => void
}

const getSequenceLabel = (num: number): string => {
  const labels: Record<number, string> = {
    1: "1st",
    2: "2nd",
    3: "3rd",
    4: "4th",
  }
  return labels[num] || `${num}th`
}

const getStatusBadge = (status: string) => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    completed: "default",
    failed: "destructive",
    pending: "secondary",
    processing: "outline",
    scheduled: "outline",
  }

  const icons: Record<string, React.ReactNode> = {
    completed: <CheckCircle2 className="h-3 w-3" />,
    failed: <XCircle className="h-3 w-3" />,
    pending: <Clock className="h-3 w-3" />,
    processing: <Loader2 className="h-3 w-3 animate-spin" />,
    scheduled: <Calendar className="h-3 w-3" />,
  }

  return (
    <Badge variant={variants[status] || "secondary"} className="gap-1">
      {icons[status]}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}

export function FollowUpList({ emailId, onRetry }: FollowUpListProps) {
  const { addToast } = useToast()
  const [followUps, setFollowUps] = React.useState<FollowUp[]>([])
  const [loading, setLoading] = React.useState(true)
  const [retryingIds, setRetryingIds] = React.useState<Set<string>>(new Set())
  const [selectedFollowUp, setSelectedFollowUp] = React.useState<FollowUp | null>(null)
  const [previewOpen, setPreviewOpen] = React.useState(false)
  
  // Use ref to track current follow-ups and avoid stale closures
  const followUpsRef = React.useRef<FollowUp[]>([])

  const loadFollowUps = React.useCallback(async () => {
    try {
      setLoading(true)
      const data = await getFollowUpsForEmail(emailId)
      setFollowUps(data)
      followUpsRef.current = data // Update ref with latest data
    } catch (error: any) {
      // Don't show error toast for rate limiting - it's expected during auto-refresh
      if (error.message && error.message.includes("Too Many Requests")) {
        // Silently skip - will retry on next interval
        return
      }
      addToast(error.message || "Failed to load follow-ups", "error")
    } finally {
      setLoading(false)
    }
  }, [emailId, addToast])

  // Update ref when follow-ups change
  React.useEffect(() => {
    followUpsRef.current = followUps
  }, [followUps])

  React.useEffect(() => {
    loadFollowUps()
  }, [loadFollowUps])

  // Auto-refresh with smart interval to avoid rate limiting
  React.useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null
    
    const checkAndLoad = async () => {
      // Use ref to get current follow-ups (always fresh, no stale closure)
      const currentFollowUps = followUpsRef.current
      const hasProcessing = currentFollowUps.some(f => 
        f.status === "processing" || f.status === "pending"
      )
      
      if (hasProcessing) {
        try {
          await loadFollowUps()
        } catch {
          // Silently handle errors during polling
        }
      } else {
        // Stop polling if no active follow-ups
        if (intervalId) {
          clearInterval(intervalId)
          intervalId = null
        }
      }
    }
    
    // Check initial state - only start polling if there are active follow-ups
    const hasProcessing = followUps.some(f => 
      f.status === "processing" || f.status === "pending"
    )
    
    if (hasProcessing) {
      // Use a longer interval (30 seconds) to avoid rate limiting
      // This allows up to 2 requests per minute per email, well below the 120/minute limit
      intervalId = setInterval(checkAndLoad, 30000) // Refresh every 30 seconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [loadFollowUps]) // Only depend on loadFollowUps, not followUps

  const handleRetry = async (followUp: FollowUp) => {
    setRetryingIds(prev => new Set(prev).add(followUp.follow_up_id))
    try {
      const request: FollowUpRetryRequest = {}
      
      // Get API key from localStorage if available
      if (typeof window !== "undefined") {
        const storedKey = localStorage.getItem(`${followUp.llm_provider}_api_key`)
        if (storedKey) {
          request.api_key = storedKey
        }
      }

      await retryFollowUp(followUp.follow_up_id, request)
      addToast(`Retrying ${getSequenceLabel(followUp.sequence_number)} follow-up`, "success")
      loadFollowUps()
      onRetry?.()
    } catch (error: any) {
      addToast(error.message || "Failed to retry follow-up", "error")
    } finally {
      setRetryingIds(prev => {
        const next = new Set(prev)
        next.delete(followUp.follow_up_id)
        return next
      })
    }
  }

  const handlePreview = (followUp: FollowUp) => {
    setSelectedFollowUp(followUp)
    setPreviewOpen(true)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Follow-up Emails
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (followUps.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Follow-up Emails
          </CardTitle>
          <CardDescription>No follow-ups generated yet</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Follow-up Emails ({followUps.length})
          </CardTitle>
          <CardDescription>
            Generated follow-up emails for this email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-[400px] overflow-y-auto space-y-3">
            {followUps.map((followUp) => (
              <div key={followUp.follow_up_id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      {getSequenceLabel(followUp.sequence_number)} Follow-up
                    </span>
                    {getStatusBadge(followUp.status)}
                  </div>
                  <div className="flex items-center gap-2">
                    {followUp.status === "failed" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRetry(followUp)}
                        disabled={retryingIds.has(followUp.follow_up_id)}
                      >
                        {retryingIds.has(followUp.follow_up_id) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RotateCcw className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    {followUp.email_content && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreview(followUp)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                
                {followUp.error_message && (
                  <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                    {followUp.error_message}
                  </div>
                )}

                {followUp.email_content && followUp.status === "completed" && (
                  <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded border">
                    <div className="font-medium mb-1">Preview:</div>
                    <div className="line-clamp-3 whitespace-pre-wrap">
                      {followUp.email_content}
                    </div>
                  </div>
                )}

                {followUp.cost_usd && (
                  <div className="text-xs text-muted-foreground">
                    Cost: ${followUp.cost_usd.toFixed(6)} | 
                    Tokens: {followUp.tokens_used?.toLocaleString() || "N/A"} |
                    {followUp.retry_count > 0 && ` Retries: ${followUp.retry_count}`}
                  </div>
                )}

                {followUp.scheduled_at && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Scheduled: {new Date(followUp.scheduled_at).toLocaleString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {selectedFollowUp && `${getSequenceLabel(selectedFollowUp.sequence_number)} Follow-up Email`}
            </DialogTitle>
            <DialogDescription>
              Preview of the generated follow-up email content
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                  Body-only
                </span>
                <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                  Human-written
                </span>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <div className="whitespace-pre-wrap p-4 bg-muted rounded-lg text-sm">
              {selectedFollowUp?.email_content ? (
                <div className="space-y-2">
                  <div className="font-medium text-xs text-muted-foreground mb-2">
                    Full Email Content ({selectedFollowUp.email_content.length} characters)
                  </div>
                  <div className="whitespace-pre-wrap break-words">
                    {selectedFollowUp.email_content}
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground">No content available</div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}


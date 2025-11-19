"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Mail, Loader2, CheckCircle2, XCircle, Clock, DollarSign, Eye, Trash2, 
  RotateCcw, ChevronDown, ChevronUp, MoreVertical, Copy
} from "lucide-react"
import { EmailJob, getEmailsForJob, deleteEmail, retryEmail } from "@/lib/api"
import { useToast } from "@/components/toast"
import { EmailViewer } from "./email-viewer"
import { FollowUpGenerationDialog } from "./follow-up-generation-dialog"
import { FollowUpList } from "./follow-up-list"
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const Collapsible = CollapsiblePrimitive.Root
const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger
const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent

interface EmailListCollapsibleProps {
  jobId: string
  onRefresh?: () => void
}

export function EmailListCollapsible({ jobId, onRefresh }: EmailListCollapsibleProps) {
  const { addToast } = useToast()
  const [emails, setEmails] = React.useState<EmailJob[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedEmail, setSelectedEmail] = React.useState<EmailJob | null>(null)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const [retryingId, setRetryingId] = React.useState<string | null>(null)
  const [openEmailIds, setOpenEmailIds] = React.useState<Set<string>>(new Set())
  const [isOpen, setIsOpen] = React.useState(false)
  
  // Use ref to track current emails and avoid stale closures
  const emailsRef = React.useRef<EmailJob[]>([])

  const loadEmails = React.useCallback(async () => {
    try {
      setLoading(true)
      const data = await getEmailsForJob(jobId)
      setEmails(data)
      emailsRef.current = data // Update ref with latest data
    } catch (error: any) {
      // Silently handle errors during auto-refresh
      if (!error?.message?.includes("Too Many Requests") && !error?.message?.includes("429")) {
        addToast(error.message || "Failed to load emails", "error")
      }
    } finally {
      setLoading(false)
    }
  }, [jobId, addToast])

  // Update ref when emails change
  React.useEffect(() => {
    emailsRef.current = emails
  }, [emails])

  React.useEffect(() => {
    loadEmails()
    
    let intervalId: NodeJS.Timeout | null = null
    
    const checkAndLoad = async () => {
      // Use ref to get current emails (always fresh, no stale closure)
      const currentEmails = emailsRef.current
      const hasActiveEmails = currentEmails.some(e => 
        e.status === "processing" || e.status === "pending"
      )
      
      if (hasActiveEmails) {
        try {
          await loadEmails()
        } catch {
          // Silently handle errors during polling
        }
      } else {
        // Stop polling if no active emails
        if (intervalId) {
          clearInterval(intervalId)
          intervalId = null
        }
      }
    }
    
    // Check initial state - only start polling if there are active emails
    const hasActiveEmails = emails.some(e => 
      e.status === "processing" || e.status === "pending"
    )
    
    if (hasActiveEmails) {
      intervalId = setInterval(checkAndLoad, 60000) // Poll every 60 seconds to reduce load
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [loadEmails]) // Only depend on loadEmails, not emails.length

  const handleDelete = async (emailId: string) => {
    if (!confirm("Are you sure you want to delete this email?")) {
      return
    }

    try {
      setDeletingId(emailId)
      await deleteEmail(emailId)
      addToast("Email deleted successfully", "success")
      loadEmails()
      onRefresh?.()
    } catch (error: any) {
      addToast(error.message || "Failed to delete email", "error")
    } finally {
      setDeletingId(null)
    }
  }

  const handleRetry = async (emailId: string) => {
    try {
      setRetryingId(emailId)
      await retryEmail(emailId)
      addToast("Email retry initiated", "success")
      loadEmails()
      onRefresh?.()
    } catch (error: any) {
      addToast(error.message || "Failed to retry email", "error")
    } finally {
      setRetryingId(null)
    }
  }

  const toggleEmail = (emailId: string) => {
    const newOpen = new Set(openEmailIds)
    if (newOpen.has(emailId)) {
      newOpen.delete(emailId)
    } else {
      newOpen.add(emailId)
    }
    setOpenEmailIds(newOpen)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-3 w-3 text-green-500" />
      case "failed":
        return <XCircle className="h-3 w-3 text-red-500" />
      case "processing":
        return <Loader2 className="h-3 w-3 text-blue-500 animate-spin" />
      default:
        return <Clock className="h-3 w-3 text-gray-500" />
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
      <Badge variant={variants[status] || "outline"} className="text-xs">
        {getStatusIcon(status)}
        <span className="ml-1 capitalize">{status}</span>
      </Badge>
    )
  }

  const completedCount = emails.filter(e => e.status === "completed").length
  const failedCount = emails.filter(e => e.status === "failed").length
  const processingCount = emails.filter(e => e.status === "processing" || e.status === "pending").length

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between"
            size="sm"
          >
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span>Emails ({emails.length})</span>
              {completedCount > 0 && (
                <Badge variant="default" className="text-xs">{completedCount} done</Badge>
              )}
              {failedCount > 0 && (
                <Badge variant="destructive" className="text-xs">{failedCount} failed</Badge>
              )}
              {processingCount > 0 && (
                <Badge variant="secondary" className="text-xs">{processingCount} processing</Badge>
              )}
            </div>
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <Card>
            <CardContent className="pt-4">
              {loading && emails.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : emails.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No emails generated yet
                </div>
              ) : (
                <div className="space-y-2">
                  {emails.map((email) => {
                    const isExpanded = openEmailIds.has(email.email_id)
                    return (
                      <div
                        key={email.email_id}
                        className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                              Body-only
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                              Human-written
                            </span>
                          </div>
                            <div className="flex items-center gap-2 mb-1">
                              {getStatusBadge(email.status)}
                              <span className="text-xs text-muted-foreground">
                                {new Date(email.created_at).toLocaleDateString()}
                              </span>
                              {email.cost_usd && (
                                <span className="text-xs text-muted-foreground">
                                  ${email.cost_usd.toFixed(4)}
                                </span>
                              )}
                            </div>
                            {email.email_prompt && (
                              <p className="text-xs text-muted-foreground line-clamp-1 mb-1">
                                {email.email_prompt}
                              </p>
                            )}
                            {isExpanded && email.status === "completed" && email.email_content && (
                              <div className="mt-2 p-2 bg-muted rounded text-xs line-clamp-4">
                                {email.email_content}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {email.status === "completed" && email.email_content && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2"
                                  onClick={() => setSelectedEmail(email)}
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <FollowUpGenerationDialog
                                  emailId={email.email_id}
                                  onSuccess={loadEmails}
                                  trigger={
                                    <Button variant="ghost" size="sm" className="h-7 px-2">
                                      <Mail className="h-3 w-3" />
                                    </Button>
                                  }
                                />
                              </>
                            )}
                            {email.status === "failed" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2"
                                onClick={() => handleRetry(email.email_id)}
                                disabled={retryingId === email.email_id}
                              >
                                {retryingId === email.email_id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <RotateCcw className="h-3 w-3" />
                                )}
                              </Button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 px-2">
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => toggleEmail(email.email_id)}
                                >
                                  {isExpanded ? (
                                    <>
                                      <ChevronUp className="h-3 w-3 mr-2" />
                                      Collapse
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="h-3 w-3 mr-2" />
                                      Expand
                                    </>
                                  )}
                                </DropdownMenuItem>
                                {email.email_content && (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      navigator.clipboard.writeText(email.email_content || "")
                                      addToast("Email copied to clipboard", "success")
                                    }}
                                  >
                                    <Copy className="h-3 w-3 mr-2" />
                                    Copy
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => handleDelete(email.email_id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-3 w-3 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        {isExpanded && email.status === "completed" && (
                          <div className="mt-2 pt-2 border-t">
                            <FollowUpList
                              emailId={email.email_id}
                              onRetry={loadEmails}
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
      
      {selectedEmail && (
        <EmailViewer
          email={selectedEmail}
          onClose={() => setSelectedEmail(null)}
        />
      )}
    </>
  )
}


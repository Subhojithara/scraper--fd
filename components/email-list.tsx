"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mail, Loader2, CheckCircle2, XCircle, Clock, DollarSign, Eye, Trash2, RotateCcw } from "lucide-react"
import { EmailJob, getEmailsForJob, deleteEmail, retryEmail } from "@/lib/api"
import { useToast } from "@/components/toast"
import { EmailViewer } from "./email-viewer"
import { FollowUpGenerationDialog } from "./follow-up-generation-dialog"
import { FollowUpList } from "./follow-up-list"

interface EmailListProps {
  jobId: string
  onRefresh?: () => void
}

export function EmailList({ jobId, onRefresh }: EmailListProps) {
  const { addToast } = useToast()
  const [emails, setEmails] = React.useState<EmailJob[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedEmail, setSelectedEmail] = React.useState<EmailJob | null>(null)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const [retryingId, setRetryingId] = React.useState<string | null>(null)

  const loadEmails = React.useCallback(async () => {
    try {
      setLoading(true)
      const data = await getEmailsForJob(jobId)
      setEmails(data)
    } catch (error: any) {
      addToast(error.message || "Failed to load emails", "error")
    } finally {
      setLoading(false)
    }
  }, [jobId, addToast])

  React.useEffect(() => {
    loadEmails()
    // Poll for updates every 5 seconds
    const interval = setInterval(loadEmails, 5000)
    return () => clearInterval(interval)
  }, [loadEmails])

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "processing":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
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
        {getStatusIcon(status)}
        <span className="ml-1 capitalize">{status}</span>
      </Badge>
    )
  }

  if (loading && emails.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Generated Emails
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

  if (emails.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Generated Emails
          </CardTitle>
          <CardDescription>No emails generated yet</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Generated Emails ({emails.length})
              </CardTitle>
              <CardDescription>View and manage generated cold emails</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {emails.map((email) => (
              <Card key={email.email_id} className="border">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(email.status)}
                        <span className="text-sm text-muted-foreground">
                          {new Date(email.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {email.email_prompt}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {email.status === "completed" && email.email_content && (
                        <FollowUpGenerationDialog
                          emailId={email.email_id}
                          onSuccess={loadEmails}
                          trigger={
                            <Button variant="outline" size="sm">
                              <Mail className="h-4 w-4 mr-1" />
                              Follow-ups
                            </Button>
                          }
                        />
                      )}
                      {email.status === "completed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedEmail(email)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      )}
                      {email.status === "failed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRetry(email.email_id)}
                          disabled={retryingId === email.email_id}
                        >
                          {retryingId === email.email_id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <RotateCcw className="h-4 w-4 mr-1" />
                              Retry
                            </>
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(email.email_id)}
                        disabled={deletingId === email.email_id}
                      >
                        {deletingId === email.email_id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {email.status === "completed" && email.email_content && (
                    <div className="mb-3 p-3 bg-muted rounded-lg border">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Preview:</p>
                      <p className="text-sm line-clamp-3 whitespace-pre-wrap">
                        {email.email_content}
                      </p>
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      <span>${email.cost_usd?.toFixed(6) || "0.000000"}</span>
                    </div>
                    {email.tokens_used && (
                      <div className="flex items-center gap-1">
                        <span>Tokens: {email.tokens_used.toLocaleString()}</span>
                      </div>
                    )}
                    {email.processing_time_ms && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{(email.processing_time_ms / 1000).toFixed(1)}s</span>
                      </div>
                    )}
                    <div className="ml-auto">
                      <span className="text-xs">{email.llm_provider} / {email.model || "default"}</span>
                    </div>
                  </div>
                  {email.error_message && (
                    <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                      {email.error_message}
                    </div>
                  )}
                  {email.retry_count > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Retry count: {email.retry_count}
                      {email.last_retry_at && (
                        <span className="ml-2">
                          (Last retry: {new Date(email.last_retry_at).toLocaleString()})
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {selectedEmail && (
        <EmailViewer
          email={selectedEmail}
          onClose={() => setSelectedEmail(null)}
        />
      )}

      {/* Show follow-ups for completed emails */}
      {emails
        .filter(e => e.status === "completed" && e.email_content)
        .map(email => (
          <FollowUpList
            key={email.email_id}
            emailId={email.email_id}
            onRetry={loadEmails}
          />
        ))}
    </>
  )
}


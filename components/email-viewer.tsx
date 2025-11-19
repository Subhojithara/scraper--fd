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
import { Copy, Download, X, Check } from "lucide-react"
import { EmailJob } from "@/lib/api"
import { useToast } from "@/components/toast"

interface EmailViewerProps {
  email: EmailJob
  onClose: () => void
}

export function EmailViewer({ email, onClose }: EmailViewerProps) {
  const { addToast } = useToast()
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    if (!email.email_content) return
    
    try {
      await navigator.clipboard.writeText(email.email_content)
      setCopied(true)
      addToast("Email content copied to clipboard", "success")
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      addToast("Failed to copy to clipboard", "error")
    }
  }

  const handleDownload = () => {
    if (!email.email_content) return
    
    const blob = new Blob([email.email_content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `email-${email.email_id}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    addToast("Email content downloaded", "success")
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Email Content</DialogTitle>
          <DialogDescription>
            Generated on {new Date(email.created_at).toLocaleString()}
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
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="space-y-1">
              <p className="text-sm font-medium">Prompt</p>
              <p className="text-sm text-muted-foreground">{email.email_prompt}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Email Content</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Provider: {email.llm_provider}</span>
                {email.model && <span>Model: {email.model}</span>}
                {email.cost_usd && <span>Cost: ${email.cost_usd.toFixed(6)}</span>}
              </div>
            </div>
            <div className="p-4 bg-muted rounded-lg border min-h-[200px]">
              {email.email_content ? (
                <pre className="whitespace-pre-wrap text-sm font-sans">
                  {email.email_content}
                </pre>
              ) : (
                <p className="text-sm text-muted-foreground">No content available</p>
              )}
            </div>
          </div>
          
          {email.error_message && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded">
              <p className="text-sm font-medium text-destructive">Error</p>
              <p className="text-sm text-destructive">{email.error_message}</p>
            </div>
          )}
        </div>
        
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-1" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}


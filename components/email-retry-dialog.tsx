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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { EmailJob, EmailRetryRequest } from "@/lib/api"

interface EmailRetryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  email: EmailJob | null
  onRetry: (retryRequest: EmailRetryRequest) => Promise<void>
}

export function EmailRetryDialog({ open, onOpenChange, email, onRetry }: EmailRetryDialogProps) {
  const [useCustomApiKey, setUseCustomApiKey] = React.useState(false)
  const [apiKey, setApiKey] = React.useState("")
  const [llmProvider, setLlmProvider] = React.useState<string>(email?.llm_provider || "gemini")
  const [model, setModel] = React.useState<string>(email?.model || "")
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (email) {
      setLlmProvider(email.llm_provider)
      setModel(email.model || "")
    }
  }, [email])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    try {
      setLoading(true)
      const retryRequest: EmailRetryRequest = {}
      
      if (useCustomApiKey && apiKey) {
        retryRequest.api_key = apiKey
      }
      
      if (llmProvider !== email.llm_provider) {
        retryRequest.llm_provider = llmProvider as "openai" | "gemini"
      }
      
      if (model !== email.model) {
        retryRequest.model = model
      }

      await onRetry(retryRequest)
      onOpenChange(false)
      setApiKey("")
      setUseCustomApiKey(false)
    } catch (error) {
      // Error handling is done in parent
    } finally {
      setLoading(false)
    }
  }

  if (!email) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Retry Email Generation</DialogTitle>
          <DialogDescription>
            Retry this failed email generation. You can override settings if needed.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Original Prompt</Label>
            <p className="text-sm text-muted-foreground p-2 bg-muted rounded">
              {email.email_prompt}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Error Message</Label>
            <p className="text-sm text-destructive p-2 bg-destructive/10 rounded">
              {email.error_message || "No error message"}
            </p>
          </div>

          <div className="space-y-2">
            <Label>LLM Provider</Label>
            <Select value={llmProvider} onValueChange={setLlmProvider}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="gemini">Gemini</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Model (optional)</Label>
            <Input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Leave empty to use default"
            />
          </div>

          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="use-custom-api-key"
                checked={useCustomApiKey}
                onCheckedChange={(checked) => {
                  setUseCustomApiKey(checked as boolean)
                  if (!checked) {
                    setApiKey("")
                  }
                }}
              />
              <Label htmlFor="use-custom-api-key" className="text-sm font-medium cursor-pointer">
                Use custom API key
              </Label>
            </div>
            {useCustomApiKey && (
              <div className="space-y-2 pl-6">
                <Label htmlFor="api-key" className="text-sm">
                  {llmProvider === "openai" ? "OpenAI" : "Gemini"} API Key
                </Label>
                <Input
                  id="api-key"
                  type="password"
                  placeholder={`Enter your ${llmProvider === "openai" ? "OpenAI" : "Gemini"} API key`}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Retrying..." : "Retry Email"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}


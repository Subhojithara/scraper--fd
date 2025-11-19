"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Mail, Loader2 } from "lucide-react"
import { generateEmail, EmailJobCreate } from "@/lib/api"
import { useToast } from "@/components/toast"

const OPENAI_MODELS = [
  { value: "gpt-4o-mini", label: "GPT-4o Mini" },
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
]

const GEMINI_MODELS = [
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
  { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
  { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
]

interface EmailGenerationDialogProps {
  jobId: string
  onSuccess?: () => void
  trigger?: React.ReactNode
}

export function EmailGenerationDialog({ jobId, onSuccess, trigger }: EmailGenerationDialogProps) {
  const { addToast } = useToast()
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [emailPrompt, setEmailPrompt] = React.useState("")
  const [llmProvider, setLlmProvider] = React.useState<"openai" | "gemini">("gemini")
  const [model, setModel] = React.useState<string>("gemini-2.5-flash")
  const [emailCount, setEmailCount] = React.useState<number>(1)
  const [useOwnApiKey, setUseOwnApiKey] = React.useState<boolean>(false)
  const [apiKey, setApiKey] = React.useState<string>("")

  React.useEffect(() => {
    if (llmProvider === "openai") {
      setModel("gpt-4o-mini")
      // Load saved OpenAI API key if available
      if (useOwnApiKey) {
        const savedKey = localStorage.getItem("openaiApiKey")
        if (savedKey) setApiKey(savedKey)
      }
    } else {
      setModel("gemini-2.5-flash")
      // Load saved Gemini API key if available
      if (useOwnApiKey) {
        const savedKey = localStorage.getItem("geminiApiKey")
        if (savedKey) setApiKey(savedKey)
      }
    }
  }, [llmProvider, useOwnApiKey])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!emailPrompt.trim()) {
      addToast("Please enter an email prompt", "error")
      return
    }

    if (useOwnApiKey && !apiKey.trim()) {
      addToast("Please enter your API key", "error")
      return
    }

    setLoading(true)
    try {
      const emailRequest: EmailJobCreate = {
        email_prompt: emailPrompt,
        llm_provider: llmProvider,
        model: model,
        email_count: emailCount,
        api_key: useOwnApiKey && apiKey.trim() ? apiKey.trim() : undefined,
      }
      
      // Save API key to localStorage if provided
      if (useOwnApiKey && apiKey.trim()) {
        if (llmProvider === "openai") {
          localStorage.setItem("openaiApiKey", apiKey.trim())
        } else {
          localStorage.setItem("geminiApiKey", apiKey.trim())
        }
      }
      
      await generateEmail(jobId, emailRequest)
      
      addToast("Email generation job created successfully", "success")
      
      setOpen(false)
      setEmailPrompt("")
      onSuccess?.()
    } catch (error: any) {
      addToast(error.message || "Failed to generate email", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Mail className="h-4 w-4" />
            Generate Email
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Generate Cold Email</DialogTitle>
          <DialogDescription>
            Generate a personalized cold email based on the scraped content
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email-prompt">Email Prompt</Label>
              <Textarea
                id="email-prompt"
                placeholder="Describe what kind of email you want to generate. For example: 'Write a professional cold email introducing our SaaS product for web scraping automation'"
                value={emailPrompt}
                onChange={(e) => setEmailPrompt(e.target.value)}
                rows={5}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="llm-provider">LLM Provider</Label>
                <Select value={llmProvider} onValueChange={(value: "openai" | "gemini") => setLlmProvider(value)}>
                  <SelectTrigger id="llm-provider">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="gemini">Gemini</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger id="model">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(llmProvider === "openai" ? OPENAI_MODELS : GEMINI_MODELS).map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email-count">Number of Emails</Label>
              <Input
                id="email-count"
                type="number"
                min={1}
                max={5}
                value={emailCount}
                onChange={(e) => setEmailCount(Math.max(1, Math.min(5, parseInt(e.target.value) || 1)))}
              />
              <p className="text-xs text-muted-foreground">
                Generate multiple variations (1-5)
              </p>
            </div>

            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="use-own-api-key"
                  checked={useOwnApiKey}
                  onCheckedChange={(checked) => {
                    setUseOwnApiKey(checked as boolean)
                    if (!checked) {
                      setApiKey("")
                    } else {
                      // Load saved key when enabling
                      const savedKey = llmProvider === "openai" 
                        ? localStorage.getItem("openaiApiKey")
                        : localStorage.getItem("geminiApiKey")
                      if (savedKey) setApiKey(savedKey)
                    }
                  }}
                />
                <Label htmlFor="use-own-api-key" className="text-sm font-medium cursor-pointer">
                  Use my own API key
                </Label>
              </div>
              {useOwnApiKey && (
                <div className="space-y-2 pl-6">
                  <Label htmlFor="api-key">
                    {llmProvider === "openai" ? "OpenAI" : "Gemini"} API Key
                  </Label>
                  <Input
                    id="api-key"
                    type="password"
                    placeholder={`Enter your ${llmProvider === "openai" ? "OpenAI" : "Gemini"} API key`}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    required={useOwnApiKey}
                  />
                  <p className="text-xs text-muted-foreground">
                    Your API key will be used for this email generation. It will be saved locally for convenience.
                  </p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Email
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}


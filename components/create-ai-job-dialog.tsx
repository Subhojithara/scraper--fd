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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Loader2, FileText, Files, Workflow, Zap, Brain, Mail, Settings, ChevronDown, ChevronUp } from "lucide-react"
import { createAIJob } from "@/lib/api"
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

interface CreateAIJobDialogProps {
  onSuccess?: () => void
}

type PresetType = "quick_scrape" | "full_analysis" | "email_campaign" | null

export function CreateAIJobDialog({ onSuccess }: CreateAIJobDialogProps) {
  const { addToast } = useToast()
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState("basic")
  const [showAdvanced, setShowAdvanced] = React.useState(false)
  
  // Form state
  const [url, setUrl] = React.useState("")
  const [strategy, setStrategy] = React.useState<"single_page" | "multi_page" | "sitemap">("single_page")
  const [llmProvider, setLlmProvider] = React.useState<"openai" | "gemini" | "none">("openai")
  const [model, setModel] = React.useState<string>("gpt-4o-mini")
  const [outputFormat, setOutputFormat] = React.useState<"json" | "markdown" | "both">("both")
  const [apiKey, setApiKey] = React.useState<string>("")
  const [maxPages, setMaxPages] = React.useState<number>(10)
  const [extractionPrompt, setExtractionPrompt] = React.useState<string>("")
  const [researchPrompt, setResearchPrompt] = React.useState<string>("")
  const [enableResearch, setEnableResearch] = React.useState<boolean>(true)
  const [enableEmail, setEnableEmail] = React.useState<boolean>(false)
  const [emailPrompt, setEmailPrompt] = React.useState<string>("")
  const [emailLlmProvider, setEmailLlmProvider] = React.useState<"openai" | "gemini">("gemini")
  const [emailModel, setEmailModel] = React.useState<string>("gemini-2.5-flash")
  const [error, setError] = React.useState<string>("")
  const [selectedPreset, setSelectedPreset] = React.useState<PresetType>(null)

  // Preset configurations
  const applyPreset = (preset: PresetType) => {
    setSelectedPreset(preset)
    switch (preset) {
      case "quick_scrape":
        setStrategy("single_page")
        setLlmProvider("none")
        setOutputFormat("markdown")
        setEnableResearch(false)
        setEnableEmail(false)
        setExtractionPrompt("")
        setResearchPrompt("")
        setEmailPrompt("")
        break
      case "full_analysis":
        setStrategy("single_page")
        setLlmProvider("gemini")
        setModel("gemini-2.5-flash")
        setOutputFormat("both")
        setEnableResearch(true)
        setEnableEmail(false)
        setExtractionPrompt("")
        setResearchPrompt("")
        setEmailPrompt("")
        break
      case "email_campaign":
        setStrategy("single_page")
        setLlmProvider("gemini")
        setModel("gemini-2.5-flash")
        setOutputFormat("markdown")
        setEnableResearch(false)
        setEnableEmail(true)
        setEmailPrompt("Write a professional cold email introducing our product or service based on the website content.")
        setEmailLlmProvider("gemini")
        setEmailModel("gemini-2.5-flash")
        setExtractionPrompt("")
        setResearchPrompt("")
        break
    }
  }

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      setUrl("")
      setError("")
      setActiveTab("basic")
      setShowAdvanced(false)
      setSelectedPreset(null)
      // Reset to defaults
      setStrategy("single_page")
      setLlmProvider("openai")
      setModel("gpt-4o-mini")
      setOutputFormat("both")
      setMaxPages(10)
      setExtractionPrompt("")
      setResearchPrompt("")
      setEnableResearch(true)
      setEnableEmail(false)
      setEmailPrompt("")
      setEmailLlmProvider("gemini")
      setEmailModel("gemini-2.5-flash")
    }
  }, [open])

  React.useEffect(() => {
    if (typeof window === "undefined") return
    
    if (llmProvider === "openai") {
      setModel("gpt-4o-mini")
      const savedKey = localStorage.getItem("openaiApiKey")
      setApiKey(savedKey || "")
    } else if (llmProvider === "gemini") {
      setModel("gemini-2.5-flash")
      const savedKey = localStorage.getItem("geminiApiKey")
      setApiKey(savedKey || "")
    } else {
      setApiKey("")
    }
  }, [llmProvider])

  React.useEffect(() => {
    if (emailLlmProvider === "openai") {
      setEmailModel("gpt-4o-mini")
    } else {
      setEmailModel("gemini-2.5-flash")
    }
  }, [emailLlmProvider])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    if (!url.trim()) {
      setError("URL is required")
      return
    }

    if (enableEmail && !emailPrompt.trim()) {
      setError("Email prompt is required when email generation is enabled")
      return
    }

    try {
      setLoading(true)
      let finalApiKey: string | undefined = undefined
      if (apiKey && apiKey.trim()) {
        finalApiKey = apiKey.trim()
        if (typeof window !== "undefined") {
          if (llmProvider === "openai") {
            localStorage.setItem("openaiApiKey", finalApiKey)
          } else if (llmProvider === "gemini") {
            localStorage.setItem("geminiApiKey", finalApiKey)
          }
        }
      }

      await createAIJob(
        url,
        strategy,
        llmProvider,
        outputFormat,
        extractionPrompt.trim() || undefined,
        researchPrompt.trim() || undefined,
        enableResearch,
        finalApiKey,
        model,
        strategy !== "single_page" ? maxPages : undefined,
        enableEmail,
        enableEmail ? emailPrompt.trim() || undefined : undefined,
        enableEmail ? emailLlmProvider : undefined,
        enableEmail ? emailModel : undefined
      )
      
      setOpen(false)
      addToast("AI job created successfully", "success")
      onSuccess?.()
    } catch (error: any) {
      const errorMsg = error.message || "Failed to create AI job. Please try again."
      setError(errorMsg)
      addToast(errorMsg, "error")
    } finally {
      setLoading(false)
    }
  }

  const models = llmProvider === "openai" ? OPENAI_MODELS : llmProvider === "gemini" ? GEMINI_MODELS : []

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create AI Job
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl">
        <DialogHeader>
          <DialogTitle>Create New AI Job</DialogTitle>
          <DialogDescription>
            Configure your AI-powered web scraping job with LLM extraction
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className={`grid w-full ${showAdvanced ? 'grid-cols-4' : 'grid-cols-2'}`}>
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="llm">LLM Settings</TabsTrigger>
              {showAdvanced && <TabsTrigger value="advanced">Advanced</TabsTrigger>}
              {showAdvanced && <TabsTrigger value="email">Email</TabsTrigger>}
            </TabsList>

            {/* Basic Tab */}
            <TabsContent value="basic" className="space-y-4 mt-4">
              {/* Quick Presets */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Quick Presets</Label>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    type="button"
                    variant={selectedPreset === "quick_scrape" ? "default" : "outline"}
                    onClick={() => applyPreset("quick_scrape")}
                    className="h-auto flex-col py-4 space-y-2"
                  >
                    <Zap className="h-5 w-5" />
                    <div className="text-center">
                      <div className="font-medium">Quick Scrape</div>
                      <div className="text-xs text-muted-foreground">Fast, simple scraping</div>
                    </div>
                  </Button>
                  <Button
                    type="button"
                    variant={selectedPreset === "full_analysis" ? "default" : "outline"}
                    onClick={() => applyPreset("full_analysis")}
                    className="h-auto flex-col py-4 space-y-2"
                  >
                    <Brain className="h-5 w-5" />
                    <div className="text-center">
                      <div className="font-medium">Full Analysis</div>
                      <div className="text-xs text-muted-foreground">AI-powered analysis</div>
                    </div>
                  </Button>
                  <Button
                    type="button"
                    variant={selectedPreset === "email_campaign" ? "default" : "outline"}
                    onClick={() => applyPreset("email_campaign")}
                    className="h-auto flex-col py-4 space-y-2"
                  >
                    <Mail className="h-5 w-5" />
                    <div className="text-center">
                      <div className="font-medium">Email Campaign</div>
                      <div className="text-xs text-muted-foreground">Scrape + email</div>
                    </div>
                  </Button>
                </div>
              </div>

              {/* URL Input */}
              <div className="space-y-2">
                <Label htmlFor="url" className="text-base font-semibold">
                  Website URL <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="text-lg h-12"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Enter the website URL you want to scrape
                </p>
              </div>

              {/* Strategy Selection */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Scraping Strategy</Label>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    type="button"
                    variant={strategy === "single_page" ? "default" : "outline"}
                    onClick={() => setStrategy("single_page")}
                    className="h-auto flex-col py-4 space-y-2"
                  >
                    <FileText className="h-5 w-5" />
                    <div className="text-center">
                      <div className="font-medium">Single Page</div>
                      <div className="text-xs text-muted-foreground">One page only</div>
                    </div>
                  </Button>
                  <Button
                    type="button"
                    variant={strategy === "multi_page" ? "default" : "outline"}
                    onClick={() => setStrategy("multi_page")}
                    className="h-auto flex-col py-4 space-y-2"
                  >
                    <Files className="h-5 w-5" />
                    <div className="text-center">
                      <div className="font-medium">Multi Page</div>
                      <div className="text-xs text-muted-foreground">Multiple pages</div>
                    </div>
                  </Button>
                  <Button
                    type="button"
                    variant={strategy === "sitemap" ? "default" : "outline"}
                    onClick={() => setStrategy("sitemap")}
                    className="h-auto flex-col py-4 space-y-2"
                  >
                    <Workflow className="h-5 w-5" />
                    <div className="text-center">
                      <div className="font-medium">Sitemap</div>
                      <div className="text-xs text-muted-foreground">From sitemap</div>
                    </div>
                  </Button>
                </div>
              </div>

              {/* Output Format */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Output Format</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={outputFormat === "json" ? "default" : "outline"}
                    onClick={() => setOutputFormat("json")}
                    className="w-full"
                  >
                    JSON
                  </Button>
                  <Button
                    type="button"
                    variant={outputFormat === "markdown" ? "default" : "outline"}
                    onClick={() => setOutputFormat("markdown")}
                    className="w-full"
                  >
                    Markdown
                  </Button>
                  <Button
                    type="button"
                    variant={outputFormat === "both" ? "default" : "outline"}
                    onClick={() => setOutputFormat("both")}
                    className="w-full"
                  >
                    Both
                  </Button>
                </div>
              </div>

              {/* Show Advanced Toggle */}
              <div className="pt-2 border-t">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowAdvanced(!showAdvanced)
                    if (!showAdvanced) {
                      setActiveTab("advanced")
                    }
                  }}
                  className="w-full justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    {showAdvanced ? "Hide" : "Show"} Advanced Options
                  </span>
                  {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </TabsContent>

            {/* LLM Settings Tab */}
            <TabsContent value="llm" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-base font-semibold">LLM Provider</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      type="button"
                      variant={llmProvider === "openai" ? "default" : "outline"}
                      onClick={() => setLlmProvider("openai")}
                      className="w-full"
                    >
                      OpenAI
                    </Button>
                    <Button
                      type="button"
                      variant={llmProvider === "gemini" ? "default" : "outline"}
                      onClick={() => setLlmProvider("gemini")}
                      className="w-full"
                    >
                      Gemini
                    </Button>
                    <Button
                      type="button"
                      variant={llmProvider === "none" ? "default" : "outline"}
                      onClick={() => setLlmProvider("none")}
                      className="w-full"
                    >
                      None
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Choose an LLM provider for AI-powered extraction, or None for basic scraping
                  </p>
                </div>

                {llmProvider !== "none" && models.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Model</Label>
                    <Select value={model} onValueChange={setModel}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {models.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {llmProvider !== "none" && (
                  <div className="space-y-2">
                    <Label htmlFor="apiKey" className="text-base font-semibold">
                      API Key <span className="text-xs font-normal text-muted-foreground">(optional)</span>
                    </Label>
                    <Input
                      id="apiKey"
                      type="password"
                      placeholder={typeof window !== "undefined" && localStorage.getItem(llmProvider === "openai" ? "openaiApiKey" : "geminiApiKey") ? "Using saved key (enter new to override)" : "Enter API key"}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      {typeof window !== "undefined" && localStorage.getItem(llmProvider === "openai" ? "openaiApiKey" : "geminiApiKey") 
                        ? "Saved key will be used if left empty" 
                        : "Leave empty to use system default (if configured)"}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Advanced Tab */}
            {showAdvanced && (
              <TabsContent value="advanced" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="extractionPrompt" className="text-base font-semibold">
                      Extraction Prompt <span className="text-xs font-normal text-muted-foreground">(optional)</span>
                    </Label>
                    <Textarea
                      id="extractionPrompt"
                      placeholder="Custom prompt for data extraction. For example: 'Extract product names, prices, and descriptions'"
                      value={extractionPrompt}
                      onChange={(e) => setExtractionPrompt(e.target.value)}
                      className="min-h-[100px] resize-y"
                    />
                    <p className="text-xs text-muted-foreground">
                      Customize how the LLM extracts data from the page. Leave empty for default extraction.
                    </p>
                  </div>

                  <div className="space-y-3 pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="enableResearch" className="text-base font-semibold">
                          Enable Research
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Analyze and research the scraped content using AI
                        </p>
                      </div>
                      <Checkbox
                        id="enableResearch"
                        checked={enableResearch}
                        onCheckedChange={(checked) => setEnableResearch(checked === true)}
                      />
                    </div>

                    {enableResearch && (
                      <div className="space-y-2 pl-6">
                        <Label htmlFor="researchPrompt" className="text-sm">
                          Research Prompt <span className="text-xs font-normal text-muted-foreground">(optional)</span>
                        </Label>
                        <Textarea
                          id="researchPrompt"
                          placeholder="Custom prompt for research analysis. For example: 'Analyze the business model and identify key opportunities'"
                          value={researchPrompt}
                          onChange={(e) => setResearchPrompt(e.target.value)}
                          className="min-h-[100px] resize-y"
                        />
                        <p className="text-xs text-muted-foreground">
                          Customize how the LLM researches and analyzes the content
                        </p>
                      </div>
                    )}
                  </div>

                  {strategy !== "single_page" && (
                    <div className="space-y-2 pt-2 border-t">
                      <Label htmlFor="maxPages" className="text-base font-semibold">Max Pages</Label>
                      <Input
                        id="maxPages"
                        type="number"
                        min="1"
                        max="100"
                        value={maxPages}
                        onChange={(e) => setMaxPages(parseInt(e.target.value) || 10)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Maximum number of pages to scrape (1-100)
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            )}

            {/* Email Tab */}
            {showAdvanced && (
              <TabsContent value="email" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="enableEmail"
                        checked={enableEmail}
                        onCheckedChange={(checked) => setEnableEmail(checked === true)}
                      />
                      <Label htmlFor="enableEmail" className="text-base font-semibold cursor-pointer">
                        Enable Email Generation
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground ml-6">
                      Automatically generate cold emails after scraping completes
                    </p>
                  </div>

                  {enableEmail && (
                    <div className="space-y-4 pl-6 border-l-2">
                      <div className="space-y-2">
                        <Label htmlFor="emailPrompt" className="text-base font-semibold">
                          Email Prompt <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                          id="emailPrompt"
                          placeholder="Describe what kind of email you want to generate. For example: 'Write a professional cold email introducing our SaaS product for web scraping automation'"
                          value={emailPrompt}
                          onChange={(e) => setEmailPrompt(e.target.value)}
                          className="min-h-[120px] resize-y"
                          required={enableEmail}
                        />
                        <p className="text-xs text-muted-foreground">
                          Describe the type of cold email you want to generate based on the scraped content
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="emailLlmProvider" className="text-sm font-medium">
                            Email LLM Provider
                          </Label>
                          <Select value={emailLlmProvider} onValueChange={(value: "openai" | "gemini") => setEmailLlmProvider(value)}>
                            <SelectTrigger id="emailLlmProvider">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="openai">OpenAI</SelectItem>
                              <SelectItem value="gemini">Gemini</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="emailModel" className="text-sm font-medium">
                            Email Model
                          </Label>
                          <Select value={emailModel} onValueChange={setEmailModel}>
                            <SelectTrigger id="emailModel">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(emailLlmProvider === "openai" ? OPENAI_MODELS : GEMINI_MODELS).map((m) => (
                                <SelectItem key={m.value} value={m.value}>
                                  {m.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            )}
          </Tabs>

          {error && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Job"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}


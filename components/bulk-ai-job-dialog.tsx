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
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { FileUp, Loader2, CheckCircle2, XCircle, FileText } from "lucide-react"
import { createBulkAIJobsFromCSV, createBulkAIJobsFromJSON } from "@/lib/api"
import { useToast } from "@/components/toast"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

interface BulkAIJobDialogProps {
  onSuccess?: () => void
}

export function BulkAIJobDialog({ onSuccess }: BulkAIJobDialogProps) {
  const { addToast } = useToast()
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [uploadType, setUploadType] = React.useState<"csv" | "json">("csv")
  const [csvFile, setCsvFile] = React.useState<File | null>(null)
  const [jsonUrls, setJsonUrls] = React.useState<string>("")
  const [uploadProgress, setUploadProgress] = React.useState(0)
  const [strategy, setStrategy] = React.useState<"single_page" | "multi_page" | "sitemap">("single_page")
  const [llmProvider, setLlmProvider] = React.useState<"openai" | "gemini" | "none">("none")
  const [model, setModel] = React.useState<string>("gpt-4o-mini")
  const [outputFormat, setOutputFormat] = React.useState<"json" | "markdown" | "both">("both")
  const [apiKey, setApiKey] = React.useState<string>("")
  const [maxPages, setMaxPages] = React.useState<number>(10)
  const [enableEmail, setEnableEmail] = React.useState<boolean>(false)
  const [emailPrompt, setEmailPrompt] = React.useState<string>("")
  const [emailLlmProvider, setEmailLlmProvider] = React.useState<"openai" | "gemini">("gemini")
  const [emailModel, setEmailModel] = React.useState<string>("gemini-2.5-flash")
  const [emailApiKey, setEmailApiKey] = React.useState<string>("")
  const [bulkResult, setBulkResult] = React.useState<{
    created: number
    failed: number
    errors: any[]
  } | null>(null)
  const [error, setError] = React.useState<string>("")

  React.useEffect(() => {
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
      const savedKey = localStorage.getItem("openaiApiKey")
      setEmailApiKey(savedKey || "")
    } else {
      setEmailModel("gemini-2.5-flash")
      const savedKey = localStorage.getItem("geminiApiKey")
      setEmailApiKey(savedKey || "")
    }
  }, [emailLlmProvider])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (
        !file.name.toLowerCase().endsWith(".csv") &&
        !file.name.toLowerCase().endsWith(".txt")
      ) {
        setError("Please select a CSV or TXT file")
        return
      }
      if (file.size > 100 * 1024 * 1024) {
        setError("File size must be less than 100MB")
        return
      }
      setCsvFile(file)
      setError("")
    }
  }

  const parseJsonUrls = (text: string): string[] => {
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && (line.startsWith('http://') || line.startsWith('https://')))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (uploadType === "csv" && !csvFile) {
      setError("Please select a CSV file")
      return
    }

    if (uploadType === "json") {
      const urls = parseJsonUrls(jsonUrls)
      if (urls.length === 0) {
        setError("Please enter at least one valid URL (one per line)")
        return
      }
      if (urls.length > 100000) {
        setError("Maximum 100,000 URLs allowed per request")
        return
      }
    }

    try {
      setLoading(true)
      setBulkResult(null)
      setUploadProgress(0)

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => (prev >= 90 ? prev : prev + 5))
      }, 200)

      let finalApiKey: string | undefined = undefined
      if (apiKey && apiKey.trim()) {
        finalApiKey = apiKey.trim()
        if (llmProvider === "openai") {
          localStorage.setItem("openaiApiKey", finalApiKey)
        } else if (llmProvider === "gemini") {
          localStorage.setItem("geminiApiKey", finalApiKey)
        }
      }

      let finalEmailApiKey: string | undefined = undefined
      if (enableEmail && emailApiKey && emailApiKey.trim()) {
        finalEmailApiKey = emailApiKey.trim()
        if (emailLlmProvider === "openai") {
          localStorage.setItem("openaiApiKey", finalEmailApiKey)
        } else if (emailLlmProvider === "gemini") {
          localStorage.setItem("geminiApiKey", finalEmailApiKey)
        }
      }

      let result
      if (uploadType === "csv") {
        result = await createBulkAIJobsFromCSV(
          csvFile!,
          strategy,
          llmProvider,
          outputFormat,
          undefined,
          finalApiKey,
          model,
          strategy !== "single_page" ? maxPages : undefined,
          enableEmail,
          enableEmail ? emailPrompt : undefined,
          enableEmail ? emailLlmProvider : undefined,
          enableEmail ? emailModel : undefined,
          finalEmailApiKey
        )
      } else {
        const urls = parseJsonUrls(jsonUrls)
        result = await createBulkAIJobsFromJSON(
          urls,
          strategy,
          llmProvider,
          outputFormat,
          undefined,
          finalApiKey,
          model,
          strategy !== "single_page" ? maxPages : undefined,
          enableEmail,
          enableEmail ? emailPrompt : undefined,
          enableEmail ? emailLlmProvider : undefined,
          enableEmail ? emailModel : undefined,
          finalEmailApiKey
        )
      }

      clearInterval(progressInterval)
      setUploadProgress(100)
      setBulkResult({
        created: result.created,
        failed: result.failed,
        errors: result.errors || [],
      })
      setCsvFile(null)
      setJsonUrls("")
      setTimeout(() => setUploadProgress(0), 2000)
      if (result.created > 0) {
        addToast(`Successfully created ${result.created} AI job${result.created === 1 ? "" : "s"}`, "success")
      }
      if (result.failed > 0) {
        addToast(`${result.failed} job${result.failed === 1 ? "" : "s"} failed to create`, "warning")
      }
      onSuccess?.()
    } catch (error: any) {
      const errorMsg = error.message || `Failed to ${uploadType === "csv" ? "upload CSV" : "create jobs"}. Please try again.`
      setError(errorMsg)
      setUploadProgress(0)
      addToast(errorMsg, "error")
    } finally {
      setLoading(false)
    }
  }

  const jsonUrlCount = parseJsonUrls(jsonUrls).length

  const models = llmProvider === "openai" ? OPENAI_MODELS : llmProvider === "gemini" ? GEMINI_MODELS : []

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <FileUp className="mr-2 h-4 w-4" />
          Bulk AI Upload
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        <DialogHeader>
          <DialogTitle>Bulk AI Job Upload</DialogTitle>
          <DialogDescription>
            Upload URLs via CSV file or JSON to create multiple AI scraping jobs at once
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardContent className="pt-6 space-y-4">
              <Tabs value={uploadType} onValueChange={(v) => setUploadType(v as "csv" | "json")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="csv">
                    <FileUp className="mr-2 h-4 w-4" />
                    CSV Upload
                  </TabsTrigger>
                  <TabsTrigger value="json">
                    <FileText className="mr-2 h-4 w-4" />
                    JSON Upload
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="csv" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="csv-file">CSV File *</Label>
                    <Input
                      id="csv-file"
                      type="file"
                      accept=".csv,.txt"
                      onChange={handleFileChange}
                      disabled={loading}
                    />
                    {csvFile && (
                      <div className="text-sm text-muted-foreground">
                        {csvFile.name} ({(csvFile.size / 1024).toFixed(2)} KB)
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      CSV format: URLs in first column, or header row with "url" column.
                      Supports .csv and .txt files. Maximum 100MB.
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="json" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="json-urls">URLs (one per line) *</Label>
                      {jsonUrlCount > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {jsonUrlCount} URL{jsonUrlCount === 1 ? "" : "s"} detected
                        </span>
                      )}
                    </div>
                    <Textarea
                      id="json-urls"
                      placeholder={`https://example.com\nhttps://example.org\nhttps://example.net`}
                      value={jsonUrls}
                      onChange={(e) => setJsonUrls(e.target.value)}
                      disabled={loading}
                      className="min-h-[200px] font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter one URL per line. Only URLs starting with http:// or https:// will be processed.
                      Maximum 100,000 URLs per request.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              <Separator />

              <div className="space-y-3">
                <Label>Strategy</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={strategy === "single_page" ? "default" : "outline"}
                    onClick={() => setStrategy("single_page")}
                    className="w-full"
                  >
                    Single Page
                  </Button>
                  <Button
                    type="button"
                    variant={strategy === "multi_page" ? "default" : "outline"}
                    onClick={() => setStrategy("multi_page")}
                    className="w-full"
                  >
                    Multi Page
                  </Button>
                  <Button
                    type="button"
                    variant={strategy === "sitemap" ? "default" : "outline"}
                    onClick={() => setStrategy("sitemap")}
                    className="w-full"
                  >
                    Sitemap
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>LLM Provider</Label>
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
              </div>

              {llmProvider !== "none" && models.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <Label>Model</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {models.map((m) => (
                        <Button
                          key={m.value}
                          type="button"
                          variant={model === m.value ? "default" : "outline"}
                          onClick={() => setModel(m.value)}
                          className="w-full"
                        >
                          {m.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {llmProvider !== "none" && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="apiKey">API Key (optional, uses saved if empty)</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      placeholder="Enter API key"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                  </div>
                </>
              )}

              <Separator />

              <div className="space-y-3">
                <Label>Output Format</Label>
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

              {strategy !== "single_page" && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="maxPages">Max Pages</Label>
                    <Input
                      id="maxPages"
                      type="number"
                      min="1"
                      max="1000"
                      value={maxPages}
                      onChange={(e) => setMaxPages(parseInt(e.target.value) || 10)}
                      disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum number of pages to crawl for {strategy === "multi_page" ? "multi-page" : "sitemap"} strategy
                    </p>
                  </div>
                </>
              )}

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="enableEmail"
                    checked={enableEmail}
                    onChange={(e) => setEnableEmail(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="enableEmail" className="font-medium cursor-pointer">
                    Enable Email Generation
                  </Label>
                </div>
                {enableEmail && (
                  <div className="space-y-3 pl-6 border-l-2 border-primary/20">
                    <div className="space-y-2">
                      <Label htmlFor="emailPrompt">Email Prompt</Label>
                      <Textarea
                        id="emailPrompt"
                        placeholder="Describe what kind of email you want to generate. For example: 'Write a professional cold email introducing our SaaS product'"
                        value={emailPrompt}
                        onChange={(e) => setEmailPrompt(e.target.value)}
                        rows={3}
                        disabled={loading}
                      />
                      <p className="text-xs text-muted-foreground">
                        This prompt will be used to generate cold emails after scraping completes
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="emailLlmProvider">Email LLM Provider</Label>
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
                        <Label htmlFor="emailModel">Email Model</Label>
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
                    <div className="space-y-2">
                      <Label htmlFor="emailApiKey" className="text-sm font-medium">
                        Email API Key <span className="text-xs font-normal text-muted-foreground">(optional)</span>
                      </Label>
                      <Input
                        id="emailApiKey"
                        type="password"
                        placeholder={typeof window !== "undefined" && localStorage.getItem(emailLlmProvider === "openai" ? "openaiApiKey" : "geminiApiKey") ? "Using saved key (enter new to override)" : "Enter API key for email generation"}
                        value={emailApiKey}
                        onChange={(e) => setEmailApiKey(e.target.value)}
                        disabled={loading}
                      />
                      <p className="text-xs text-muted-foreground">
                        {typeof window !== "undefined" && localStorage.getItem(emailLlmProvider === "openai" ? "openaiApiKey" : "geminiApiKey")
                          ? "Saved key will be used if left empty"
                          : "Leave empty to use system default (if configured)"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {loading && uploadProgress > 0 && (
            <Card className="border-border/50 shadow-sm">
              <CardContent className="pt-6 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Uploading...</span>
                  <span className="font-medium">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </CardContent>
            </Card>
          )}

          {bulkResult && (
            <Card className="border-border/50 shadow-sm">
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Upload Results</span>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="font-semibold">{bulkResult.created} created</span>
                    </div>
                    {bulkResult.failed > 0 && (
                      <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <XCircle className="h-4 w-4" />
                        <span className="font-semibold">{bulkResult.failed} failed</span>
                      </div>
                    )}
                  </div>
                </div>
                {bulkResult.errors.length > 0 && (
                  <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                    <p className="text-sm font-medium">Errors:</p>
                    {bulkResult.errors.slice(0, 10).map((error, idx) => (
                      <div
                        key={idx}
                        className="text-xs p-2 bg-destructive/10 rounded border border-destructive/20"
                      >
                        <div className="font-mono text-destructive truncate">
                          {error.url}
                        </div>
                        <div className="text-destructive/80">{error.error}</div>
                      </div>
                    ))}
                    {bulkResult.errors.length > 10 && (
                      <div className="text-xs text-muted-foreground">
                        ... and {bulkResult.errors.length - 10} more errors
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {error && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
            <Button type="submit" disabled={loading || (uploadType === "csv" && !csvFile) || (uploadType === "json" && jsonUrlCount === 0)}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploadType === "csv" ? "Uploading..." : "Creating..."}
                </>
              ) : (
                <>
                  {uploadType === "csv" ? (
                    <>
                      <FileUp className="mr-2 h-4 w-4" />
                      Upload CSV
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Create Jobs
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}


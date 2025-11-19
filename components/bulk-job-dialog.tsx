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
import { createBulkJobsFromCSV, createBulkJobsFromJSON } from "@/lib/api"
import { useToast } from "@/components/toast"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"

interface BulkJobDialogProps {
  onSuccess?: () => void
}

export function BulkJobDialog({ onSuccess }: BulkJobDialogProps) {
  const { addToast } = useToast()
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [uploadType, setUploadType] = React.useState<"csv" | "json">("csv")
  const [csvFile, setCsvFile] = React.useState<File | null>(null)
  const [jsonUrls, setJsonUrls] = React.useState<string>("")
  const [uploadProgress, setUploadProgress] = React.useState(0)
  const [enableScraping, setEnableScraping] = React.useState<boolean>(true)
  const [enableCleaning, setEnableCleaning] = React.useState<boolean>(true)
  const [enableResearch, setEnableResearch] = React.useState<boolean>(false)
  const [bulkResult, setBulkResult] = React.useState<{
    created: number
    failed: number
    errors: any[]
  } | null>(null)
  const [error, setError] = React.useState<string>("")

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

      let result
      if (uploadType === "csv") {
        result = await createBulkJobsFromCSV(csvFile!)
      } else {
        const urls = parseJsonUrls(jsonUrls)
        result = await createBulkJobsFromJSON(
          urls,
          enableScraping,
          enableCleaning,
          enableResearch
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
        addToast(`Successfully created ${result.created} job${result.created === 1 ? "" : "s"}`, "success")
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <FileUp className="mr-2 h-4 w-4" />
          Bulk Upload
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        <DialogHeader>
          <DialogTitle>Bulk Job Upload</DialogTitle>
          <DialogDescription>
            Upload URLs via CSV file or JSON to create multiple scraping jobs at once
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
                <Label>Job Options</Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="enableScraping"
                      checked={enableScraping}
                      onCheckedChange={(checked) => setEnableScraping(checked === true)}
                      disabled={loading}
                    />
                    <Label htmlFor="enableScraping" className="cursor-pointer">
                      Enable Scraping
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="enableCleaning"
                      checked={enableCleaning}
                      onCheckedChange={(checked) => setEnableCleaning(checked === true)}
                      disabled={loading}
                    />
                    <Label htmlFor="enableCleaning" className="cursor-pointer">
                      Enable Cleaning
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="enableResearch"
                      checked={enableResearch}
                      onCheckedChange={(checked) => setEnableResearch(checked === true)}
                      disabled={loading}
                    />
                    <Label htmlFor="enableResearch" className="cursor-pointer">
                      Enable Research
                    </Label>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Note: Options are only applied when using JSON upload. CSV upload uses default settings.
                </p>
              </div>
            </CardContent>
          </Card>

          {loading && uploadProgress > 0 && (
            <Card className="border-border/50 shadow-sm">
              <CardContent className="pt-6 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Processing...</span>
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


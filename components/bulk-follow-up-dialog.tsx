"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useToast } from "@/components/toast"
import { generateFollowUps, getEmailsForJob, EmailJob, getAllAIJobs, JobAI, FollowUpPromptRequest } from "@/lib/api"
import { Loader2, Mail, ChevronDown, ChevronUp, Info } from "lucide-react"
import { countWords, validateWordLimit } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

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

const DEFAULT_PROMPT_STRATEGIES = {
  1: "1st Follow-up: Reference the original email and add urgency or additional value proposition. Acknowledge they may have missed the previous email, add new information, create gentle urgency without being pushy.",
  2: "2nd Follow-up: Take a different angle from the original. Share a relevant case study, testimonial, or social proof. Highlight different benefits or use cases, show how others have benefited.",
  3: "3rd Follow-up: Final attempt with a clear call-to-action. Be direct but respectful, offer something of value (limited-time offer, free resource), make the CTA very clear.",
  4: "4th Follow-up: Last chance approach. Offer an alternative way to engage (different format, different contact), be respectful of their time, leave the door open for future contact.",
}

interface BulkFollowUpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function BulkFollowUpDialog({
  open,
  onOpenChange,
  onSuccess,
}: BulkFollowUpDialogProps) {
  const { addToast } = useToast()
  const [loading, setLoading] = React.useState(false)
  const [jobs, setJobs] = React.useState<JobAI[]>([])
  const [selectedJobIds, setSelectedJobIds] = React.useState<Set<string>>(new Set())
  const [llmProvider, setLlmProvider] = React.useState<"openai" | "gemini">("gemini")
  const [model, setModel] = React.useState<string>("gemini-2.5-flash")
  const [apiKey, setApiKey] = React.useState<string>("")
  const [useCustomApiKey, setUseCustomApiKey] = React.useState<boolean>(false)
  const [useCustomPrompts, setUseCustomPrompts] = React.useState<boolean>(false)
  const [customPrompts, setCustomPrompts] = React.useState<Record<number, string>>({
    1: "",
    2: "",
    3: "",
    4: "",
  })
  const [wordLimitType, setWordLimitType] = React.useState<"hard" | "soft">("soft")
  const [wordLimit, setWordLimit] = React.useState<number>(500)
  const [useWordLimit, setUseWordLimit] = React.useState<boolean>(false)
  const [openSequences, setOpenSequences] = React.useState<Set<number>>(new Set())
  const [jobEmailsMap, setJobEmailsMap] = React.useState<Map<string, EmailJob[]>>(new Map())

  React.useEffect(() => {
    if (open) {
      loadJobs()
    }
  }, [open])

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const storedKey = localStorage.getItem(`${llmProvider}_api_key`)
      if (storedKey) {
        setApiKey(storedKey)
        setUseCustomApiKey(true)
      }
    }
  }, [llmProvider])

  React.useEffect(() => {
    // Load emails for selected jobs
    if (selectedJobIds.size > 0) {
      loadEmailsForSelectedJobs()
    } else {
      setJobEmailsMap(new Map())
    }
  }, [selectedJobIds])

  const loadJobs = async () => {
    try {
      const data = await getAllAIJobs(0, 1000)
      setJobs(data.filter(j => j.status === "completed"))
    } catch (error: any) {
      addToast(error.message || "Failed to load jobs", "error")
    }
  }

  const loadEmailsForSelectedJobs = async () => {
    const emailsMap = new Map<string, EmailJob[]>()
    
    for (const jobId of selectedJobIds) {
      try {
        const emails = await getEmailsForJob(jobId)
        const completedEmails = emails.filter(e => e.status === "completed")
        if (completedEmails.length > 0) {
          emailsMap.set(jobId, completedEmails)
        }
      } catch (error: any) {
        console.error(`Failed to load emails for job ${jobId}:`, error)
      }
    }
    
    setJobEmailsMap(emailsMap)
  }

  const getTotalEmailsCount = () => {
    let count = 0
    jobEmailsMap.forEach(emails => {
      count += emails.length
    })
    return count
  }

  const handleToggleAll = () => {
    if (selectedJobIds.size === jobs.length) {
      setSelectedJobIds(new Set())
    } else {
      setSelectedJobIds(new Set(jobs.map(j => j.job_id)))
    }
  }

  const handleToggleJob = (jobId: string) => {
    const newSet = new Set(selectedJobIds)
    if (newSet.has(jobId)) {
      newSet.delete(jobId)
    } else {
      newSet.add(jobId)
    }
    setSelectedJobIds(newSet)
  }

  const getWordCount = (sequence: number) => {
    return countWords(customPrompts[sequence] || "")
  }

  const getWordLimitValidation = (sequence: number) => {
    if (!useWordLimit) return { valid: true, wordCount: getWordCount(sequence) }
    return validateWordLimit(customPrompts[sequence] || "", wordLimit, wordLimitType)
  }

  const toggleSequence = (sequence: number) => {
    const newOpen = new Set(openSequences)
    if (newOpen.has(sequence)) {
      newOpen.delete(sequence)
    } else {
      newOpen.add(sequence)
    }
    setOpenSequences(newOpen)
  }

  const handleGenerate = async () => {
    if (selectedJobIds.size === 0) {
      addToast("Please select at least one job", "warning")
      return
    }

    if (getTotalEmailsCount() === 0) {
      addToast("Selected jobs have no completed emails", "warning")
      return
    }

    // Validate word limits if enabled
    if (useWordLimit && useCustomPrompts) {
      for (let seq = 1; seq <= 4; seq++) {
        if (customPrompts[seq]) {
          const validation = validateWordLimit(customPrompts[seq], wordLimit, wordLimitType)
          if (!validation.valid) {
            addToast(`Sequence ${seq} prompt exceeds word limit. Please reduce the length.`, "error")
            return
          }
        }
      }
    }

    setLoading(true)
    let successCount = 0
    let errorCount = 0
    const totalEmails = getTotalEmailsCount()

    try {
      // Collect all emails from selected jobs
      const allEmails: EmailJob[] = []
      jobEmailsMap.forEach(emails => {
        allEmails.push(...emails)
      })

      // Prepare request
      const request: any = {
        llm_provider: llmProvider,
        model: model,
      }

      if (useCustomApiKey && apiKey) {
        request.api_key = apiKey
        if (typeof window !== "undefined") {
          localStorage.setItem(`${llmProvider}_api_key`, apiKey)
        }
      }

      if (useCustomPrompts) {
        const prompts: FollowUpPromptRequest[] = []
        for (let seq = 1; seq <= 4; seq++) {
          if (customPrompts[seq]?.trim()) {
            prompts.push({
              sequence_number: seq,
              custom_prompt: customPrompts[seq],
              word_limit: useWordLimit ? wordLimit : undefined,
              word_limit_type: useWordLimit ? wordLimitType : undefined,
              enforce_word_limit: useWordLimit ? true : false,
            })
          }
        }
        if (prompts.length > 0) {
          request.custom_prompts = prompts
        }
      }

      // Generate follow-ups for all emails
      for (const email of allEmails) {
        try {
          await generateFollowUps(email.email_id, request)
          successCount++
        } catch (error: any) {
          errorCount++
          console.error(`Failed to generate follow-ups for email ${email.email_id}:`, error)
        }
      }

      if (successCount > 0) {
        addToast(
          `Successfully initiated follow-up generation for ${successCount} email${successCount === 1 ? "" : "s"} (${totalEmails * 4} follow-ups)`,
          "success"
        )
      }
      if (errorCount > 0) {
        addToast(
          `Failed to generate follow-ups for ${errorCount} email${errorCount === 1 ? "" : "s"}`,
          "error"
        )
      }

      onSuccess?.()
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  const availableModels = llmProvider === "openai" ? OPENAI_MODELS : GEMINI_MODELS

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Bulk Follow-up Generation
          </DialogTitle>
          <DialogDescription>
            Select jobs to generate all 4 follow-up emails (1st, 2nd, 3rd, 4th) for all completed emails in those jobs
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Job Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Select Jobs ({selectedJobIds.size} selected, {getTotalEmailsCount()} emails)</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleAll}
              >
                {selectedJobIds.size === jobs.length ? "Deselect All" : "Select All"}
              </Button>
            </div>
            <div className="border rounded-lg p-3 max-h-60 overflow-y-auto space-y-2">
              {jobs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No completed jobs found
                </p>
              ) : (
                jobs.map((job) => {
                  const emails = jobEmailsMap.get(job.job_id) || []
                  return (
                    <div
                      key={job.job_id}
                      className="flex items-center space-x-2 p-2 hover:bg-muted rounded"
                    >
                      <Checkbox
                        checked={selectedJobIds.has(job.job_id)}
                        onCheckedChange={() => handleToggleJob(job.job_id)}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {job.url}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {emails.length} completed email{emails.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* LLM Settings */}
          <div className="space-y-2">
            <Label>LLM Provider</Label>
            <Select value={llmProvider} onValueChange={(v: "openai" | "gemini") => {
              setLlmProvider(v)
              setModel(v === "openai" ? "gpt-4o-mini" : "gemini-2.5-flash")
            }}>
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
            <Label>Model</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableModels.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              checked={useCustomApiKey}
              onCheckedChange={(checked) => {
                setUseCustomApiKey(checked === true)
                if (!checked) {
                  setApiKey("")
                } else if (typeof window !== "undefined") {
                  const storedKey = localStorage.getItem(`${llmProvider}_api_key`)
                  if (storedKey) {
                    setApiKey(storedKey)
                  }
                }
              }}
            />
            <Label>Use my own API key</Label>
          </div>

          {useCustomApiKey && (
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input
                type="password"
                placeholder={`Enter your ${llmProvider === "openai" ? "OpenAI" : "Gemini"} API key`}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
          )}

          {/* Custom Prompts Section */}
          <div className="border-t pt-4 space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={useCustomPrompts}
                onCheckedChange={(checked) => setUseCustomPrompts(checked === true)}
              />
              <Label className="font-medium">Use custom prompts for each sequence</Label>
            </div>

            {useCustomPrompts && (
              <>
                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={useWordLimit}
                      onCheckedChange={(checked) => setUseWordLimit(checked === true)}
                    />
                    <Label>Enforce word limit</Label>
                  </div>
                  {useWordLimit && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        value={wordLimit}
                        onChange={(e) => setWordLimit(parseInt(e.target.value) || 500)}
                        className="w-24"
                      />
                      <Select value={wordLimitType} onValueChange={(v: "hard" | "soft") => setWordLimitType(v)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="soft">Soft Limit</SelectItem>
                          <SelectItem value="hard">Hard Limit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {[1, 2, 3, 4].map((sequence) => {
                  const isOpen = openSequences.has(sequence)
                  const wordCount = getWordCount(sequence)
                  const validation = getWordLimitValidation(sequence)
                  const hasCustomPrompt = !!customPrompts[sequence]?.trim()

                  return (
                    <Collapsible
                      key={sequence}
                      open={isOpen}
                      onOpenChange={() => toggleSequence(sequence)}
                    >
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between"
                          size="sm"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {sequence === 1 ? "1st" : sequence === 2 ? "2nd" : sequence === 3 ? "3rd" : "4th"} Follow-up
                            </span>
                            {hasCustomPrompt && (
                              <Badge variant="secondary" className="text-xs">
                                Custom
                              </Badge>
                            )}
                            {useWordLimit && validation.warning && (
                              <Badge
                                variant={wordLimitType === "hard" ? "destructive" : "outline"}
                                className="text-xs"
                              >
                                {wordCount}/{wordLimit}
                              </Badge>
                            )}
                          </div>
                          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2 space-y-2">
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="flex items-start gap-2">
                            <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div className="text-xs text-muted-foreground">
                              <p className="font-medium mb-1">Default Strategy:</p>
                              <p>{DEFAULT_PROMPT_STRATEGIES[sequence as keyof typeof DEFAULT_PROMPT_STRATEGIES]}</p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>
                              Custom Prompt {useWordLimit && `(Limit: ${wordLimit} words, ${wordLimitType})`}
                            </Label>
                            {useWordLimit && (
                              <span
                                className={`text-xs ${
                                  validation.valid
                                    ? validation.warning
                                      ? "text-yellow-600"
                                      : "text-muted-foreground"
                                    : "text-red-600 font-medium"
                                }`}
                              >
                                {wordCount}/{wordLimit} words
                              </span>
                            )}
                          </div>
                          <Textarea
                            placeholder={`Enter custom prompt for ${sequence === 1 ? "1st" : sequence === 2 ? "2nd" : sequence === 3 ? "3rd" : "4th"} follow-up, or leave empty to use default strategy`}
                            value={customPrompts[sequence] || ""}
                            onChange={(e) => {
                              setCustomPrompts({
                                ...customPrompts,
                                [sequence]: e.target.value,
                              })
                            }}
                            rows={4}
                            className={validation.warning && !validation.valid ? "border-red-500" : ""}
                          />
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )
                })}
              </>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleGenerate} 
            disabled={loading || selectedJobIds.size === 0 || getTotalEmailsCount() === 0}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Generate Follow-ups ({getTotalEmailsCount() * 4} total)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

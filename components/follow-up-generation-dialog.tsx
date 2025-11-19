"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Mail, Loader2, RefreshCw, ChevronDown, ChevronUp, AlertCircle, Info } from "lucide-react"
import { generateFollowUps, FollowUpGenerateRequest, FollowUpPromptRequest } from "@/lib/api"
import { useToast } from "@/components/toast"
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

interface FollowUpGenerationDialogProps {
  emailId: string
  onSuccess?: () => void
  trigger?: React.ReactNode
}

export function FollowUpGenerationDialog({ emailId, onSuccess, trigger }: FollowUpGenerationDialogProps) {
  const { addToast } = useToast()
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [llmProvider, setLlmProvider] = React.useState<"openai" | "gemini">("gemini")
  const [model, setModel] = React.useState<string>("gemini-2.5-flash")
  const [useOwnApiKey, setUseOwnApiKey] = React.useState<boolean>(false)
  const [apiKey, setApiKey] = React.useState<string>("")
  const [scheduleAll, setScheduleAll] = React.useState<boolean>(false)
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

  // Load API key from localStorage if available
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const storedKey = localStorage.getItem(`${llmProvider}_api_key`)
      if (storedKey) {
        setApiKey(storedKey)
        setUseOwnApiKey(true)
      }
    }
  }, [llmProvider])

  const getWordCount = (sequence: number) => {
    return countWords(customPrompts[sequence] || "")
  }

  const getWordLimitValidation = (sequence: number) => {
    if (!useWordLimit) return { valid: true, wordCount: getWordCount(sequence) }
    return validateWordLimit(customPrompts[sequence] || "", wordLimit, wordLimitType)
  }

  const handleGenerate = async () => {
    if (useOwnApiKey && !apiKey.trim()) {
      addToast("Please provide an API key", "error")
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
    try {
      const request: FollowUpGenerateRequest = {
        llm_provider: llmProvider,
        model: model,
        schedule_all: scheduleAll,
      }

      if (useOwnApiKey && apiKey) {
        request.api_key = apiKey
        // Save to localStorage
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

      console.log("Sending follow-up generation request:", {
        emailId,
        request: JSON.stringify(request, null, 2)
      })
      
      const response = await generateFollowUps(emailId, request)
      
      console.log("Follow-up generation response:", response)
      
      addToast(
        `Successfully generated ${response.generated_count} follow-up emails${response.errors.length > 0 ? ` (${response.errors.length} failed)` : ""}`,
        "success"
      )
      
      setOpen(false)
      onSuccess?.()
    } catch (error: any) {
      console.error("Follow-up generation error:", error)
      const errorMessage = error.message || "Failed to generate follow-ups"
      addToast(errorMessage, "error")
    } finally {
      setLoading(false)
    }
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

  const availableModels = llmProvider === "openai" ? OPENAI_MODELS : GEMINI_MODELS

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Mail className="h-4 w-4 mr-2" />
            Generate Follow-ups
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Follow-up Emails</DialogTitle>
          <DialogDescription>
            Generate all 4 follow-up emails (1st, 2nd, 3rd, 4th) for this email. Customize prompts for each sequence or use defaults.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="llm-provider">LLM Provider</Label>
            <Select value={llmProvider} onValueChange={(value: "openai" | "gemini") => {
              setLlmProvider(value)
              setModel(value === "openai" ? "gpt-4o-mini" : "gemini-2.5-flash")
            }}>
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
              id="use-own-api-key"
              checked={useOwnApiKey}
              onCheckedChange={(checked) => {
                setUseOwnApiKey(checked === true)
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
            <Label htmlFor="use-own-api-key" className="cursor-pointer">
              Use my own API key
            </Label>
          </div>

          {useOwnApiKey && (
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                type="password"
                placeholder={`Enter your ${llmProvider === "openai" ? "OpenAI" : "Gemini"} API key`}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="schedule-all"
              checked={scheduleAll}
              onCheckedChange={(checked) => setScheduleAll(checked === true)}
            />
            <Label htmlFor="schedule-all" className="cursor-pointer">
              Schedule all follow-ups for automatic sending (3, 7, 14, 21 days)
            </Label>
          </div>

          <div className="border-t pt-4 space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="use-custom-prompts"
                checked={useCustomPrompts}
                onCheckedChange={(checked) => setUseCustomPrompts(checked === true)}
              />
              <Label htmlFor="use-custom-prompts" className="cursor-pointer font-medium">
                Use custom prompts for each sequence
              </Label>
            </div>

            {useCustomPrompts && (
              <>
                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="use-word-limit"
                      checked={useWordLimit}
                      onCheckedChange={(checked) => setUseWordLimit(checked === true)}
                    />
                    <Label htmlFor="use-word-limit" className="cursor-pointer">
                      Enforce word limit
                    </Label>
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
                            {!useWordLimit && hasCustomPrompt && (
                              <Badge variant="outline" className="text-xs">
                                {wordCount} words
                              </Badge>
                            )}
                          </div>
                          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2 space-y-2">
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="flex items-start gap-2 mb-2">
                            <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div className="text-xs text-muted-foreground">
                              <p className="font-medium mb-1">Default Strategy:</p>
                              <p>{DEFAULT_PROMPT_STRATEGIES[sequence as keyof typeof DEFAULT_PROMPT_STRATEGIES]}</p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor={`prompt-${sequence}`}>
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
                            {!useWordLimit && hasCustomPrompt && (
                              <span className="text-xs text-muted-foreground">{wordCount} words</span>
                            )}
                          </div>
                          <Textarea
                            id={`prompt-${sequence}`}
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
                          {validation.warning && (
                            <div
                              className={`flex items-start gap-2 text-xs ${
                                validation.valid ? "text-yellow-600" : "text-red-600"
                              }`}
                            >
                              <AlertCircle className="h-4 w-4 mt-0.5" />
                              <span>{validation.warning}</span>
                            </div>
                          )}
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
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Generate All 4 Follow-ups
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

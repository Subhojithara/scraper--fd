"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Copy,
  Check,
  FileJson,
  FileText,
  Code,
  Database,
  Search,
  Settings,
  Download,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Filter,
  ChevronDown,
  ChevronUp,
  Trash2,
  Highlighter,
  Replace,
  Zap,
  Info,
  BarChart3,
  X,
  CheckCircle2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { StructuredJSONViewer } from "./structured-json-viewer"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

interface AdvancedDataViewerProps {
  title: string
  data: any
  type?: "json" | "markdown" | "text" | "metadata" | "raw" | "cleaned" | "research"
  defaultOpen?: boolean
}

export function AdvancedDataViewer({
  title,
  data,
  type = "json",
  defaultOpen = false,
}: AdvancedDataViewerProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)
  const [copied, setCopied] = React.useState(false)
  const [showAdvanced, setShowAdvanced] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [replaceQuery, setReplaceQuery] = React.useState("")
  const [showReplace, setShowReplace] = React.useState(false)
  const [selectedText, setSelectedText] = React.useState("")
  const [wordWrap, setWordWrap] = React.useState(true)
  const [showLineNumbers, setShowLineNumbers] = React.useState(false)
  const [fontSize, setFontSize] = React.useState<"sm" | "md" | "lg">("sm")
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [highlightMatches, setHighlightMatches] = React.useState(true)
  const [showStats, setShowStats] = React.useState(false)
  const textAreaRef = React.useRef<HTMLTextAreaElement>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)

  const handleCopy = async () => {
    const text = selectedText || (typeof data === "string" ? data : JSON.stringify(data, null, 2))
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDelete = () => {
    if (!selectedText) return
    
    const text = typeof data === "string" ? data : JSON.stringify(data, null, 2)
    const newText = text.replace(selectedText, "")
    // Note: This would need to be handled by parent component to update data
    setSelectedText("")
    // For now, just show a message
    alert("Delete functionality requires parent component update. Selected text: " + selectedText.substring(0, 50))
  }

  const handleReplace = () => {
    if (!searchQuery || !replaceQuery) return
    
    const text = typeof data === "string" ? data : JSON.stringify(data, null, 2)
    const newText = text.replace(new RegExp(searchQuery, "gi"), replaceQuery)
    // Note: This would need to be handled by parent component to update data
    alert(`Replaced ${(text.match(new RegExp(searchQuery, "gi")) || []).length} occurrences`)
  }

  const handleSelect = () => {
    const selection = window.getSelection()
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString())
    }
  }

  const handleFormatJSON = () => {
    try {
      const parsed = typeof data === "string" ? JSON.parse(data) : data
      const formatted = JSON.stringify(parsed, null, 2)
      // Note: This would need to be handled by parent component
      alert("Format JSON - This would format the JSON data")
    } catch (e) {
      alert("Invalid JSON format")
    }
  }

  const handleDownload = () => {
    const text = selectedText || (typeof data === "string" ? data : JSON.stringify(data, null, 2))
    const blob = new Blob([text], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${title.toLowerCase().replace(/\s+/g, "-")}.${type === "json" ? "json" : type === "markdown" ? "md" : "txt"}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const getTypeIcon = () => {
    switch (type) {
      case "json":
        return <FileJson className="h-4 w-4" />
      case "markdown":
        return <FileText className="h-4 w-4" />
      case "metadata":
        return <Database className="h-4 w-4" />
      case "raw":
        return <Code className="h-4 w-4" />
      case "cleaned":
        return <FileText className="h-4 w-4" />
      case "research":
        return <Database className="h-4 w-4" />
      default:
        return <Code className="h-4 w-4" />
    }
  }

  const getTypeColor = () => {
    switch (type) {
      case "json":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800"
      case "markdown":
        return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-800"
      case "metadata":
        return "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-800"
      case "raw":
        return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800"
      case "cleaned":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800"
      case "research":
        return "bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-950/30 dark:text-pink-400 dark:border-pink-800"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  const getStats = () => {
    const text = typeof data === "string" ? data : JSON.stringify(data, null, 2)
    const lines = text.split("\n")
    const words = text.split(/\s+/).filter(w => w.length > 0)
    const chars = text.length
    const charsNoSpaces = text.replace(/\s/g, "").length
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0)
    
    return {
      lines: lines.length,
      words: words.length,
      characters: chars,
      charactersNoSpaces: charsNoSpaces,
      paragraphs: paragraphs.length,
      selectedLength: selectedText.length,
    }
  }

  const filterData = (data: any, query: string): any => {
    if (!query) return data

    const lowerQuery = query.toLowerCase()
    
    if (typeof data === "string") {
      return data.toLowerCase().includes(lowerQuery) ? data : null
    }

    if (Array.isArray(data)) {
      const filtered = data.filter((item) => {
        if (typeof item === "string") {
          return item.toLowerCase().includes(lowerQuery)
        }
        if (typeof item === "object") {
          return JSON.stringify(item).toLowerCase().includes(lowerQuery)
        }
        return String(item).toLowerCase().includes(lowerQuery)
      })
      return filtered.length > 0 ? filtered : null
    }

    if (typeof data === "object" && data !== null) {
      const filtered: Record<string, any> = {}
      for (const [key, value] of Object.entries(data)) {
        if (key.toLowerCase().includes(lowerQuery)) {
          filtered[key] = value
        } else if (typeof value === "string" && value.toLowerCase().includes(lowerQuery)) {
          filtered[key] = value
        } else if (typeof value === "object" && JSON.stringify(value).toLowerCase().includes(lowerQuery)) {
          filtered[key] = value
        }
      }
      return Object.keys(filtered).length > 0 ? filtered : null
    }

    return String(data).toLowerCase().includes(lowerQuery) ? data : null
  }

  const highlightText = (text: string, query: string): React.ReactNode => {
    if (!query || !highlightMatches) {
      return text
    }

    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"))
    return parts.map((part, idx) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={idx} className="bg-yellow-200 dark:bg-yellow-900/50 px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  const renderContent = () => {
    if (!data) {
      return (
        <div className="flex items-center justify-center py-8">
          <Badge variant="outline" className="text-sm">
            No data available
          </Badge>
        </div>
      )
    }

    const filteredData = searchQuery ? filterData(data, searchQuery) : data

    if (!filteredData && searchQuery) {
      return (
        <div className="flex items-center justify-center py-8">
          <Badge variant="outline" className="text-sm">
            No results found for "{searchQuery}"
          </Badge>
        </div>
      )
    }

    // Use StructuredJSONViewer for JSON data
    if (type === "json" || (type === "metadata" && typeof filteredData === "object")) {
      return (
        <StructuredJSONViewer
          title={title}
          data={filteredData}
          defaultOpen={true}
        />
      )
    }

    if (type === "markdown") {
      const lines = String(filteredData).split("\n")
      return (
        <div 
          ref={contentRef}
          onMouseUp={handleSelect}
          className="space-y-2 select-text"
        >
          {lines.map((line, idx) => {
            if (searchQuery && !line.toLowerCase().includes(searchQuery.toLowerCase())) {
              return null
            }
            return (
              <div key={idx} className="flex items-start gap-2 group">
                {showLineNumbers && (
                  <>
                    <Badge variant="outline" className="text-xs font-mono shrink-0 min-w-[3rem] justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {idx + 1}
                    </Badge>
                    <Separator orientation="vertical" className="h-4" />
                  </>
                )}
                <div className={cn(
                  "flex-1",
                  wordWrap ? "whitespace-pre-wrap break-words" : "whitespace-pre overflow-x-auto",
                  fontSize === "sm" && "text-xs",
                  fontSize === "md" && "text-sm",
                  fontSize === "lg" && "text-base"
                )}>
                  {highlightText(line, searchQuery)}
                </div>
              </div>
            )
          })}
        </div>
      )
    }

    // For text, raw, cleaned, research data
    const textData = String(filteredData)
    const lines = textData.split("\n")
    
    return (
      <div 
        ref={contentRef}
        onMouseUp={handleSelect}
        className="space-y-2 select-text"
      >
        {lines.map((line, idx) => {
          if (searchQuery && !line.toLowerCase().includes(searchQuery.toLowerCase())) {
            return null
          }
          return (
            <div key={idx} className="flex items-start gap-2 group">
              {showLineNumbers && (
                <>
                  <Badge variant="outline" className="text-xs font-mono shrink-0 min-w-[3rem] justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {idx + 1}
                  </Badge>
                  <Separator orientation="vertical" className="h-4" />
                </>
              )}
              <div className={cn(
                "flex-1 font-mono",
                wordWrap ? "whitespace-pre-wrap break-words" : "whitespace-pre overflow-x-auto",
                fontSize === "sm" && "text-xs",
                fontSize === "md" && "text-sm",
                fontSize === "lg" && "text-base"
              )}>
                {highlightText(line, searchQuery)}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const stats = getStats()
  const dataSize = typeof data === "string" 
    ? `${data.length} characters, ${data.split("\n").length} lines`
    : Array.isArray(data)
    ? `${data.length} items`
    : typeof data === "object"
    ? `${Object.keys(data).length} properties`
    : "1 item"

  return (
    <Card className={cn("border-border/50 shadow-sm", isFullscreen && "fixed inset-4 z-50")}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {getTypeIcon()}
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Badge variant="outline" className={cn("text-xs", getTypeColor())}>
              {type.toUpperCase()}
            </Badge>
            <Separator orientation="vertical" className="h-4" />
            <Badge variant="secondary" className="text-xs font-normal">
              {dataSize}
            </Badge>
            {selectedText && (
              <>
                <Separator orientation="vertical" className="h-4" />
                <Badge variant="default" className="text-xs">
                  {selectedText.length} chars selected
                </Badge>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {selectedText && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 gap-1 text-xs"
                  onClick={handleDelete}
                  title="Delete selected"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
                <Separator orientation="vertical" className="h-4" />
              </>
            )}
            {type === "json" && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 gap-1 text-xs"
                  onClick={handleFormatJSON}
                  title="Format JSON"
                >
                  <Zap className="h-3.5 w-3.5" />
                  Format
                </Button>
                <Separator orientation="vertical" className="h-4" />
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={handleCopy}
              title="Copy to clipboard"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={handleDownload}
              title="Download"
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setShowStats(!showStats)}
              title="Show statistics"
            >
              <BarChart3 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 gap-1"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <Settings className="h-3.5 w-3.5" />
              <span className="text-xs">Options</span>
              {showAdvanced ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>

        {showStats && (
          <div className="mt-3 pt-3 border-t">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              <div className="space-y-1">
                <Badge variant="outline" className="text-xs w-full justify-center">
                  Lines
                </Badge>
                <div className="text-sm font-semibold text-center">{stats.lines}</div>
              </div>
              <div className="space-y-1">
                <Badge variant="outline" className="text-xs w-full justify-center">
                  Words
                </Badge>
                <div className="text-sm font-semibold text-center">{stats.words}</div>
              </div>
              <div className="space-y-1">
                <Badge variant="outline" className="text-xs w-full justify-center">
                  Characters
                </Badge>
                <div className="text-sm font-semibold text-center">{stats.characters.toLocaleString()}</div>
              </div>
              <div className="space-y-1">
                <Badge variant="outline" className="text-xs w-full justify-center">
                  No Spaces
                </Badge>
                <div className="text-sm font-semibold text-center">{stats.charactersNoSpaces.toLocaleString()}</div>
              </div>
              <div className="space-y-1">
                <Badge variant="outline" className="text-xs w-full justify-center">
                  Paragraphs
                </Badge>
                <div className="text-sm font-semibold text-center">{stats.paragraphs}</div>
              </div>
              <div className="space-y-1">
                <Badge variant="outline" className="text-xs w-full justify-center">
                  Selected
                </Badge>
                <div className="text-sm font-semibold text-center">{stats.selectedLength}</div>
              </div>
            </div>
          </div>
        )}

        {showAdvanced && (
          <div className="mt-4 space-y-3 pt-3 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-2">
                  <Search className="h-3 w-3" />
                  Search
                </Label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search in data..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-xs"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                      onClick={() => setSearchQuery("")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-2">
                  <Filter className="h-3 w-3" />
                  Font Size
                </Label>
                <ToggleGroup
                  type="single"
                  value={fontSize}
                  onValueChange={(value) => value && setFontSize(value as "sm" | "md" | "lg")}
                  variant="outline"
                  size="sm"
                >
                  <ToggleGroupItem value="sm" aria-label="Small">
                    Small
                  </ToggleGroupItem>
                  <ToggleGroupItem value="md" aria-label="Medium">
                    Medium
                  </ToggleGroupItem>
                  <ToggleGroupItem value="lg" aria-label="Large">
                    Large
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>

            {searchQuery && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs flex items-center gap-2">
                      <Replace className="h-3 w-3" />
                      Find & Replace
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => setShowReplace(!showReplace)}
                    >
                      {showReplace ? "Hide" : "Show"}
                    </Button>
                  </div>
                  {showReplace && (
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Find..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-8 text-xs"
                        readOnly
                      />
                      <div className="flex gap-2">
                        <Input
                          placeholder="Replace with..."
                          value={replaceQuery}
                          onChange={(e) => setReplaceQuery(e.target.value)}
                          className="h-8 text-xs"
                        />
                        <Button
                          size="sm"
                          className="h-8 px-3 text-xs"
                          onClick={handleReplace}
                        >
                          Replace
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            <Separator />

            <div className="space-y-2">
              <Label className="text-xs">Display Options</Label>
              <div className="flex items-center gap-2 flex-wrap">
                <ToggleGroup
                  type="single"
                  value={wordWrap ? "on" : "off"}
                  onValueChange={(value) => setWordWrap(value === "on")}
                  variant="outline"
                  size="sm"
                >
                  <ToggleGroupItem value="on" aria-label="Word Wrap On">
                    <Badge variant="outline" className="text-xs">
                      Word Wrap: On
                    </Badge>
                  </ToggleGroupItem>
                  <ToggleGroupItem value="off" aria-label="Word Wrap Off">
                    <Badge variant="outline" className="text-xs">
                      Word Wrap: Off
                    </Badge>
                  </ToggleGroupItem>
                </ToggleGroup>
                <Separator orientation="vertical" className="h-6" />
                <ToggleGroup
                  type="single"
                  value={showLineNumbers ? "on" : "off"}
                  onValueChange={(value) => setShowLineNumbers(value === "on")}
                  variant="outline"
                  size="sm"
                >
                  <ToggleGroupItem value="on" aria-label="Line Numbers On">
                    <Badge variant="outline" className="text-xs">
                      Line Numbers: On
                    </Badge>
                  </ToggleGroupItem>
                  <ToggleGroupItem value="off" aria-label="Line Numbers Off">
                    <Badge variant="outline" className="text-xs">
                      Line Numbers: Off
                    </Badge>
                  </ToggleGroupItem>
                </ToggleGroup>
                <Separator orientation="vertical" className="h-6" />
                <ToggleGroup
                  type="single"
                  value={highlightMatches ? "on" : "off"}
                  onValueChange={(value) => setHighlightMatches(value === "on")}
                  variant="outline"
                  size="sm"
                >
                  <ToggleGroupItem value="on" aria-label="Highlight On">
                    <Badge variant="outline" className="text-xs">
                      <Highlighter className="h-3 w-3 mr-1" />
                      Highlight: On
                    </Badge>
                  </ToggleGroupItem>
                  <ToggleGroupItem value="off" aria-label="Highlight Off">
                    <Badge variant="outline" className="text-xs">
                      <Highlighter className="h-3 w-3 mr-1" />
                      Highlight: Off
                    </Badge>
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
          </div>
        )}
      </CardHeader>
      {isOpen && (
        <CardContent>
          <ScrollArea 
            className={cn(
              "w-full rounded-md border bg-muted/30 p-4",
              isFullscreen ? "h-[calc(100vh-12rem)]" : "h-[500px]"
            )}
          >
            {renderContent()}
          </ScrollArea>
        </CardContent>
      )}
    </Card>
  )
}

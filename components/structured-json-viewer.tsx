"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Copy,
  Check,
  ChevronRight,
  ChevronDown,
  FileJson,
  Hash,
  Type,
  List,
  Key,
  Tag,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface StructuredJSONViewerProps {
  title: string
  data: any
  defaultOpen?: boolean
}

export function StructuredJSONViewer({
  title,
  data,
  defaultOpen = false,
}: StructuredJSONViewerProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)
  const [copied, setCopied] = React.useState(false)
  const [expandedKeys, setExpandedKeys] = React.useState<Set<string>>(new Set())

  const handleCopy = async () => {
    const text = typeof data === "string" ? data : JSON.stringify(data, null, 2)
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const toggleKey = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const getValueType = (value: any): string => {
    if (value === null) return "null"
    if (Array.isArray(value)) return "array"
    if (typeof value === "object") return "object"
    return typeof value
  }

  const getValueColor = (type: string): string => {
    switch (type) {
      case "string":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800"
      case "number":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800"
      case "boolean":
        return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-800"
      case "null":
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-950/30 dark:text-gray-400 dark:border-gray-800"
      case "array":
        return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800"
      case "object":
        return "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-800"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  const renderValue = (value: any, path: string = "", level: number = 0): React.ReactNode => {
    const type = getValueType(value)
    const isExpanded = expandedKeys.has(path)

    if (value === null) {
      return (
        <Badge
          variant="outline"
          className={cn("font-mono text-xs", getValueColor("null"))}
        >
          <Hash className="h-3 w-3 mr-1" />
          null
        </Badge>
      )
    }

    if (typeof value === "string") {
      const displayValue = value.length > 100 ? `${value.substring(0, 100)}...` : value
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="outline"
            className={cn("font-mono text-xs", getValueColor("string"))}
          >
            <Type className="h-3 w-3 mr-1" />
            string
          </Badge>
          <Badge variant="secondary" className="text-xs font-normal max-w-md truncate">
            "{displayValue}"
          </Badge>
        </div>
      )
    }

    if (typeof value === "number") {
      return (
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn("font-mono text-xs", getValueColor("number"))}
          >
            <Hash className="h-3 w-3 mr-1" />
            number
          </Badge>
          <Badge variant="secondary" className="text-xs font-mono">
            {value}
          </Badge>
        </div>
      )
    }

    if (typeof value === "boolean") {
      return (
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn("font-mono text-xs", getValueColor("boolean"))}
          >
            <Hash className="h-3 w-3 mr-1" />
            boolean
          </Badge>
          <Badge variant="secondary" className="text-xs font-mono">
            {String(value)}
          </Badge>
        </div>
      )
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return (
          <Badge
            variant="outline"
            className={cn("font-mono text-xs", getValueColor("array"))}
          >
            <List className="h-3 w-3 mr-1" />
            Array (0)
          </Badge>
        )
      }

      return (
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-1.5 gap-2"
            onClick={() => toggleKey(path)}
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
            <Badge
              variant="outline"
              className={cn("font-mono text-xs", getValueColor("array"))}
            >
              <List className="h-3 w-3 mr-1" />
              Array ({value.length})
            </Badge>
          </Button>
          {isExpanded && (
            <div className="ml-4 space-y-2 pl-4 border-l-2 border-border/50">
              {value.map((item, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs font-mono bg-muted">
                      [{idx}]
                    </Badge>
                    <Separator orientation="vertical" className="h-4" />
                    {renderValue(item, `${path}[${idx}]`, level + 1)}
                  </div>
                  {idx < value.length - 1 && <Separator className="my-1" />}
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }

    if (typeof value === "object") {
      const entries = Object.entries(value)
      if (entries.length === 0) {
        return (
          <Badge
            variant="outline"
            className={cn("font-mono text-xs", getValueColor("object"))}
          >
            <Tag className="h-3 w-3 mr-1" />
            Object (0)
          </Badge>
        )
      }

      return (
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-1.5 gap-2"
            onClick={() => toggleKey(path)}
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
            <Badge
              variant="outline"
              className={cn("font-mono text-xs", getValueColor("object"))}
            >
              <Tag className="h-3 w-3 mr-1" />
              Object ({entries.length})
            </Badge>
          </Button>
          {isExpanded && (
            <div className="ml-4 space-y-2 pl-4 border-l-2 border-border/50">
              {entries.map(([key, val], idx) => {
                const valType = getValueType(val)
                return (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className="text-xs font-semibold bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800"
                      >
                        <Key className="h-3 w-3 mr-1" />
                        {key}
                      </Badge>
                      <Separator orientation="vertical" className="h-4" />
                      <Badge
                        variant="outline"
                        className={cn("text-xs font-mono", getValueColor(valType))}
                      >
                        {valType}
                      </Badge>
                      <Separator orientation="vertical" className="h-4" />
                      {renderValue(val, path ? `${path}.${key}` : key, level + 1)}
                    </div>
                    {idx < entries.length - 1 && <Separator className="my-1" />}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )
    }

    return (
      <Badge variant="secondary" className="text-xs">
        {String(value)}
      </Badge>
    )
  }

  let jsonObj
  try {
    jsonObj = typeof data === "string" ? JSON.parse(data) : data
  } catch (e) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-destructive">
            Invalid JSON format. Raw content:
            <pre className="mt-2 p-2 bg-muted rounded text-xs font-mono whitespace-pre-wrap break-words">
              {data}
            </pre>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileJson className="h-4 w-4" />
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Badge variant="secondary" className="text-xs">
              JSON
            </Badge>
          </div>
          <div className="flex items-center gap-2">
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
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? (
                <span className="text-xs">Hide</span>
              ) : (
                <span className="text-xs">Show</span>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      {isOpen && (
        <CardContent>
          <ScrollArea className="h-[500px] w-full rounded-md border bg-muted/30 p-4">
            <div className="space-y-3">{renderValue(jsonObj)}</div>
          </ScrollArea>
        </CardContent>
      )}
    </Card>
  )
}

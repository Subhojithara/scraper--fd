"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import type { JobStatusHistory } from "@/lib/api"

interface JobTimelineProps {
  history: JobStatusHistory[]
}

export function JobTimeline({ history }: JobTimelineProps) {
  const sortedHistory = [...history].sort((a, b) => {
    const timeA = a.timestamp || ''
    const timeB = b.timestamp || ''
    return new Date(timeA).getTime() - new Date(timeB).getTime()
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-gray-500" />
      default:
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500"
      case "failed":
        return "bg-red-500"
      case "pending":
        return "bg-gray-500"
      default:
        return "bg-blue-500"
    }
  }

  if (sortedHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Job Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No status history available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Job Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedHistory.map((entry, index) => (
            <div key={entry.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(entry.status)}`} />
                {index < sortedHistory.length - 1 && (
                  <div className="w-0.5 h-full bg-border min-h-[2rem]" />
                )}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  {getStatusIcon(entry.status)}
                  <Badge variant="outline" className="text-xs">
                    {entry.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(entry.timestamp || '').toLocaleString()}
                  </span>
                </div>
                {entry.message && (
                  <p className="text-sm text-muted-foreground ml-6">
                    {entry.message.length > 100 
                      ? `${entry.message.substring(0, 100)}...` 
                      : entry.message}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}


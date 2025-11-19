"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Activity, CheckCircle2, XCircle, Clock, TrendingUp } from "lucide-react"
import type { Job } from "@/lib/api"

interface JobStatisticsProps {
  jobs: Job[]
}

export function JobStatistics({ jobs }: JobStatisticsProps) {
  const total = jobs.length
  const completed = jobs.filter(j => j.status === "completed").length
  const failed = jobs.filter(j => j.status === "failed").length
  const pending = jobs.filter(j => j.status === "pending").length
  const processing = jobs.filter(j => ["scraping", "cleaning", "researching"].includes(j.status)).length
  
  const successRate = total > 0 ? (completed / total) * 100 : 0
  const withCleaned = jobs.filter(j => j.cleaned_s3_key).length
  const withResearch = jobs.filter(j => j.research_s3_key).length
  
  // Calculate average processing time
  const completedJobs = jobs.filter(j => j.status === "completed")
  const avgTime = completedJobs.length > 0
    ? completedJobs.reduce((sum, job) => {
        if (!job.created_at || !job.updated_at) return sum
        const start = new Date(job.created_at).getTime()
        const end = new Date(job.updated_at).getTime()
        return sum + (end - start)
      }, 0) / completedJobs.length / 1000 // Convert to seconds
    : 0
  
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`
    return `${Math.round(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{total}</div>
          <p className="text-xs text-muted-foreground">
            {completed} completed, {failed} failed
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{successRate.toFixed(1)}%</div>
          <Progress value={successRate} className="mt-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pending + processing}</div>
          <div className="flex gap-2 mt-2">
            <Badge variant="outline">{pending} pending</Badge>
            <Badge variant="outline">{processing} processing</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Data Processing</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Cleaned Data</span>
              <span className="font-medium">{withCleaned}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Research Data</span>
              <span className="font-medium">{withResearch}</span>
            </div>
            {avgTime > 0 && (
              <div className="flex justify-between text-sm mt-2 pt-2 border-t">
                <span>Avg Time</span>
                <span className="font-medium">{formatTime(avgTime)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


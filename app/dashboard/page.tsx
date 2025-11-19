"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getUnifiedJobs, getUnifiedStats, getFailedEmailStats, getEmailStats, getEmailCostSummary, getFollowUpStats, type Job, type JobAI, type UnifiedStats, type FailedEmailStats, type EmailStats, type CostSummary, type FollowUpStats } from "@/lib/api"
import {
  Activity,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Brain,
  DollarSign,
  Loader2,
  RefreshCw,
  TrendingUp,
  Download,
  Filter,
  Mail,
  AlertCircle,
} from "lucide-react"
import { JobCardAdvanced } from "@/components/job-card-advanced"
import { AIJobCardAdvanced } from "@/components/ai-job-card-advanced"
import { FailedEmailList } from "@/components/failed-email-list"
import { deleteJob, deleteAIJob } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react"
import Link from "next/link"

// Simple chart component using SVG (no external dependencies)
function JobsChart({ data }: { data: UnifiedStats["jobs_per_day"] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
        No data available
      </div>
    )
  }

  const maxValue = Math.max(...data.map(d => d.total), 1)
  const chartHeight = 200
  const chartWidth = 100
  const padding = 20
  const barWidth = Math.max(4, (chartWidth - padding * 2) / data.length - 2)

  return (
    <div className="w-full h-64 flex items-end justify-between gap-1 px-2">
      {data.slice(-14).map((item, index) => {
        const height = (item.total / maxValue) * (chartHeight - padding * 2)
        const date = new Date(item.date)
        const isToday = format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
        
        return (
          <div key={index} className="flex flex-col items-center flex-1 group relative">
            <div className="w-full flex flex-col items-center justify-end h-48">
              <div
                className="w-full bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t transition-all duration-300 hover:from-blue-600 hover:to-cyan-500 group-hover:opacity-80"
                style={{ height: `${Math.max(height, 2)}px`, minHeight: item.total > 0 ? "4px" : "0" }}
                title={`${item.date}: ${item.total} jobs`}
              />
            </div>
            <span className="text-[10px] text-muted-foreground mt-1 transform -rotate-45 origin-top-left whitespace-nowrap">
              {format(date, "MM/dd")}
            </span>
            {isToday && (
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full" />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function Dashboard() {
  const [regularJobs, setRegularJobs] = useState<Job[]>([])
  const [aiJobs, setAIJobs] = useState<JobAI[]>([])
  const [stats, setStats] = useState<UnifiedStats | null>(null)
  const [emailStats, setEmailStats] = useState<FailedEmailStats | null>(null)
  const [emailGeneralStats, setEmailGeneralStats] = useState<EmailStats | null>(null)
  const [emailCost, setEmailCost] = useState<CostSummary | null>(null)
  const [followUpStats, setFollowUpStats] = useState<FollowUpStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showFailedEmails, setShowFailedEmails] = useState(false)

  const fetchData = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true)
      setError(null)
      
      // Fetch stats and jobs in parallel
      const [statsData, jobsData, failedEmailStats, generalEmailStats, costSummary, followUpStatsData] = await Promise.all([
        getUnifiedStats(),
        getUnifiedJobs(0, 10), // Only fetch recent jobs for display
        getFailedEmailStats().catch(() => null), // Don't fail if email stats fail
        getEmailStats().catch(() => null), // Don't fail if email stats fail
        getEmailCostSummary().catch(() => null), // Don't fail if cost summary fails
        getFollowUpStats().catch(() => null), // Don't fail if follow-up stats fail
      ])
      
      setStats(statsData)
      setRegularJobs(jobsData.regular_jobs)
      setAIJobs(jobsData.ai_jobs)
      setEmailStats(failedEmailStats)
      setEmailGeneralStats(generalEmailStats)
      setEmailCost(costSummary)
      setFollowUpStats(followUpStatsData)
      setLastUpdate(new Date())
    } catch (err: any) {
      console.error("Failed to fetch dashboard data:", err)
      setError(err.message || "Failed to load dashboard data")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    
    // Poll every 3 seconds for live updates
    const interval = setInterval(() => {
      fetchData(false)
    }, 3000)
    
    return () => clearInterval(interval)
  }, [fetchData])

  const handleDeleteJob = async (jobId: string) => {
    try {
      await deleteJob(jobId)
      setRegularJobs((prev) => prev.filter((j) => j.job_id !== jobId))
      // Refresh stats after deletion
      fetchData(false)
    } catch (error) {
      console.error("Failed to delete job:", error)
    }
  }

  const handleDeleteAIJob = async (jobId: string) => {
    try {
      await deleteAIJob(jobId)
      setAIJobs((prev) => prev.filter((j) => j.job_id !== jobId))
      // Refresh stats after deletion
      fetchData(false)
    } catch (error) {
      console.error("Failed to delete AI job:", error)
    }
  }

  const handleRefresh = () => {
    fetchData(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error && !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <XCircle className="h-12 w-12 text-destructive" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  const regularStats = stats?.regular || {
    total: 0,
    pending: 0,
    active: 0,
    completed: 0,
    failed: 0,
  }

  const aiStats = stats?.ai || {
    total: 0,
    pending: 0,
    active: 0,
    completed: 0,
    failed: 0,
    cancelled: 0,
    total_cost: 0,
    total_tokens: 0,
  }

  const combinedStats = stats?.combined || {
    total: 0,
    active: 0,
    completed: 0,
    failed: 0,
  }

  const hasActiveJobs = combinedStats.active > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
            {hasActiveJobs && (
              <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-medium text-green-600 dark:text-green-400">Live</span>
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {lastUpdate && `Last updated: ${format(lastUpdate, "HH:mm:ss")}`}
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 hover:border-border transition-colors">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <FileText className="h-4 w-4" />
              Regular Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{regularStats.total.toLocaleString()}</div>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                {regularStats.completed}
              </span>
              <span className="flex items-center gap-1">
                <XCircle className="h-3 w-3 text-red-600" />
                {regularStats.failed}
              </span>
              {regularStats.active > 0 && (
                <span className="flex items-center gap-1">
                  <Activity className="h-3 w-3 text-blue-600" />
                  {regularStats.active}
                </span>
              )}
            </div>
            {regularStats.total > 0 && (
              <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-500"
                  style={{
                    width: `${(regularStats.completed / regularStats.total) * 100}%`,
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:border-border transition-colors">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <Brain className="h-4 w-4" />
              AI Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{aiStats.total.toLocaleString()}</div>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                {aiStats.completed}
              </span>
              <span className="flex items-center gap-1">
                <XCircle className="h-3 w-3 text-red-600" />
                {aiStats.failed}
              </span>
              {aiStats.active > 0 && (
                <span className="flex items-center gap-1">
                  <Activity className="h-3 w-3 text-purple-600" />
                  {aiStats.active}
                </span>
              )}
            </div>
            {aiStats.total > 0 && (
              <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 transition-all duration-500"
                  style={{
                    width: `${(aiStats.completed / aiStats.total) * 100}%`,
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:border-border transition-colors">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <Activity className="h-4 w-4" />
              Active Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{combinedStats.active.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Currently processing
            </p>
            {hasActiveJobs && (
              <div className="mt-3 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-muted-foreground">Real-time updates</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:border-border transition-colors">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              Total Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${aiStats.total_cost.toFixed(4)}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {aiStats.total_tokens.toLocaleString()} tokens
            </p>
            {aiStats.total_cost > 0 && (
              <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-500 transition-all duration-500"
                  style={{
                    width: `${Math.min((aiStats.total_cost / 10) * 100, 100)}%`,
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Email Statistics Section */}
      {(emailStats || emailGeneralStats || emailCost) && (
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Generation Statistics
              </CardTitle>
              <div className="flex items-center gap-2">
                {emailStats && emailStats.total_failed > 0 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFailedEmails(!showFailedEmails)}
                      className="gap-2"
                    >
                      {showFailedEmails ? (
                        <>
                          <ChevronUp className="h-4 w-4" />
                          Hide Failed Emails
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          View Failed Emails ({emailStats.total_failed})
                        </>
                      )}
                    </Button>
                    <Link href="/emails">
                      <Button variant="outline" size="sm" className="gap-2">
                        <ExternalLink className="h-4 w-4" />
                        Manage All
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Failed Emails</p>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <p className="text-3xl font-bold">{emailStats?.total_failed || 0}</p>
                </div>
                {emailStats && emailStats.failed_last_24h > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {emailStats.failed_last_24h} in last 24h
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Completed Emails</p>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <p className="text-3xl font-bold">
                    {emailGeneralStats?.completed || 0}
                  </p>
                </div>
                {emailGeneralStats && emailGeneralStats.total_emails > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {((emailGeneralStats.completed / emailGeneralStats.total_emails) * 100).toFixed(1)}% success rate
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total Email Cost</p>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-yellow-600" />
                  <p className="text-3xl font-bold">
                    ${emailGeneralStats?.total_cost.toFixed(4) || emailCost?.monthly_cost.toFixed(4) || '0.0000'}
                  </p>
                </div>
                {emailCost && emailCost.monthly_limit > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {((emailCost.monthly_cost / emailCost.monthly_limit) * 100).toFixed(1)}% of monthly limit
                  </p>
                )}
              </div>
            </div>
            {emailStats && Object.keys(emailStats.failed_by_error_type).length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium mb-2">Top Error Types</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(emailStats.failed_by_error_type)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([errorType, count]) => (
                      <div key={errorType} className="flex items-center gap-1 px-2 py-1 bg-destructive/10 rounded text-xs">
                        <AlertCircle className="h-3 w-3 text-destructive" />
                        <span className="font-medium">{errorType}</span>
                        <span className="text-muted-foreground">({count})</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Failed Emails List */}
      {showFailedEmails && emailStats && emailStats.total_failed > 0 && (
        <div className="mt-4">
          <FailedEmailList
            onRetry={() => {
              fetchData(false)
            }}
          />
        </div>
      )}

      {/* Follow-up Email Statistics */}
      {followUpStats && followUpStats.total_follow_ups > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Follow-up Email Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total Follow-ups</p>
                <p className="text-2xl font-bold">{followUpStats.total_follow_ups}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Completed</p>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <p className="text-2xl font-bold">{followUpStats.completed}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Failed</p>
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-destructive" />
                  <p className="text-2xl font-bold">{followUpStats.failed}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total Cost</p>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  <p className="text-2xl font-bold">${followUpStats.total_cost.toFixed(2)}</p>
                </div>
              </div>
            </div>
            {followUpStats.total_follow_ups > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium mb-2">By Sequence</p>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map(seq => (
                    <div key={seq} className="text-center p-2 bg-muted rounded">
                      <p className="text-xs text-muted-foreground">{seq === 1 ? "1st" : seq === 2 ? "2nd" : seq === 3 ? "3rd" : "4th"}</p>
                      <p className="text-lg font-bold">{followUpStats.by_sequence[seq] || 0}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Success Rate: {followUpStats.success_rate.toFixed(1)}% | 
                  Avg Cost: ${followUpStats.avg_cost_per_follow_up.toFixed(6)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Chart */}
      {stats?.jobs_per_day && stats.jobs_per_day.length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Jobs Over Time (Last 14 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <JobsChart data={stats.jobs_per_day} />
          </CardContent>
        </Card>
      )}

      {/* Recent Jobs */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Regular Jobs</h2>
            {regularJobs.length > 0 && (
              <span className="text-xs text-muted-foreground">
                Showing {regularJobs.length} of {regularStats.total}
              </span>
            )}
          </div>
          {regularJobs.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No regular jobs yet
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {regularJobs.map((job) => (
                <JobCardAdvanced
                  key={job.job_id}
                  job={job}
                  onDelete={handleDeleteJob}
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent AI Jobs</h2>
            {aiJobs.length > 0 && (
              <span className="text-xs text-muted-foreground">
                Showing {aiJobs.length} of {aiStats.total}
              </span>
            )}
          </div>
          {aiJobs.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No AI jobs yet
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {aiJobs.map((job) => (
                <AIJobCardAdvanced
                  key={job.job_id}
                  job={job}
                  onDelete={handleDeleteAIJob}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

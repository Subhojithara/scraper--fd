"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, RefreshCw, Filter } from "lucide-react"
import { getFailedEmailStats, FailedEmailStats } from "@/lib/api"
import { useToast } from "@/components/toast"

export function FailedEmailsDashboard() {
  const { addToast } = useToast()
  const [stats, setStats] = React.useState<FailedEmailStats | null>(null)
  const [loading, setLoading] = React.useState(true)

  const loadStats = React.useCallback(async () => {
    try {
      setLoading(true)
      const data = await getFailedEmailStats()
      setStats(data)
    } catch (error: any) {
      addToast(error.message || "Failed to load failed email statistics", "error")
    } finally {
      setLoading(false)
    }
  }, [addToast])

  React.useEffect(() => {
    loadStats()
  }, [loadStats])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Failed Emails Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Failed Emails Overview</CardTitle>
              <CardDescription>Statistics about failed email generations</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadStats}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Failed</p>
              <p className="text-3xl font-bold">{stats.total_failed}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Last 24 Hours</p>
              <p className="text-3xl font-bold">{stats.failed_last_24h}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Last 7 Days</p>
              <p className="text-3xl font-bold">{stats.failed_last_7d}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Last 30 Days</p>
              <p className="text-3xl font-bold">{stats.failed_last_30d}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {Object.keys(stats.failed_by_error_type).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Failed by Error Type</CardTitle>
            <CardDescription>Breakdown of failures by error category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(stats.failed_by_error_type).map(([errorType, count]) => (
                <div key={errorType} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <span className="font-medium">{errorType}</span>
                  </div>
                  <Badge variant="destructive">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


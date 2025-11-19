"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { DollarSign, TrendingUp, AlertTriangle, RefreshCw } from "lucide-react"
import { getEmailCostSummary, CostSummary } from "@/lib/api"
import { useToast } from "@/components/toast"
import { Button } from "@/components/ui/button"

export function CostDashboard() {
  const { addToast } = useToast()
  const [costSummary, setCostSummary] = React.useState<CostSummary | null>(null)
  const [loading, setLoading] = React.useState(true)

  const loadCostSummary = React.useCallback(async () => {
    try {
      setLoading(true)
      const data = await getEmailCostSummary()
      setCostSummary(data)
    } catch (error: any) {
      addToast(error.message || "Failed to load cost summary", "error")
    } finally {
      setLoading(false)
    }
  }, [addToast])

  React.useEffect(() => {
    loadCostSummary()
    // Refresh every 30 seconds
    const interval = setInterval(loadCostSummary, 30000)
    return () => clearInterval(interval)
  }, [loadCostSummary])

  if (loading && !costSummary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cost Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!costSummary) {
    return null
  }

  const dailyPercentage = Math.min(costSummary.daily_percentage, 100)
  const monthlyPercentage = Math.min(costSummary.monthly_percentage, 100)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Cost Dashboard</CardTitle>
              <CardDescription>Monitor email generation costs and budgets</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadCostSummary}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Daily Cost */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Daily Cost</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold">
                  ${costSummary.daily_cost.toFixed(2)}
                </span>
                <span className="text-xs text-muted-foreground ml-2">
                  / ${costSummary.daily_limit.toFixed(2)}
                </span>
              </div>
            </div>
            <Progress value={dailyPercentage} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {dailyPercentage.toFixed(1)}% of daily limit used
            </p>
          </div>

          {/* Monthly Cost */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Monthly Cost</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold">
                  ${costSummary.monthly_cost.toFixed(2)}
                </span>
                <span className="text-xs text-muted-foreground ml-2">
                  / ${costSummary.monthly_limit.toFixed(2)}
                </span>
              </div>
            </div>
            <Progress value={monthlyPercentage} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {monthlyPercentage.toFixed(1)}% of monthly limit used
            </p>
          </div>

          {/* Per Job Limit */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Per Job Limit</span>
              <span className="text-sm font-semibold">
                ${costSummary.per_job_limit.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Alerts */}
          {costSummary.alerts.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Cost Alerts</h4>
              {costSummary.alerts.map((alert, index) => (
                <Alert key={index} variant={alert.current_cost_usd >= alert.threshold_usd ? "destructive" : "default"}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>{alert.alert_type.replace("_", " ").toUpperCase()}</AlertTitle>
                  <AlertDescription>
                    {alert.message || `Current: $${alert.current_cost_usd.toFixed(2)}, Threshold: $${alert.threshold_usd.toFixed(2)}`}
                    {alert.created_at && (
                      <span className="block text-xs mt-1">
                        {new Date(alert.created_at).toLocaleString()}
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


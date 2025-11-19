"use client"

import { FailedEmailList } from "@/components/failed-email-list"
import { FailedEmailsDashboard } from "@/components/failed-emails-dashboard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, AlertCircle } from "lucide-react"

export default function EmailsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-2">
          <Mail className="h-8 w-8" />
          Email Management
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage and retry failed email generations
        </p>
      </div>

      {/* Failed Emails Dashboard */}
      <FailedEmailsDashboard />

      {/* Failed Emails List */}
      <FailedEmailList />
    </div>
  )
}


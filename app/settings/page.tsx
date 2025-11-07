"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Save, RefreshCw } from "lucide-react";
import { useState } from "react";

export default function SettingsPage() {
  const [apiUrl, setApiUrl] = useState(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5);

  const handleSave = () => {
    // Save settings to localStorage
    localStorage.setItem("apiUrl", apiUrl);
    localStorage.setItem("autoRefresh", String(autoRefresh));
    localStorage.setItem("refreshInterval", String(refreshInterval));
    alert("Settings saved!");
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure your application preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            General Settings
          </CardTitle>
          <CardDescription>Configure general application settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-url">API URL</Label>
            <Input
              id="api-url"
              type="url"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="http://localhost:8000"
            />
            <p className="text-xs text-muted-foreground">Backend API endpoint URL</p>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="auto-refresh"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="h-4 w-4 rounded"
            />
            <Label htmlFor="auto-refresh" className="cursor-pointer">Enable Auto Refresh</Label>
          </div>
          {autoRefresh && (
            <div className="space-y-2">
              <Label htmlFor="refresh-interval">Refresh Interval (seconds)</Label>
              <Input
                id="refresh-interval"
                type="number"
                min="1"
                max="60"
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(parseInt(e.target.value) || 5)}
              />
            </div>
          )}
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>Current system status and version</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Frontend Version</span>
            <span className="text-sm font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">API URL</span>
            <span className="text-sm font-medium">{apiUrl}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


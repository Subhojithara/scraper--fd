"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Settings, Save } from "lucide-react"
import { getStoredApiKey, setStoredApiKey } from "@/lib/api"
import { ProxySettings } from "@/components/proxy-settings"

export default function SettingsPage() {
  const [openaiKey, setOpenaiKey] = useState("")
  const [geminiKey, setGeminiKey] = useState("")
  const [apiUrl, setApiUrl] = useState(
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
  )

  useEffect(() => {
    const savedOpenaiKey = getStoredApiKey("openai")
    const savedGeminiKey = getStoredApiKey("gemini")
    const savedApiUrl = localStorage.getItem("apiUrl")
    if (savedOpenaiKey) setOpenaiKey(savedOpenaiKey)
    if (savedGeminiKey) setGeminiKey(savedGeminiKey)
    if (savedApiUrl) setApiUrl(savedApiUrl)
  }, [])

  const handleSave = () => {
    if (openaiKey) setStoredApiKey("openai", openaiKey)
    if (geminiKey) setStoredApiKey("gemini", geminiKey)
    localStorage.setItem("apiUrl", apiUrl)
    alert("Settings saved!")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure your application preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            API Keys
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="openai-key">OpenAI API Key</Label>
            <Input
              id="openai-key"
              type="password"
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              placeholder="sk-..."
            />
            <p className="text-xs text-muted-foreground">
              Your OpenAI API key (stored locally)
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="gemini-key">Gemini API Key</Label>
            <Input
              id="gemini-key"
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="AIza..."
            />
            <p className="text-xs text-muted-foreground">
              Your Gemini API key (stored locally)
            </p>
          </div>
        </CardContent>
      </Card>

      <ProxySettings />

      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
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
            <p className="text-xs text-muted-foreground">
              Backend API endpoint URL
            </p>
          </div>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

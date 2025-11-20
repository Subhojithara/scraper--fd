"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Network, Save, RefreshCw } from "lucide-react"

export function ProxySettings() {
  const [proxies, setProxies] = useState("")
  const [loading, setLoading] = useState(false)

  const fetchProxies = async () => {
    setLoading(true)
    try {
      // Get API URL - use window.location.origin for same-origin requests
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/api"
      const url = apiUrl.startsWith("http") ? `${apiUrl}/settings/proxies` : `/api/settings/proxies`

      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setProxies(data.proxies.join("\n"))
      } else {
        const errorText = await res.text()
        console.error("Failed to fetch proxies:", res.status, errorText)
        alert(`Failed to fetch proxies: ${res.status} ${res.statusText}`)
      }
    } catch (error) {
      console.error("Error fetching proxies:", error)
      alert(`Error fetching proxies: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProxies()
  }, [])

  const handleSave = async () => {
    setLoading(true)
    try {
      // Get API URL - use window.location.origin for same-origin requests
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/api"
      const url = apiUrl.startsWith("http") ? `${apiUrl}/settings/proxies` : `/api/settings/proxies`
      const proxyList = proxies.split("\n").filter(p => p.trim())

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ proxies: proxyList }),
      })

      if (res.ok) {
        alert("Proxies saved successfully!")
        fetchProxies()
      } else {
        const errorText = await res.text()
        console.error("Failed to save proxies:", res.status, errorText)
        alert(`Failed to save proxies: ${res.status} ${res.statusText}\n${errorText}`)
      }
    } catch (error) {
      console.error("Error saving proxies:", error)
      alert(`Error saving proxies: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="h-4 w-4" />
          Proxy Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="proxies">
            Proxies (one per line)
            <span className="text-xs text-muted-foreground ml-2">
              Format: host:port or host:port:user:pass
            </span>
          </Label>
          <Textarea
            id="proxies"
            value={proxies}
            onChange={(e) => setProxies(e.target.value)}
            placeholder="192.168.1.1:8080:user:pass"
            className="min-h-[200px] font-mono text-sm"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            Save Proxies
          </Button>
          <Button variant="outline" onClick={fetchProxies} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

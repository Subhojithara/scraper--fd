"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  BookOpen,
  Rocket,
  Brain,
  FileText,
  Upload,
  Settings,
  Search,
  Download,
  Filter,
  Zap,
  Code,
  Database,
  BarChart3,
  HelpCircle,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Info,
  Lightbulb,
  Keyboard,
  Clock,
  Loader2,
  XCircle,
  RefreshCw,
  Trash2,
} from "lucide-react"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"

const sections = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: Rocket,
    color: "text-blue-600 dark:text-blue-400",
  },
  {
    id: "ai-jobs",
    title: "AI Jobs",
    icon: Brain,
    color: "text-purple-600 dark:text-purple-400",
  },
  {
    id: "regular-jobs",
    title: "Regular Jobs",
    icon: FileText,
    color: "text-green-600 dark:text-green-400",
  },
  {
    id: "bulk-operations",
    title: "Bulk Operations",
    icon: Upload,
    color: "text-orange-600 dark:text-orange-400",
  },
  {
    id: "features",
    title: "Advanced Features",
    icon: Zap,
    color: "text-yellow-600 dark:text-yellow-400",
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    icon: HelpCircle,
    color: "text-red-600 dark:text-red-400",
  },
]

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("getting-started")

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Documentation</h1>
            <p className="text-muted-foreground">
              Complete guide to using Per(ve)Scrape
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-sm">Table of Contents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon
                return (
                  <Button
                    key={section.id}
                    variant={activeSection === section.id ? "secondary" : "ghost"}
                    className="w-full justify-start gap-2"
                    onClick={() => setActiveSection(section.id)}
                  >
                    <Icon className={`h-4 w-4 ${section.color}`} />
                    <span className="text-sm">{section.title}</span>
                  </Button>
                )
              })}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Getting Started */}
          {activeSection === "getting-started" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Rocket className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <CardTitle>Getting Started</CardTitle>
                  </div>
                  <CardDescription>
                    Learn the basics of Per(ve)Scrape
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Welcome to Per(ve)Scrape</h3>
                    <p className="text-muted-foreground">
                      Per(ve)Scrape is an AI-powered web scraping platform that combines traditional
                      scraping techniques with advanced LLM-based extraction. Whether you need to
                      scrape structured data or extract information using natural language instructions,
                      we've got you covered.
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      Quick Start Guide
                    </h3>
                    <ol className="space-y-3 list-decimal list-inside">
                      <li className="text-muted-foreground">
                        <strong className="text-foreground">Navigate to Dashboard</strong> - Get an overview
                        of all your jobs and system status
                      </li>
                      <li className="text-muted-foreground">
                        <strong className="text-foreground">Create Your First Job</strong> - Choose between
                        Regular Jobs or AI Jobs based on your needs
                      </li>
                      <li className="text-muted-foreground">
                        <strong className="text-foreground">Monitor Progress</strong> - Track job status,
                        view results, and manage your scraping tasks
                      </li>
                      <li className="text-muted-foreground">
                        <strong className="text-foreground">Export Data</strong> - Download your scraped
                        data in various formats (JSON, CSV, XLSX)
                      </li>
                    </ol>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                          Pro Tip
                        </h4>
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          Start with a simple AI Job to see how LLM extraction works. You can use
                          natural language to describe what data you want to extract!
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* AI Jobs */}
          {activeSection === "ai-jobs" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <CardTitle>AI Jobs</CardTitle>
                  </div>
                  <CardDescription>
                    Leverage AI to extract data using natural language
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">What are AI Jobs?</h3>
                    <p className="text-muted-foreground">
                      AI Jobs use Large Language Models (LLMs) to extract structured data from web pages.
                      Instead of writing complex selectors, you describe what you want in natural language.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Creating an AI Job</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="p-1.5 rounded bg-primary/10 mt-0.5">
                          <span className="text-sm font-bold text-primary">1</span>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">Enter URL</h4>
                          <p className="text-sm text-muted-foreground">
                            Provide the target webpage URL you want to scrape
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="p-1.5 rounded bg-primary/10 mt-0.5">
                          <span className="text-sm font-bold text-primary">2</span>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">Define Extraction Schema</h4>
                          <p className="text-sm text-muted-foreground">
                            Describe the data structure you want to extract (e.g., "Extract product name,
                            price, and description")
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="p-1.5 rounded bg-primary/10 mt-0.5">
                          <span className="text-sm font-bold text-primary">3</span>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">Choose LLM Provider</h4>
                          <p className="text-sm text-muted-foreground">
                            Select your preferred LLM provider (OpenAI, Anthropic, etc.) or use "none"
                            for basic extraction
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="p-1.5 rounded bg-primary/10 mt-0.5">
                          <span className="text-sm font-bold text-primary">4</span>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">Configure Options</h4>
                          <p className="text-sm text-muted-foreground">
                            Set output format (JSON, Markdown), strategy, and other advanced options
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Job Status</h3>
                    <div className="grid gap-2 md:grid-cols-2">
                      <div className="p-3 border rounded-lg">
                        <Badge variant="secondary" className="mb-2">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          Job is queued and waiting to be processed
                        </p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <Badge variant="default" className="mb-2">
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Processing
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          Job is currently being scraped and extracted
                        </p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <Badge variant="default" className="mb-2 bg-green-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          Job finished successfully, data is available
                        </p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <Badge variant="destructive" className="mb-2">
                          <XCircle className="h-3 w-3 mr-1" />
                          Failed
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          Job encountered an error, check error message
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Regular Jobs */}
          {activeSection === "regular-jobs" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <CardTitle>Regular Jobs</CardTitle>
                  </div>
                  <CardDescription>
                    Traditional web scraping with CSS selectors
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Regular Scraping Jobs</h3>
                    <p className="text-muted-foreground">
                      Regular Jobs use traditional web scraping techniques with CSS selectors and XPath
                      to extract data. Perfect for structured websites with consistent layouts.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">When to Use Regular Jobs</h3>
                    <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                      <li>You know the exact structure of the target website</li>
                      <li>You need faster, more cost-effective scraping</li>
                      <li>The website has consistent HTML structure</li>
                      <li>You want to extract large volumes of data</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Bulk Operations */}
          {activeSection === "bulk-operations" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Upload className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    <CardTitle>Bulk Operations</CardTitle>
                  </div>
                  <CardDescription>
                    Process multiple URLs at once
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Bulk Upload</h3>
                    <p className="text-muted-foreground">
                      Upload a file containing multiple URLs to process them all at once. Supported formats:
                      TXT (one URL per line), CSV, or JSON.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Bulk Actions</h3>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <RefreshCw className="h-4 w-4" />
                          <h4 className="font-semibold">Bulk Retry</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Retry multiple failed jobs at once
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Download className="h-4 w-4" />
                          <h4 className="font-semibold">Bulk Export</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Export multiple jobs in one operation
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Trash2 className="h-4 w-4" />
                          <h4 className="font-semibold">Bulk Delete</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Delete multiple jobs simultaneously
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Filter className="h-4 w-4" />
                          <h4 className="font-semibold">Bulk Filter</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Apply filters to multiple jobs
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Advanced Features */}
          {activeSection === "features" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    <CardTitle>Advanced Features</CardTitle>
                  </div>
                  <CardDescription>
                    Power user features and shortcuts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Keyboard className="h-5 w-5" />
                      Keyboard Shortcuts
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <span className="text-sm">Toggle Sidebar</span>
                        <kbd className="px-2 py-1 text-xs font-semibold bg-background border rounded">Ctrl/Cmd + B</kbd>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <span className="text-sm">Search Jobs</span>
                        <kbd className="px-2 py-1 text-xs font-semibold bg-background border rounded">Ctrl/Cmd + K</kbd>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <span className="text-sm">Create New Job</span>
                        <kbd className="px-2 py-1 text-xs font-semibold bg-background border rounded">Ctrl/Cmd + N</kbd>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Data Export Options</h3>
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="p-3 border rounded-lg">
                        <Code className="h-5 w-5 mb-2 text-blue-600" />
                        <h4 className="font-semibold mb-1">JSON</h4>
                        <p className="text-xs text-muted-foreground">
                          Structured data format, perfect for APIs
                        </p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <Database className="h-5 w-5 mb-2 text-green-600" />
                        <h4 className="font-semibold mb-1">CSV</h4>
                        <p className="text-xs text-muted-foreground">
                          Spreadsheet format, great for Excel
                        </p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <FileText className="h-5 w-5 mb-2 text-orange-600" />
                        <h4 className="font-semibold mb-1">XLSX</h4>
                        <p className="text-xs text-muted-foreground">
                          Excel format with formatting
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Analytics & Monitoring</h3>
                    <p className="text-muted-foreground mb-3">
                      Track your scraping performance with built-in analytics:
                    </p>
                    <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                      <li>Total jobs and completion rates</li>
                      <li>Cost tracking for AI jobs</li>
                      <li>Token usage statistics</li>
                      <li>Average processing times</li>
                      <li>Success rate metrics</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Troubleshooting */}
          {activeSection === "troubleshooting" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    <CardTitle>Troubleshooting</CardTitle>
                  </div>
                  <CardDescription>
                    Common issues and solutions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Common Issues</h3>
                    <div className="space-y-4">
                      <div className="p-4 border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20 rounded-r-lg">
                        <div className="flex items-start gap-2 mb-2">
                          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                          <h4 className="font-semibold text-yellow-900 dark:text-yellow-100">
                            Job Stuck in Processing
                          </h4>
                        </div>
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          If a job is stuck in processing for too long, try canceling and retrying it.
                          This often happens with slow-loading websites or network issues.
                        </p>
                      </div>

                      <div className="p-4 border-l-4 border-red-500 bg-red-50 dark:bg-red-950/20 rounded-r-lg">
                        <div className="flex items-start gap-2 mb-2">
                          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                          <h4 className="font-semibold text-red-900 dark:text-red-100">
                            Extraction Failed
                          </h4>
                        </div>
                        <p className="text-sm text-red-800 dark:text-red-200">
                          Check the error message in the job card. Common causes: invalid URL, website
                          blocking, or unclear extraction schema. Try refining your schema description.
                        </p>
                      </div>

                      <div className="p-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/20 rounded-r-lg">
                        <div className="flex items-start gap-2 mb-2">
                          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                          <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                            High Costs
                          </h4>
                        </div>
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          AI jobs can be expensive with large pages. Consider using Regular Jobs for
                          structured data, or optimize your extraction schema to be more specific.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Best Practices</h3>
                    <div className="space-y-2">
                      <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                        <Lightbulb className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div>
                          <h4 className="font-semibold mb-1">Be Specific in Schemas</h4>
                          <p className="text-sm text-muted-foreground">
                            The more specific your extraction schema, the better the results and lower the cost.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                        <Lightbulb className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div>
                          <h4 className="font-semibold mb-1">Monitor Job Status</h4>
                          <p className="text-sm text-muted-foreground">
                            Regularly check job status and retry failed jobs promptly.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                        <Lightbulb className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div>
                          <h4 className="font-semibold mb-1">Use Bulk Operations</h4>
                          <p className="text-sm text-muted-foreground">
                            For multiple URLs, use bulk upload instead of creating individual jobs.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  BookOpen,
  Rocket,
  Brain,
  FileText,
  Upload,
  Settings,
  Zap,
  Code,
  Database,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Info,
  Lightbulb,
  Clock,
  Loader2,
  XCircle,
  Network,
  Mail,
  MessageSquare,
  BarChart3,
  Shield,
  Globe,
} from "lucide-react"
import { Separator } from "@/components/ui/separator"

const sections = [
  {
    id: "overview",
    title: "Overview",
    icon: BookOpen,
    color: "text-blue-600 dark:text-blue-400",
  },
  {
    id: "getting-started",
    title: "Getting Started",
    icon: Rocket,
    color: "text-green-600 dark:text-green-400",
  },
  {
    id: "ai-scraping",
    title: "AI-Powered Scraping",
    icon: Brain,
    color: "text-purple-600 dark:text-purple-400",
  },
  {
    id: "email-generation",
    title: "Email Generation",
    icon: Mail,
    color: "text-orange-600 dark:text-orange-400",
  },
  {
    id: "proxy-management",
    title: "Proxy Management",
    icon: Network,
    color: "text-cyan-600 dark:text-cyan-400",
  },
  {
    id: "architecture",
    title: "System Architecture",
    icon: Database,
    color: "text-indigo-600 dark:text-indigo-400",
  },
  {
    id: "api-reference",
    title: "API Reference",
    icon: Code,
    color: "text-pink-600 dark:text-pink-400",
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    icon: HelpCircle,
    color: "text-red-600 dark:text-red-400",
  },
]

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("overview")

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Subhajit's AI Scraper Documentation</h1>
            <p className="text-muted-foreground">
              Complete guide to the AI-powered web scraping platform
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
          {/* Overview */}
          {activeSection === "overview" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <CardTitle>Project Overview</CardTitle>
                  </div>
                  <CardDescription>
                    An enterprise-grade AI-powered web scraping platform
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">What is Subhajit's AI Scraper?</h3>
                    <p className="text-muted-foreground">
                      This is a production-ready, scalable web scraping platform that combines traditional scraping
                      techniques with cutting-edge AI capabilities. Built with modern microservices architecture,
                      it leverages Crawl4AI for intelligent web scraping, Kafka for distributed job processing,
                      and multiple LLM providers for advanced data extraction and email generation.
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Key Features</h3>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="p-3 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Brain className="h-5 w-5 text-purple-600" />
                          <h4 className="font-semibold">AI-Powered Extraction</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Use natural language to describe what data you want to extract. Supports OpenAI, Gemini, and more.
                        </p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Mail className="h-5 w-5 text-orange-600" />
                          <h4 className="font-semibold">Email Generation</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Automatically generate personalized cold emails and follow-ups based on scraped data.
                        </p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Network className="h-5 w-5 text-cyan-600" />
                          <h4 className="font-semibold">Proxy Management</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Hot-reload proxy support with automatic rotation and health checking.
                        </p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="h-5 w-5 text-yellow-600" />
                          <h4 className="font-semibold">Distributed Processing</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Kafka-based job queue with multiple specialized workers for scalable processing.
                        </p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Database className="h-5 w-5 text-green-600" />
                          <h4 className="font-semibold">Data Storage</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          PostgreSQL for metadata, MinIO S3 for scraped content, Redis for caching.
                        </p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <BarChart3 className="h-5 w-5 text-blue-600" />
                          <h4 className="font-semibold">Analytics & Monitoring</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Real-time job tracking, cost analysis, and performance metrics.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                          Built by Subhajit
                        </h4>
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          This platform is designed for enterprise-scale web scraping with a focus on reliability,
                          scalability, and AI-powered intelligence.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Getting Started */}
          {activeSection === "getting-started" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Rocket className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <CardTitle>Getting Started</CardTitle>
                  </div>
                  <CardDescription>
                    Quick start guide to begin scraping
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      Quick Start Guide
                    </h3>
                    <ol className="space-y-3 list-decimal list-inside">
                      <li className="text-muted-foreground">
                        <strong className="text-foreground">Configure API Keys</strong> - Go to Settings and add your
                        OpenAI or Gemini API keys for AI-powered features
                      </li>
                      <li className="text-muted-foreground">
                        <strong className="text-foreground">Create Your First AI Job</strong> - Navigate to AI Jobs
                        and enter a URL with extraction instructions
                      </li>
                      <li className="text-muted-foreground">
                        <strong className="text-foreground">Monitor Progress</strong> - Watch real-time status updates
                        as your job is processed
                      </li>
                      <li className="text-muted-foreground">
                        <strong className="text-foreground">View Results</strong> - Access extracted data in JSON or
                        Markdown format
                      </li>
                      <li className="text-muted-foreground">
                        <strong className="text-foreground">Generate Emails</strong> - Optionally create personalized
                        cold emails from the scraped data
                      </li>
                    </ol>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold mb-3">System Requirements</h3>
                    <div className="space-y-2">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <h4 className="font-semibold mb-1">Backend Stack</h4>
                        <p className="text-sm text-muted-foreground">
                          FastAPI, PostgreSQL, Kafka, Redis, MinIO S3, Nginx
                        </p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <h4 className="font-semibold mb-1">Frontend Stack</h4>
                        <p className="text-sm text-muted-foreground">
                          Next.js 14, React, TypeScript, Tailwind CSS, shadcn/ui
                        </p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <h4 className="font-semibold mb-1">Workers</h4>
                        <p className="text-sm text-muted-foreground">
                          Crawl4AI Worker, Email Worker, Follow-up Worker, Research Worker
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* AI Scraping */}
          {activeSection === "ai-scraping" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <CardTitle>AI-Powered Scraping</CardTitle>
                  </div>
                  <CardDescription>
                    Leverage LLMs for intelligent data extraction
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">How It Works</h3>
                    <p className="text-muted-foreground mb-3">
                      The AI scraping engine uses Crawl4AI to fetch and render web pages, then employs Large Language
                      Models to extract structured data based on your natural language instructions.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Supported Strategies</h3>
                    <div className="space-y-2">
                      <div className="p-3 border rounded-lg">
                        <Badge className="mb-2">single_page</Badge>
                        <p className="text-sm text-muted-foreground">
                          Extract data from a single page. Best for product pages, articles, or profiles.
                        </p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <Badge className="mb-2">multi_page</Badge>
                        <p className="text-sm text-muted-foreground">
                          Follow links and scrape multiple pages. Ideal for catalogs or directories.
                        </p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <Badge className="mb-2">sitemap</Badge>
                        <p className="text-sm text-muted-foreground">
                          Use sitemap.xml to discover and scrape all pages. Perfect for comprehensive site scraping.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold mb-3">LLM Providers</h3>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="p-3 border rounded-lg">
                        <h4 className="font-semibold mb-1">OpenAI</h4>
                        <p className="text-sm text-muted-foreground">
                          GPT-4, GPT-3.5 Turbo - High quality, reliable extraction
                        </p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <h4 className="font-semibold mb-1">Google Gemini</h4>
                        <p className="text-sm text-muted-foreground">
                          Gemini 2.5 Flash - Fast, cost-effective, great for bulk operations
                        </p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <h4 className="font-semibold mb-1">None</h4>
                        <p className="text-sm text-muted-foreground">
                          Basic extraction without LLM - Free, fast, no API key needed
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Job Status Flow</h3>
                    <div className="grid gap-2 md:grid-cols-2">
                      <div className="p-3 border rounded-lg">
                        <Badge variant="secondary" className="mb-2">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          Job queued in Kafka, waiting for worker
                        </p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <Badge variant="default" className="mb-2">
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Processing
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          Crawl4AI worker is scraping and extracting
                        </p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <Badge variant="default" className="mb-2 bg-green-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          Data extracted and stored in MinIO S3
                        </p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <Badge variant="destructive" className="mb-2">
                          <XCircle className="h-3 w-3 mr-1" />
                          Failed
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          Error occurred, check logs for details
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Email Generation */}
          {activeSection === "email-generation" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    <CardTitle>Email Generation</CardTitle>
                  </div>
                  <CardDescription>
                    AI-powered cold email and follow-up creation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Automated Email Workflows</h3>
                    <p className="text-muted-foreground">
                      After scraping company or contact data, the system can automatically generate personalized
                      cold emails and follow-ups using AI. Each email is tailored based on the extracted information.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Email Features</h3>
                    <div className="space-y-2">
                      <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                          <h4 className="font-semibold mb-1">Personalization</h4>
                          <p className="text-sm text-muted-foreground">
                            Uses scraped data to create highly personalized email content
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                          <h4 className="font-semibold mb-1">Follow-up Sequences</h4>
                          <p className="text-sm text-muted-foreground">
                            Automatically generate follow-up emails with scheduling support
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                          <h4 className="font-semibold mb-1">Custom Prompts</h4>
                          <p className="text-sm text-muted-foreground">
                            Define your own email generation prompts for specific use cases
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                          <h4 className="font-semibold mb-1">Retry & Error Handling</h4>
                          <p className="text-sm text-muted-foreground">
                            Automatic retry for failed email generations with exponential backoff
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Email Worker Architecture</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      The email worker consumes jobs from Kafka, fetches scraped data from MinIO S3,
                      and uses LLMs to generate emails. All emails are stored in PostgreSQL with
                      metadata including cost tracking and retry counts.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Proxy Management */}
          {activeSection === "proxy-management" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Network className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                    <CardTitle>Proxy Management</CardTitle>
                  </div>
                  <CardDescription>
                    Hot-reload proxy support with rotation and health checks
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Proxy System</h3>
                    <p className="text-muted-foreground">
                      The platform includes a sophisticated proxy management system that supports hot-reloading,
                      automatic rotation, health checking, and failure handling. Proxies are shared across all
                      workers via a Docker volume.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Key Features</h3>
                    <div className="space-y-2">
                      <div className="p-3 border rounded-lg">
                        <h4 className="font-semibold mb-1">Hot Reload</h4>
                        <p className="text-sm text-muted-foreground">
                          Update proxies without restarting workers. Changes are detected automatically.
                        </p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <h4 className="font-semibold mb-1">Health Checking</h4>
                        <p className="text-sm text-muted-foreground">
                          Automatic health checks with configurable intervals. Failed proxies are marked and avoided.
                        </p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <h4 className="font-semibold mb-1">Rotation Strategies</h4>
                        <p className="text-sm text-muted-foreground">
                          Round-robin, random, or least-used rotation strategies available.
                        </p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <h4 className="font-semibold mb-1">Statistics Tracking</h4>
                        <p className="text-sm text-muted-foreground">
                          Track success rates, response times, and failure counts per proxy.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Proxy Format</h3>
                    <div className="p-4 bg-muted/50 rounded-lg font-mono text-sm">
                      <div className="space-y-1">
                        <div>host:port</div>
                        <div>host:port:username:password</div>
                        <div>http://username:password@host:port</div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Add proxies in the Settings page. One proxy per line.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Architecture */}
          {activeSection === "architecture" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <CardTitle>System Architecture</CardTitle>
                  </div>
                  <CardDescription>
                    Microservices-based distributed architecture
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Core Components</h3>
                    <div className="space-y-3">
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          Frontend (Next.js)
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Server-side rendered React application with TypeScript. Communicates with backend via
                          REST API through Nginx reverse proxy.
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Code className="h-4 w-4" />
                          Backend API (FastAPI)
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          High-performance Python API with async support. Handles job creation, status updates,
                          and data retrieval. Publishes jobs to Kafka topics.
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          Message Queue (Kafka)
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Distributed event streaming platform. Manages job queues with partitioning for
                          priority-based processing. Includes Zookeeper for coordination.
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Database className="h-4 w-4" />
                          Database (PostgreSQL)
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Stores job metadata, status, emails, and analytics. Uses PgBouncer for connection pooling.
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Object Storage (MinIO S3)
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          S3-compatible storage for scraped content (JSON, Markdown, HTML). Organized by job ID.
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          Cache (Redis)
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          In-memory cache for real-time status updates and pub/sub messaging.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Worker Services</h3>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="p-3 border rounded-lg">
                        <Badge className="mb-2">Crawl4AI Worker</Badge>
                        <p className="text-sm text-muted-foreground">
                          Handles AI-powered scraping with LLM extraction
                        </p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <Badge className="mb-2">Email Worker</Badge>
                        <p className="text-sm text-muted-foreground">
                          Generates personalized cold emails
                        </p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <Badge className="mb-2">Follow-up Worker</Badge>
                        <p className="text-sm text-muted-foreground">
                          Creates follow-up email sequences
                        </p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <Badge className="mb-2">Research Worker</Badge>
                        <p className="text-sm text-muted-foreground">
                          Performs additional research on scraped data
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* API Reference */}
          {activeSection === "api-reference" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Code className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                    <CardTitle>API Reference</CardTitle>
                  </div>
                  <CardDescription>
                    REST API endpoints and usage
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Base URL</h3>
                    <div className="p-3 bg-muted/50 rounded-lg font-mono text-sm">
                      https://localhost/api
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Key Endpoints</h3>
                    <div className="space-y-3">
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge>POST</Badge>
                          <code className="text-sm">/scrape-ai</code>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Create a new AI scraping job. Requires URL, strategy, LLM provider, and output format.
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge>GET</Badge>
                          <code className="text-sm">/jobs-ai/{"{job_id}"}</code>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Get AI job status and metadata by job ID.
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge>GET</Badge>
                          <code className="text-sm">/jobs-ai/{"{job_id}"}/json</code>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Download extracted data in JSON format.
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge>POST</Badge>
                          <code className="text-sm">/settings/proxies</code>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Update proxy list. Accepts array of proxy strings.
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge>GET</Badge>
                          <code className="text-sm">/health</code>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Health check endpoint with service status.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                          API Documentation
                        </h4>
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          Full interactive API documentation is available at{" "}
                          <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">
                            https://localhost/api/docs
                          </code>
                        </p>
                      </div>
                    </div>
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
                            Kafka Connection Errors
                          </h4>
                        </div>
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          Ensure Kafka and Zookeeper services are running. Check that topics have correct partition counts
                          (crawl4ai-jobs needs 3 partitions).
                        </p>
                      </div>

                      <div className="p-4 border-l-4 border-red-500 bg-red-50 dark:bg-red-950/20 rounded-r-lg">
                        <div className="flex items-start gap-2 mb-2">
                          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                          <h4 className="font-semibold text-red-900 dark:text-red-100">
                            Worker Database Connection Failed
                          </h4>
                        </div>
                        <p className="text-sm text-red-800 dark:text-red-200">
                          Workers need DATABASE_URL environment variable set to connect to PostgreSQL.
                          Use <code>postgres:5432</code> as hostname, not <code>localhost</code>.
                        </p>
                      </div>

                      <div className="p-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/20 rounded-r-lg">
                        <div className="flex items-start gap-2 mb-2">
                          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                          <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                            Proxy Save Failed
                          </h4>
                        </div>
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          Ensure PROXY_FILE_PATH environment variable is set in backend.
                          Check that the proxies volume is mounted correctly.
                        </p>
                      </div>

                      <div className="p-4 border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-950/20 rounded-r-lg">
                        <div className="flex items-start gap-2 mb-2">
                          <Info className="h-5 w-5 text-purple-600 mt-0.5" />
                          <h4 className="font-semibold text-purple-900 dark:text-purple-100">
                            Nginx 404 Errors
                          </h4>
                        </div>
                        <p className="text-sm text-purple-800 dark:text-purple-200">
                          Nginx needs to strip the /api prefix. Ensure <code>location /api/</code> has
                          <code>proxy_pass http://backend/;</code> with trailing slash.
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
                          <h4 className="font-semibold mb-1">Monitor Logs</h4>
                          <p className="text-sm text-muted-foreground">
                            Use <code>docker logs [container-name]</code> to check worker and service logs for errors.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                        <Lightbulb className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div>
                          <h4 className="font-semibold mb-1">Rebuild After Code Changes</h4>
                          <p className="text-sm text-muted-foreground">
                            Use <code>docker-compose up -d --build</code> to rebuild images after modifying code.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                        <Lightbulb className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div>
                          <h4 className="font-semibold mb-1">Check Service Health</h4>
                          <p className="text-sm text-muted-foreground">
                            Visit <code>/health</code> endpoint to verify all services are connected and healthy.
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
import * as XLSX from "xlsx"
import type { Job, JobAI, EmailJob, FollowUp } from "./api"

export interface ScratcherJobData {
  job: JobAI
  emails: EmailJob[]
  followUps: FollowUp[]
  markdownContent?: string
}

export type ExportFormat = "json" | "csv" | "xlsx"
export type ExportScope = "all" | "filtered" | "selected"
export type ExportDataLevel = "basic" | "summary" | "full"

interface ExportOptions {
  format: ExportFormat
  scope: ExportScope
  dataLevel: ExportDataLevel
  includeData?: boolean
}

// Flatten nested objects for CSV/Excel export
function flattenObject(obj: any, prefix = ""): Record<string, any> {
  const flattened: Record<string, any> = {}
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newKey = prefix ? `${prefix}.${key}` : key
      const value = obj[key]
      
      if (value === null || value === undefined) {
        flattened[newKey] = ""
      } else if (typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
        Object.assign(flattened, flattenObject(value, newKey))
      } else if (Array.isArray(value)) {
        flattened[newKey] = value.map((item) => 
          typeof item === "object" ? JSON.stringify(item) : String(item)
        ).join("; ")
      } else {
        flattened[newKey] = value
      }
    }
  }
  
  return flattened
}

// Prepare job data for export
function prepareJobForExport(job: Job, dataLevel: ExportDataLevel): Record<string, any> {
  const basic = {
    job_id: job.job_id,
    url: job.url,
    status: job.status,
    created_at: job.created_at,
    updated_at: job.updated_at,
    enable_scraping: job.enable_scraping,
    enable_cleaning: job.enable_cleaning,
    enable_research: job.enable_research,
  }

  if (dataLevel === "basic") {
    return basic
  }

  const summary = {
    ...basic,
    error_message: job.error_message || "",
    research_status: job.research_status || "",
    research_summary: job.research_summary || "",
    research_topics: job.research_topics || "",
    has_raw_data: !!job.s3_key,
    has_cleaned_data: !!job.cleaned_s3_key,
    has_research_data: !!job.research_s3_key,
  }

  if (dataLevel === "summary") {
    return summary
  }

  return {
    ...summary,
    s3_key: job.s3_key || "",
    cleaned_s3_key: job.cleaned_s3_key || "",
    research_s3_key: job.research_s3_key || "",
    research_insights: job.research_insights || "",
  }
}

// Prepare AI job data for export
function prepareAIJobForExport(job: JobAI, dataLevel: ExportDataLevel): Record<string, any> {
  const basic = {
    job_id: job.job_id,
    url: job.url,
    status: job.status,
    strategy: job.strategy,
    llm_provider: job.llm_provider,
    output_format: job.output_format,
    created_at: job.created_at,
    updated_at: job.updated_at,
    pages_crawled: job.pages_crawled || 0,
  }

  if (dataLevel === "basic") {
    return basic
  }

  const summary = {
    ...basic,
    error_message: job.error_message || "",
    extraction_prompt: job.extraction_prompt || "",
    research_prompt: job.research_prompt || "",
    research_status: job.research_status || "",
    research_summary: job.research_summary || "",
    research_topics: job.research_topics || "",
    processing_time_ms: job.processing_time_ms || 0,
    cost_usd: job.cost_usd || 0,
    tokens_used: job.tokens_used || 0,
    has_json_data: !!job.json_s3_key,
    has_markdown_data: !!job.markdown_s3_key,
    has_metadata: !!job.metadata_s3_key,
    has_cleaned_data: !!job.cleaned_s3_key,
    has_research_data: !!job.research_s3_key,
  }

  if (dataLevel === "summary") {
    return summary
  }

  return {
    ...summary,
    json_s3_key: job.json_s3_key || "",
    markdown_s3_key: job.markdown_s3_key || "",
    metadata_s3_key: job.metadata_s3_key || "",
    cleaned_s3_key: job.cleaned_s3_key || "",
    research_s3_key: job.research_s3_key || "",
    extracted_data: job.extracted_data ? JSON.stringify(job.extracted_data) : "",
    research_insights: job.research_insights || "",
  }
}

// Export to JSON
export function exportToJSON<T>(data: T[], filename: string) {
  const jsonStr = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonStr], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${filename}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Export to CSV
export function exportToCSV(data: Record<string, any>[], filename: string) {
  if (data.length === 0) {
    throw new Error("No data to export")
  }

  // Flatten all objects
  const flattened = data.map((item) => flattenObject(item))
  
  // Get all unique keys
  const allKeys = new Set<string>()
  flattened.forEach((item) => {
    Object.keys(item).forEach((key) => allKeys.add(key))
  })
  
  const headers = Array.from(allKeys).sort()
  
  // Create CSV rows
  const csvRows = [
    headers.join(","),
    ...flattened.map((row) =>
      headers
        .map((header) => {
          const value = row[header] ?? ""
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          const stringValue = String(value).replace(/"/g, '""')
          if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
            return `"${stringValue}"`
          }
          return stringValue
        })
        .join(",")
    ),
  ]
  
  const csvContent = csvRows.join("\n")
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${filename}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Export to Excel
export function exportToExcel(data: Record<string, any>[], filename: string) {
  if (data.length === 0) {
    throw new Error("No data to export")
  }

  // Flatten all objects
  const flattened = data.map((item) => flattenObject(item))
  
  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(flattened)
  
  // Auto-size columns
  const maxWidth = 50
  const colWidths = Object.keys(flattened[0] || {}).map((key) => {
    const maxLength = Math.max(
      key.length,
      ...flattened.map((row) => String(row[key] || "").length)
    )
    return { wch: Math.min(maxLength + 2, maxWidth) }
  })
  worksheet["!cols"] = colWidths
  
  // Create workbook
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Jobs")
  
  // Write file
  XLSX.writeFile(workbook, `${filename}.xlsx`)
}

// Main export function for regular jobs
export async function exportJobs(
  allJobs: Job[],
  filteredJobs: Job[],
  selectedJobIds: string[] | Set<string>,
  options: ExportOptions
): Promise<void> {
  let jobsToExport: Job[]
  const selectedSet = selectedJobIds instanceof Set ? selectedJobIds : new Set(selectedJobIds)

  switch (options.scope) {
    case "all":
      jobsToExport = allJobs
      break
    case "filtered":
      jobsToExport = filteredJobs
      break
    case "selected":
      jobsToExport = allJobs.filter((job) => selectedSet.has(job.job_id))
      if (jobsToExport.length === 0) {
        throw new Error("No jobs selected for export")
      }
      break
    default:
      jobsToExport = filteredJobs
  }

  const preparedData = jobsToExport.map((job) => prepareJobForExport(job, options.dataLevel))
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5)
  const filename = `jobs-export-${timestamp}`

  switch (options.format) {
    case "json":
      exportToJSON(preparedData, filename)
      break
    case "csv":
      exportToCSV(preparedData, filename)
      break
    case "xlsx":
      exportToExcel(preparedData, filename)
      break
    default:
      throw new Error(`Unsupported export format: ${options.format}`)
  }
}

// Main export function for AI jobs
export async function exportAIJobs(
  allJobs: JobAI[],
  filteredJobs: JobAI[],
  selectedJobIds: string[] | Set<string>,
  options: ExportOptions
): Promise<void> {
  let jobsToExport: JobAI[]
  const selectedSet = selectedJobIds instanceof Set ? selectedJobIds : new Set(selectedJobIds)

  switch (options.scope) {
    case "all":
      jobsToExport = allJobs
      break
    case "filtered":
      jobsToExport = filteredJobs
      break
    case "selected":
      jobsToExport = allJobs.filter((job) => selectedSet.has(job.job_id))
      if (jobsToExport.length === 0) {
        throw new Error("No jobs selected for export")
      }
      break
    default:
      jobsToExport = filteredJobs
  }

  const preparedData = jobsToExport.map((job) => prepareAIJobForExport(job, options.dataLevel))
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5)
  const filename = `ai-jobs-export-${timestamp}`

  switch (options.format) {
    case "json":
      exportToJSON(preparedData, filename)
      break
    case "csv":
      exportToCSV(preparedData, filename)
      break
    case "xlsx":
      exportToExcel(preparedData, filename)
      break
    default:
      throw new Error(`Unsupported export format: ${options.format}`)
  }
}


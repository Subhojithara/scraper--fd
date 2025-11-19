import * as XLSX from "xlsx"
import type { ScratcherJobData } from "./export-utils"

// Helper functions (copied from export-utils to avoid circular dependencies)
function exportToJSON<T>(data: T[], filename: string) {
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

function exportToCSV(data: Record<string, any>[], filename: string) {
  if (data.length === 0) {
    throw new Error("No data to export")
  }

  // Get all unique keys
  const allKeys = new Set<string>()
  data.forEach((item) => {
    Object.keys(item).forEach((key) => allKeys.add(key))
  })
  
  const headers = Array.from(allKeys).sort()
  
  // Create CSV rows
  const csvRows = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header] ?? ""
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

// Export function for Scratcher data
export async function exportScratcherData(
  data: ScratcherJobData[],
  format: "csv" | "json" | "excel"
): Promise<void> {
  if (data.length === 0) {
    throw new Error("No data to export")
  }

  // Prepare data for export - focus on content, not status
  const preparedData = data.map((item) => {
    return {
      website_url: item.job.url,
      website_content: item.markdownContent || "",
      emails: item.emails.map((e) => ({
        email_content: e.email_content || "",
      })),
      follow_ups: item.followUps.map((f) => ({
        sequence_number: f.sequence_number,
        follow_up_content: f.email_content || "",
      })),
    }
  })

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5)
  const filename = `scratcher-export-${timestamp}`

  switch (format) {
    case "json":
      exportToJSON(preparedData, filename)
      break
    case "csv":
      // Flatten nested arrays for CSV - focus on content
      const csvData = data.flatMap((item) => {
        const websiteUrl = item.job.url
        const websiteContent = item.markdownContent || ""
        
        // If no emails/follow-ups, return one row with website info
        if (item.emails.length === 0 && item.followUps.length === 0) {
          return {
            website_url: websiteUrl,
            website_content: websiteContent,
            email_content: "",
            follow_up_sequence: "",
            follow_up_content: "",
          }
        }
        
        // Create rows for each email and follow-up combination
        const rows: any[] = []
        const maxCount = Math.max(item.emails.length, item.followUps.length, 1)
        
        for (let i = 0; i < maxCount; i++) {
          const email = item.emails[i]
          const followUp = item.followUps[i]
          
          rows.push({
            website_url: websiteUrl,
            website_content: websiteContent,
            email_content: email?.email_content || "",
            follow_up_sequence: followUp?.sequence_number ? `Follow-up ${followUp.sequence_number}` : "",
            follow_up_content: followUp?.email_content || "",
          })
        }
        
        return rows
      })
      exportToCSV(csvData, filename)
      break
    case "excel":
      // For Excel, create multiple sheets - focus on content
      const workbook = XLSX.utils.book_new()
      
      // Websites sheet with content
      const websitesSheet = XLSX.utils.json_to_sheet(
        data.map((item) => ({
          website_url: item.job.url,
          website_content: item.markdownContent || "",
        }))
      )
      XLSX.utils.book_append_sheet(workbook, websitesSheet, "Websites")
      
      // Emails sheet
      const emailsData = data.flatMap((item) =>
        item.emails.map((email) => ({
          website_url: item.job.url,
          email_content: email.email_content || "",
        }))
      )
      if (emailsData.length > 0) {
        const emailsSheet = XLSX.utils.json_to_sheet(emailsData)
        XLSX.utils.book_append_sheet(workbook, emailsSheet, "Emails")
      }
      
      // Follow-ups sheet
      const followUpsData = data.flatMap((item) =>
        item.followUps.map((followUp) => ({
          website_url: item.job.url,
          follow_up_sequence: `Follow-up ${followUp.sequence_number}`,
          follow_up_content: followUp.email_content || "",
        }))
      )
      if (followUpsData.length > 0) {
        const followUpsSheet = XLSX.utils.json_to_sheet(followUpsData)
        XLSX.utils.book_append_sheet(workbook, followUpsSheet, "Follow-ups")
      }
      
      XLSX.writeFile(workbook, `${filename}.xlsx`)
      break
    default:
      throw new Error(`Unsupported export format: ${format}`)
  }
}


"use client"

import { BulkAIJobDialog } from "@/components/bulk-ai-job-dialog"
import { BulkJobDialog } from "@/components/bulk-job-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Brain, FileText } from "lucide-react"

export default function BulkUploadPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Bulk Upload</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload URLs via CSV or JSON to create multiple scraping jobs at once
        </p>
      </div>

      <Tabs defaultValue="ai" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="ai">
            <Brain className="mr-2 h-4 w-4" />
            AI Jobs
          </TabsTrigger>
          <TabsTrigger value="regular">
            <FileText className="mr-2 h-4 w-4" />
            Regular Jobs
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="ai" className="mt-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <BulkAIJobDialog />
          </div>
        </TabsContent>
        
        <TabsContent value="regular" className="mt-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <BulkJobDialog />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

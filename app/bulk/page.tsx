"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FileUp, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { createBulkJobsFromCSV, getAllJobs } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function BulkUploadPage() {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [bulkResult, setBulkResult] = useState<{ created: number; failed: number; errors: any[] } | null>(null);
  const router = useRouter();

  const handleCsvUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) {
      alert("Please select a CSV file");
      return;
    }
    try {
      setCsvLoading(true);
      setBulkResult(null);
      setUploadProgress(0);
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => prev >= 90 ? prev : prev + 5);
      }, 200);
      const result = await createBulkJobsFromCSV(csvFile);
      clearInterval(progressInterval);
      setUploadProgress(100);
      setBulkResult({ created: result.created, failed: result.failed, errors: result.errors });
      setCsvFile(null);
      setTimeout(() => setUploadProgress(0), 2000);
      if (result.failed > 0) {
        alert(`Created ${result.created} jobs. ${result.failed} URLs failed.`);
      } else {
        alert(`Successfully created ${result.created} jobs!`);
      }
    } catch (error: any) {
      console.error("Failed to upload CSV:", error);
      alert(`Failed to upload CSV: ${error.message || "Unknown error"}`);
      setUploadProgress(0);
    } finally {
      setCsvLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.csv') && !file.name.toLowerCase().endsWith('.txt')) {
        alert("Please select a CSV or TXT file");
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        alert("File size must be less than 100MB");
        return;
      }
      setCsvFile(file);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Bulk Upload</h1>
        <p className="text-muted-foreground mt-1">Upload a CSV file to create multiple scraping jobs at once</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>CSV File Upload</CardTitle>
          <CardDescription>
            Upload a CSV file containing URLs. The file should have URLs in the first column or a 'url' header.
            Maximum 100,000 URLs per file (100MB). All URLs will be processed asynchronously.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCsvUpload} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="csv-file">CSV File</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv,.txt"
                onChange={handleFileChange}
                disabled={csvLoading}
              />
              {csvFile && (
                <div className="text-sm text-muted-foreground">
                  {csvFile.name} ({(csvFile.size / 1024).toFixed(2)} KB)
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                CSV format: URLs in first column, or header row with "url" column. Supports .csv and .txt files.
              </p>
            </div>
            
            {csvLoading && uploadProgress > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Uploading...</span>
                  <span className="font-medium">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
            
            {bulkResult && (
              <div className="p-4 rounded-lg border bg-muted/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-lg">Upload Results</span>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-semibold">{bulkResult.created} created</span>
                    </div>
                    {bulkResult.failed > 0 && (
                      <div className="flex items-center gap-2 text-red-600">
                        <XCircle className="h-5 w-5" />
                        <span className="font-semibold">{bulkResult.failed} failed</span>
                      </div>
                    )}
                  </div>
                </div>
                {bulkResult.errors.length > 0 && (
                  <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                    <p className="text-sm font-medium">Errors:</p>
                    {bulkResult.errors.slice(0, 20).map((error, idx) => (
                      <div key={idx} className="text-xs p-2 bg-red-50 dark:bg-red-950/20 rounded border border-red-200 dark:border-red-900">
                        <div className="font-mono text-red-700 dark:text-red-400 truncate">{error.url}</div>
                        <div className="text-red-600 dark:text-red-500">{error.error}</div>
                      </div>
                    ))}
                    {bulkResult.errors.length > 20 && (
                      <div className="text-xs text-muted-foreground">
                        ... and {bulkResult.errors.length - 20} more errors
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            <div className="flex gap-2">
              <Button type="submit" disabled={csvLoading || !csvFile} className="flex-1">
                {csvLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Uploading & Creating Jobs...
                  </>
                ) : (
                  <>
                    <FileUp className="w-4 h-4 mr-2" />
                    Upload CSV & Create Jobs
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push("/jobs")}>
                View Jobs
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


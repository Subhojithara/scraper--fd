"use client";

import { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { JobCard } from "@/components/job-card";
import { DataViewer } from "@/components/data-viewer";
import { ResearchViewer } from "@/components/research-viewer";
import { Plus, RefreshCw, Trash2, FileUp, Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { createJob, getAllJobs, getRawData, getCleanedData, getResearchData, deleteJob, deleteAllJobs, createBulkJobsFromCSV, type Job, type ResearchData } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSearchParams } from "next/navigation";

function JobsPageContent() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState("");
  const [bulkResult, setBulkResult] = useState<{ created: number; failed: number; errors: any[] } | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dataViewerOpen, setDataViewerOpen] = useState(false);
  const [viewerData, setViewerData] = useState<{ title: string; data: string; type: "raw" | "cleaned" } | null>(null);
  const [researchData, setResearchData] = useState<ResearchData | null>(null);
  const [researchViewerOpen, setResearchViewerOpen] = useState(false);
  const [enableScraping, setEnableScraping] = useState(true);
  const [enableCleaning, setEnableCleaning] = useState(true);
  const [enableResearch, setEnableResearch] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "scraping" | "scraped" | "cleaning" | "completed" | "failed">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"created_at" | "updated_at" | "status">("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const searchParams = useSearchParams();

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const fetchedJobs = await getAllJobs();
      setJobs(fetchedJobs);
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const hasActiveJobs = jobs.some(job => 
      ["pending", "scraping", "cleaning", "researching"].includes(job.status)
    );
    const interval = setInterval(fetchJobs, hasActiveJobs ? 2000 : 5000);
    return () => clearInterval(interval);
  }, [jobs.length]);

  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "create") {
      // Scroll to create form
      document.getElementById("create-form")?.scrollIntoView({ behavior: "smooth" });
    } else if (action === "bulk") {
      // Switch to bulk tab
      const bulkTab = document.querySelector('[value="csv"]') as HTMLElement;
      bulkTab?.click();
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    try {
      setLoading(true);
      await createJob(url, enableScraping, enableCleaning, enableResearch);
      setUrl("");
      await fetchJobs();
    } catch (error) {
      console.error("Failed to create job:", error);
      alert("Failed to create job. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewRaw = async (jobId: string) => {
    try {
      const data = await getRawData(jobId);
      setViewerData({ title: `Raw Data - ${jobId.slice(0, 8)}...`, data: data.content, type: "raw" });
      setDataViewerOpen(true);
    } catch (error) {
      console.error("Failed to fetch raw data:", error);
      alert("Failed to fetch raw data. The job may not be completed yet.");
    }
  };

  const handleViewCleaned = async (jobId: string) => {
    try {
      const data = await getCleanedData(jobId);
      setViewerData({ title: `Cleaned Data - ${jobId.slice(0, 8)}...`, data: data.content, type: "cleaned" });
      setDataViewerOpen(true);
    } catch (error) {
      console.error("Failed to fetch cleaned data:", error);
      alert("Failed to fetch cleaned data. The job may not be completed yet.");
    }
  };

  const handleViewResearch = async (jobId: string) => {
    try {
      const data = await getResearchData(jobId);
      setResearchData(data);
      setResearchViewerOpen(true);
    } catch (error) {
      console.error("Failed to fetch research data:", error);
      alert("Failed to fetch research data. The research may not be completed yet.");
    }
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job?")) return;
    try {
      setLoading(true);
      await deleteJob(jobId);
      await fetchJobs();
    } catch (error) {
      console.error("Failed to delete job:", error);
      alert("Failed to delete job. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm("Are you sure you want to delete ALL jobs? This cannot be undone.")) return;
    if (!confirm("This will delete EVERYTHING. Are you absolutely sure?")) return;
    try {
      setLoading(true);
      const result = await deleteAllJobs();
      alert(`Successfully deleted ${result.jobs_deleted} jobs.`);
      await fetchJobs();
    } catch (error) {
      console.error("Failed to delete all jobs:", error);
      alert("Failed to delete all jobs. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
      await fetchJobs();
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

  let filteredJobs = filter === "all" ? jobs : jobs.filter(job => job.status === filter);
  if (searchQuery.trim()) {
    filteredJobs = filteredJobs.filter(job => 
      job.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.job_id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
  
  filteredJobs = [...filteredJobs].sort((a, b) => {
    let aValue: any = sortBy === "created_at" || sortBy === "updated_at" 
      ? new Date(a[sortBy] || 0).getTime() 
      : a[sortBy] || "";
    let bValue: any = sortBy === "created_at" || sortBy === "updated_at"
      ? new Date(b[sortBy] || 0).getTime()
      : b[sortBy] || "";
    return sortOrder === "asc" 
      ? (aValue > bValue ? 1 : aValue < bValue ? -1 : 0)
      : (aValue < bValue ? 1 : aValue > bValue ? -1 : 0);
  });
  
  const totalPages = Math.ceil(filteredJobs.length / pageSize);
  const paginatedJobs = filteredJobs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const statusCounts = {
    all: jobs.length,
    pending: jobs.filter(j => j.status === "pending").length,
    scraping: jobs.filter(j => j.status === "scraping").length,
    scraped: jobs.filter(j => j.status === "scraped").length,
    cleaning: jobs.filter(j => j.status === "cleaning").length,
    completed: jobs.filter(j => j.status === "completed" || j.status === "research_completed").length,
    failed: jobs.filter(j => j.status === "failed").length,
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Jobs</h1>
          <p className="text-muted-foreground mt-1">Manage and monitor your scraping jobs</p>
        </div>
        <Button variant="outline" onClick={fetchJobs} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {jobs.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Jobs</CardDescription>
              <CardTitle className="text-3xl">{statusCounts.all}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active</CardDescription>
              <CardTitle className="text-3xl text-blue-600">{statusCounts.pending + statusCounts.scraping + statusCounts.cleaning}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Completed</CardDescription>
              <CardTitle className="text-3xl text-green-600">{statusCounts.completed}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Failed</CardDescription>
              <CardTitle className="text-3xl text-red-600">{statusCounts.failed}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Create Job Forms */}
      <Tabs defaultValue="single" id="create-form">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="single">Single URL</TabsTrigger>
          <TabsTrigger value="csv">Bulk CSV Upload</TabsTrigger>
        </TabsList>
        
        <TabsContent value="single">
          <Card>
            <CardHeader>
              <CardTitle>Create New Scraping Job</CardTitle>
              <CardDescription>Enter a URL to start scraping</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    type="url"
                    placeholder="https://example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="flex-1"
                    disabled={loading}
                  />
                  <Button type="submit" disabled={loading || !url.trim()}>
                    {loading ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Creating...</> : <><Plus className="w-4 h-4 mr-2" />Create</>}
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="enable-scraping" checked={enableScraping} onChange={(e) => setEnableScraping(e.target.checked)} className="h-4 w-4 rounded" />
                    <Label htmlFor="enable-scraping" className="text-sm cursor-pointer">Enable Scraping</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="enable-cleaning" checked={enableCleaning} onChange={(e) => setEnableCleaning(e.target.checked)} className="h-4 w-4 rounded" />
                    <Label htmlFor="enable-cleaning" className="text-sm cursor-pointer">Enable Cleaning</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="enable-research" checked={enableResearch} onChange={(e) => setEnableResearch(e.target.checked)} className="h-4 w-4 rounded" />
                    <Label htmlFor="enable-research" className="text-sm cursor-pointer">Enable Research</Label>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="csv">
          <Card>
            <CardHeader>
              <CardTitle>Bulk CSV Upload</CardTitle>
              <CardDescription>Upload a CSV file with URLs (max 100MB, 100k URLs)</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCsvUpload} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="csv-file">CSV File</Label>
                  <Input id="csv-file" type="file" accept=".csv,.txt" onChange={handleFileChange} disabled={csvLoading} />
                  {csvFile && <div className="text-sm text-muted-foreground">{csvFile.name} ({(csvFile.size / 1024).toFixed(2)} KB)</div>}
                </div>
                {csvLoading && uploadProgress > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} />
                  </div>
                )}
                {bulkResult && (
                  <div className="p-4 rounded-lg border bg-muted/50">
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold">Results</span>
                      <span className="text-sm text-muted-foreground">{bulkResult.created} created, {bulkResult.failed} failed</span>
                    </div>
                    {bulkResult.errors.length > 0 && (
                      <div className="mt-3 space-y-1 max-h-32 overflow-y-auto">
                        {bulkResult.errors.slice(0, 10).map((error, idx) => (
                          <div key={idx} className="text-xs p-2 bg-red-50 dark:bg-red-950/20 rounded">
                            <div className="font-mono text-red-700 truncate">{error.url}</div>
                            <div className="text-red-600">{error.error}</div>
                          </div>
                        ))}
                        {bulkResult.errors.length > 10 && <div className="text-xs text-muted-foreground">... and {bulkResult.errors.length - 10} more</div>}
                      </div>
                    )}
                  </div>
                )}
                <Button type="submit" disabled={csvLoading || !csvFile} className="w-full">
                  {csvLoading ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Uploading...</> : <><FileUp className="w-4 h-4 mr-2" />Upload CSV</>}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Job List */}
      <Tabs value={filter} onValueChange={(v) => { setFilter(v as typeof filter); setCurrentPage(1); }}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({statusCounts.pending})</TabsTrigger>
          <TabsTrigger value="scraping">Scraping ({statusCounts.scraping})</TabsTrigger>
          <TabsTrigger value="scraped">Scraped ({statusCounts.scraped})</TabsTrigger>
          <TabsTrigger value="cleaning">Cleaning ({statusCounts.cleaning})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({statusCounts.completed})</TabsTrigger>
          <TabsTrigger value="failed">Failed ({statusCounts.failed})</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          <div className="space-y-4 mb-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">
                {filter === "all" ? "All Jobs" : filter.charAt(0).toUpperCase() + filter.slice(1) + " Jobs"}
                {filteredJobs.length !== jobs.length && <span className="ml-2 text-sm font-normal text-muted-foreground">({filteredJobs.length} of {jobs.length})</span>}
              </h2>
              {filter === "all" && jobs.length > 0 && (
                <Button variant="destructive" size="sm" onClick={handleDeleteAll} disabled={loading}>
                  <Trash2 className="w-4 h-4 mr-2" />Delete All
                </Button>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="text" placeholder="Search by URL or Job ID..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="pl-10" />
              </div>
              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                  <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Created At</SelectItem>
                    <SelectItem value="updated_at">Updated At</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")} className="px-3">
                  {sortOrder === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          {filteredJobs.length === 0 ? (
            <Card><CardContent className="py-12 text-center"><p className="text-muted-foreground">No {filter === "all" ? "" : filter + " "}jobs found.</p></CardContent></Card>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {paginatedJobs.map((job) => (
                  <JobCard key={job.job_id} job={job} onViewRaw={handleViewRaw} onViewCleaned={handleViewCleaned} onViewResearch={handleViewResearch} onDelete={handleDelete} />
                ))}
              </div>
              
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredJobs.length)} of {filteredJobs.length} jobs
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum = totalPages <= 5 ? i + 1 : currentPage <= 3 ? i + 1 : currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i;
                        return <Button key={pageNum} variant={currentPage === pageNum ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(pageNum)} className="w-10">{pageNum}</Button>;
                      })}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {viewerData && <DataViewer open={dataViewerOpen} onOpenChange={setDataViewerOpen} title={viewerData.title} data={viewerData.data} type={viewerData.type} />}
      <ResearchViewer open={researchViewerOpen} onOpenChange={setResearchViewerOpen} researchData={researchData} />
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={<div className="container mx-auto p-6">Loading...</div>}>
      <JobsPageContent />
    </Suspense>
  );
}

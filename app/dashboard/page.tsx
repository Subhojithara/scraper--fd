"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllJobs, type Job } from "@/lib/api";
import { Activity, CheckCircle2, Clock, XCircle, TrendingUp, FileText, Sparkles, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchJobs = async () => {
    try {
      const fetchedJobs = await getAllJobs(0, 1000);
      setJobs(fetchedJobs);
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: jobs.length,
    pending: jobs.filter(j => j.status === "pending").length,
    active: jobs.filter(j => ["scraping", "cleaning", "researching"].includes(j.status)).length,
    completed: jobs.filter(j => j.status === "completed" || j.status === "research_completed").length,
    failed: jobs.filter(j => j.status === "failed").length,
    withResearch: jobs.filter(j => j.research_s3_key).length,
  };

  const recentJobs = jobs
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your scraping operations</p>
        </div>
        <Button onClick={() => router.push("/jobs")} variant="default">
          View All Jobs
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All time jobs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Currently processing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Research</CardTitle>
            <Sparkles className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.withResearch}</div>
            <p className="text-xs text-muted-foreground">AI research completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="text-sm">Pending</span>
              </div>
              <span className="font-semibold">{stats.pending}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Active</span>
              </div>
              <span className="font-semibold">{stats.active}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm">Completed</span>
              </div>
              <span className="font-semibold">{stats.completed}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm">Failed</span>
              </div>
              <span className="font-semibold">{stats.failed}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentJobs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No jobs yet</p>
            ) : (
              <div className="space-y-3">
                {recentJobs.map((job) => (
                  <div key={job.job_id} className="flex items-center justify-between text-sm">
                    <div className="flex-1 truncate">
                      <p className="truncate font-medium">{job.url}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(job.created_at).toLocaleString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      job.status === "completed" ? "bg-green-100 text-green-700" :
                      job.status === "failed" ? "bg-red-100 text-red-700" :
                      "bg-blue-100 text-blue-700"
                    }`}>
                      {job.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button onClick={() => router.push("/jobs?action=create")} className="w-full" variant="default">
              Create New Job
            </Button>
            <Button onClick={() => router.push("/jobs?action=bulk")} className="w-full" variant="outline">
              Bulk Upload
            </Button>
            <Button onClick={() => router.push("/jobs")} className="w-full" variant="outline">
              View All Jobs
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


"use client";

import { useMemo, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Clock, CheckCircle2, XCircle, Loader2, FileText, Code, Trash2, Copy, ExternalLink, Sparkles } from "lucide-react";
import type { Job } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";

interface JobCardProps {
  job: Job;
  onViewRaw?: (jobId: string) => void;
  onViewCleaned?: (jobId: string) => void;
  onViewResearch?: (jobId: string) => void;
  onDelete?: (jobId: string) => void;
}

const statusConfig = {
  pending:   { label: "Pending",   icon: Clock,     color: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20", active: true },
  scraping:  { label: "Scraping",  icon: Loader2,   color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",     active: true },
  scraped:   { label: "Scraped",   icon: CheckCircle2, color: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20", active: false },
  cleaning:  { label: "Cleaning",  icon: Loader2,   color: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20", active: true },
  completed: { label: "Completed", icon: CheckCircle2, color: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20", active: false },
  failed:    { label: "Failed",    icon: XCircle,   color: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",         active: false },
} as const;

type StatusKey = keyof typeof statusConfig;
const STATUS_ORDER: StatusKey[] = ["pending", "scraping", "scraped", "cleaning", "completed", "failed"];

function asStatusKey(s: string): StatusKey {
  const keys = Object.keys(statusConfig) as StatusKey[];
  return keys.includes(s as StatusKey) ? (s as StatusKey) : "pending";
}

function useNowTicker(intervalMs = 30000) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return tick;
}

function getFavicon(url: string): string | null {
  try {
    const u = new URL(url);
    return `${u.origin}/favicon.ico`;
  } catch {
    return null;
  }
}

export function JobCard({ job, onViewRaw, onViewCleaned, onViewResearch, onDelete }: JobCardProps) {
  const status = asStatusKey((job as { status?: string }).status ?? "pending");
  const { icon: Icon, color, label, active } = statusConfig[status];
  const isActive = active && status !== "failed";
  const currentIndex = useMemo(() => {
    const idx = STATUS_ORDER.indexOf(status);
    return idx === -1 ? 0 : idx;
  }, [status]);
  const showProgress = status !== "failed" && status !== "pending";
  const favicon = getFavicon(job.url);
  
  // Calculate progress percentage
  const progressPercentage = useMemo(() => {
    if (status === "failed") return 0;
    if (status === "pending") return 0;
    const totalSteps = STATUS_ORDER.length - 1; // Exclude failed from count
    const completedSteps = currentIndex;
    return Math.round((completedSteps / totalSteps) * 100);
  }, [status, currentIndex]);

  useNowTicker(30000);

  const createdAgo = (() => {
    try {
      return formatDistanceToNow(new Date(job.created_at), { addSuffix: true });
    } catch {
      return "just now";
    }
  })();

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
  };

  return (
    <TooltipProvider>
      <Card
        className={[
          "group relative overflow-hidden transition-all",
          "hover:shadow-lg focus-within:shadow-lg",
          "border border-border/70",
          status === "failed" ? "ring-1 ring-red-500/20" : "hover:ring-1 hover:ring-primary/20",
          "bg-gradient-to-b from-background to-muted/30",
        ].join(" ")}
      >
        <div className="pointer-events-none absolute inset-x-0 -top-24 h-48 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-40" aria-hidden>
          <div className="h-full w-full bg-gradient-to-b from-primary/20 to-transparent" />
        </div>

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              {favicon && (
                <img
                  src={favicon}
                  alt="site icon"
                  className="mt-0.5 h-5 w-5 shrink-0 rounded-sm border border-border/60"
                  onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
                />
              )}
              <div className="min-w-0">
                <CardTitle className="text-base font-semibold leading-tight">
                  <span className="line-clamp-1 break-all">{job.url}</span>
                </CardTitle>
                <CardDescription className="mt-0.5 text-xs text-muted-foreground">
                  Created {createdAgo}
                </CardDescription>
              </div>
            </div>

            <Badge
              variant="outline"
              className={[
                "flex items-center gap-1.5 border px-2.5 py-1 text-xs font-medium",
                "rounded-full shadow-[inset_0_1px_0_hsla(0,0%,100%,.08)]",
                color,
                isActive ? "animate-pulse" : "",
              ].join(" ")}
            >
              <Icon className={["h-3.5 w-3.5", isActive && (Icon === Loader2 ? "animate-spin" : "")].join(" ")} />
              {label}
            </Badge>
          </div>

          {showProgress && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium text-foreground">{progressPercentage}%</span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all duration-500 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="flex items-center gap-1.5">
                {STATUS_ORDER.filter(s => s !== "failed").map((s, i) => (
                  <div key={s} className="flex items-center gap-1.5">
                    <div
                      className={[
                        "h-1.5 w-8 rounded-full transition-all",
                        i <= currentIndex ? "bg-primary/80" : "bg-muted-foreground/20",
                      ].join(" ")}
                      aria-label={`${i <= currentIndex ? "Completed" : "Pending"} step: ${s}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <div className="font-mono">ID: {job.job_id?.slice(0, 8)}...</div>
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleCopy(job.url)}
                      aria-label="Copy URL"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy URL</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label="Open URL"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>Open URL</TooltipContent>
                </Tooltip>
              </div>
            </div>

            {job.error_message && (
              <div className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-400">
                {job.error_message}
              </div>
            )}

            <Separator className="my-3" />

            <div className="flex flex-wrap gap-2">
              {job.s3_key && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewRaw?.(job.job_id)}
                  className="flex items-center gap-1.5 transition-all hover:-translate-y-0.5"
                >
                  <Code className="h-4 w-4" />
                  Raw Data
                </Button>
              )}
              {job.cleaned_s3_key && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewCleaned?.(job.job_id)}
                  className="flex items-center gap-1.5 transition-all hover:-translate-y-0.5"
                >
                  <FileText className="h-4 w-4" />
                  Cleaned Data
                </Button>
              )}
              {job.research_s3_key && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewResearch?.(job.job_id)}
                  className="flex items-center gap-1.5 transition-all hover:-translate-y-0.5 bg-purple-50 dark:bg-purple-950/20 hover:bg-purple-100 dark:hover:bg-purple-950/30"
                >
                  <Sparkles className="h-4 w-4" />
                  Research
                </Button>
              )}
              {job.research_status === "researching" && (
                <Badge variant="outline" className="flex items-center gap-1.5 bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Researching
                </Badge>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete?.(job.job_id)}
                    className="flex items-center gap-1.5 text-red-600 transition-all hover:-translate-y-0.5 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete job</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface Job {
  job_id: string;
  url: string;
  status: 'pending' | 'scraping' | 'scraped' | 'cleaning' | 'completed' | 'failed' | 'researching' | 'research_completed';
  created_at: string;
  updated_at: string;
  s3_key: string | null;
  cleaned_s3_key: string | null;
  error_message: string | null;
  research_s3_key: string | null;
  research_status: string | null;
  research_summary: string | null;
  research_topics: string | null;
  research_insights: string | null;
  enable_scraping: boolean;
  enable_cleaning: boolean;
  enable_research: boolean;
}

export interface JobStatusHistory {
  id: number;
  job_id: string;
  status: string;
  message: string | null;
  timestamp: string;
}

export interface RawData {
  content: string;
  s3_key: string;
  content_type: string;
}

export interface CleanedData {
  content: string;
  s3_key: string;
  content_type: string;
}

export async function createJob(
  url: string,
  enableScraping: boolean = true,
  enableCleaning: boolean = true,
  enableResearch: boolean = true
): Promise<Job> {
  const response = await fetch(`${API_BASE_URL}/scrape`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      url,
      enable_scraping: enableScraping,
      enable_cleaning: enableCleaning,
      enable_research: enableResearch
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create job: ${response.statusText}`);
  }
  
  return response.json();
}

export async function getJob(jobId: string): Promise<Job> {
  const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`);
  
  if (!response.ok) {
    throw new Error(`Failed to get job: ${response.statusText}`);
  }
  
  return response.json();
}

export async function getAllJobs(skip = 0, limit = 100): Promise<Job[]> {
  const response = await fetch(`${API_BASE_URL}/jobs?skip=${skip}&limit=${limit}`);
  
  if (!response.ok) {
    throw new Error(`Failed to get jobs: ${response.statusText}`);
  }
  
  return response.json();
}

export async function getJobStatusHistory(jobId: string): Promise<JobStatusHistory[]> {
  const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/history`);
  
  if (!response.ok) {
    throw new Error(`Failed to get job history: ${response.statusText}`);
  }
  
  return response.json();
}

export async function getRawData(jobId: string): Promise<RawData> {
  const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/raw-data`);
  
  if (!response.ok) {
    throw new Error(`Failed to get raw data: ${response.statusText}`);
  }
  
  return response.json();
}

export async function getCleanedData(jobId: string): Promise<CleanedData> {
  const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/cleaned-data`);
  
  if (!response.ok) {
    throw new Error(`Failed to get cleaned data: ${response.statusText}`);
  }
  
  return response.json();
}

export async function deleteJob(jobId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to delete job: ${response.statusText}`);
  }
}

export async function deleteAllJobs(): Promise<{ message: string; jobs_deleted: number; s3_objects_deleted: number }> {
  const response = await fetch(`${API_BASE_URL}/jobs`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to delete all jobs: ${response.statusText}`);
  }
  
  return response.json();
}

export interface BulkJobError {
  url: string;
  error: string;
  category: string;
}

export interface BulkJobResponse {
  total: number;
  created: number;
  failed: number;
  jobs: Job[];
  errors: BulkJobError[];
}

export async function createBulkJobsFromCSV(file: File): Promise<BulkJobResponse> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE_URL}/scrape/bulk/csv`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `Failed to upload CSV: ${response.statusText}`);
  }
  
  return response.json();
}

export interface ResearchData {
  summary: string;
  topics: string[];
  insights: Array<{ type: string; text: string }>;
  category: string;
  entities: {
    people: string[];
    organizations: string[];
    locations: string[];
  };
  metadata: {
    model: string;
    timestamp: string;
    processing_time_ms: number;
  };
}

export async function getResearchData(jobId: string): Promise<ResearchData> {
  const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/research-data`);
  
  if (!response.ok) {
    throw new Error(`Failed to get research data: ${response.statusText}`);
  }
  
  return response.json();
}

export async function triggerResearch(jobId: string): Promise<{ message: string; job_id: string }> {
  const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/research`, {
    method: 'POST',
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `Failed to trigger research: ${response.statusText}`);
  }
  
  return response.json();
}

export async function reconcileJobStatus(jobId: string): Promise<{ message: string; old_status?: string; new_status?: string; status?: string }> {
  const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/reconcile-status`, {
    method: 'POST',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to reconcile job status: ${response.statusText}`);
  }
  
  return response.json();
}


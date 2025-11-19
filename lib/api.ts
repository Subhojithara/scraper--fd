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
    if (response.status === 429) {
      throw new Error("Too Many Requests - Please wait a moment before refreshing");
    }
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

export async function retryJob(jobId: string): Promise<Job> {
  const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/retry`, {
    method: 'POST',
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `Failed to retry job: ${response.statusText}`);
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

// ==================== AI Job API Functions ====================

export interface JobAI {
  job_id: string;
  url: string;
  status: 'pending' | 'processing' | 'cleaning' | 'completed' | 'failed' | 'cancelled' | 'researching' | 'research_completed' | 'research_failed';
  created_at: string;
  updated_at: string;
  strategy: 'single_page' | 'multi_page' | 'sitemap';
  llm_provider: 'openai' | 'gemini' | 'none';
  output_format: 'json' | 'markdown' | 'both';
  json_s3_key: string | null;
  markdown_s3_key: string | null;
  metadata_s3_key: string | null;
  cleaned_s3_key: string | null;
  extracted_data: any | null;
  extraction_prompt: string | null;
  research_prompt?: string | null;
  research_s3_key?: string | null;
  research_status?: string | null;
  research_summary?: string | null;
  research_topics?: string | null;
  research_insights?: string | null;
  enable_research?: boolean;
  processing_time_ms: number | null;
  pages_crawled: number;
  tokens_used: number | null;
  cost_usd: number | null;
  error_message: string | null;
  retry_count: number;
}

export interface UnifiedJobsResponse {
  regular_jobs: Job[];
  ai_jobs: JobAI[];
  total_regular: number;
  total_ai: number;
}

export async function createAIJob(
  url: string,
  strategy: 'single_page' | 'multi_page' | 'sitemap' = 'single_page',
  llmProvider: 'openai' | 'gemini' | 'none' = 'openai',
  outputFormat: 'json' | 'markdown' | 'both' = 'both',
  extractionPrompt?: string,
  researchPrompt?: string,
  enableResearch: boolean = true,
  apiKey?: string,
  model?: string,
  maxPages?: number,
  enableEmailGeneration?: boolean,
  emailPrompt?: string,
  emailLlmProvider?: 'openai' | 'gemini',
  emailModel?: string
): Promise<JobAI> {
  const body: any = {
    url,
    strategy,
    llm_provider: llmProvider,
    output_format: outputFormat,
    enable_research: enableResearch,
  };
  
  if (extractionPrompt) {
    body.extraction_prompt = extractionPrompt;
  }
  
  if (researchPrompt) {
    body.research_prompt = researchPrompt;
  }
  
  if (apiKey) {
    body.api_key = apiKey;
  }
  
  if (model) {
    body.model = model;
  }
  
  if (maxPages !== undefined && (strategy === 'multi_page' || strategy === 'sitemap')) {
    body.max_pages = maxPages;
  }
  
  if (enableEmailGeneration !== undefined) {
    body.enable_email_generation = enableEmailGeneration;
  }
  
  if (emailPrompt) {
    body.email_prompt = emailPrompt;
  }
  
  if (emailLlmProvider) {
    body.email_llm_provider = emailLlmProvider;
  }
  
  if (emailModel) {
    body.email_model = emailModel;
  }
  
  const response = await fetch(`${API_BASE_URL}/scrape-ai`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `Failed to create AI job: ${response.statusText}`);
  }
  
  return response.json();
}

export async function getAIJob(jobId: string): Promise<JobAI> {
  const response = await fetch(`${API_BASE_URL}/jobs-ai/${jobId}`);
  
  if (!response.ok) {
    throw new Error(`Failed to get AI job: ${response.statusText}`);
  }
  
  return response.json();
}

export async function getAllAIJobs(
  skip = 0,
  limit = 100,
  status?: string,
  urlContains?: string
): Promise<JobAI[]> {
  const params = new URLSearchParams({
    skip: skip.toString(),
    limit: limit.toString(),
  });
  if (status) params.append('status', status);
  if (urlContains) params.append('url_contains', urlContains);
  
  const response = await fetch(`${API_BASE_URL}/jobs-ai?${params}`);
  
  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Too Many Requests - Please wait a moment before refreshing");
    }
    throw new Error(`Failed to get AI jobs: ${response.statusText}`);
  }
  
  return response.json();
}

export async function getAIJobJSON(jobId: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/jobs-ai/${jobId}/json`);
  
  if (!response.ok) {
    throw new Error(`Failed to get AI job JSON: ${response.statusText}`);
  }
  
  return response.json();
}

export async function getAIJobMarkdown(jobId: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/jobs-ai/${jobId}/markdown`);
  
  if (!response.ok) {
    throw new Error(`Failed to get AI job Markdown: ${response.statusText}`);
  }
  
  return response.text();
}

export async function getAIJobMetadata(jobId: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/jobs-ai/${jobId}/metadata`);
  
  if (!response.ok) {
    throw new Error(`Failed to get AI job metadata: ${response.statusText}`);
  }
  
  return response.json();
}

export async function getAIJobCleanedData(jobId: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/jobs-ai/${jobId}/cleaned`);
  
  if (!response.ok) {
    throw new Error(`Failed to get AI job cleaned data: ${response.statusText}`);
  }
  
  return response.text();
}

export interface JobAnalytics {
  total_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  cancelled_jobs: number;
  active_jobs: number;
  success_rate: number;
  avg_processing_time_ms: number | null;
  total_cost_usd: number;
  total_tokens_used: number;
  jobs_by_strategy: Record<string, number>;
  jobs_by_llm_provider: Record<string, number>;
  jobs_by_status: Record<string, number>;
  jobs_by_day: Array<{ date: string; count: number }>;
  avg_pages_crawled: number | null;
  top_domains: Array<{ domain: string; count: number }>;
}

export async function getAIJobAnalytics(): Promise<JobAnalytics> {
  try {
    const response = await fetch(`${API_BASE_URL}/jobs-ai/analytics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      // Handle rate limiting specifically
      if (response.status === 429) {
        throw new Error("Too Many Requests - Please wait a moment");
      }
      throw new Error(`Failed to get AI job analytics: ${response.statusText}`);
    }
    
    return response.json();
  } catch (error: any) {
    // Handle network errors
    if (error.message === "Failed to fetch" || error.name === "TypeError") {
      throw new Error("Network error - Unable to connect to the server");
    }
    throw error;
  }
}

export async function cancelAIJob(jobId: string): Promise<JobAI> {
  const response = await fetch(`${API_BASE_URL}/jobs-ai/${jobId}/cancel`, {
    method: 'POST',
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `Failed to cancel AI job: ${response.statusText}`);
  }
  
  return response.json();
}

export async function retryAIJob(jobId: string): Promise<JobAI> {
  const response = await fetch(`${API_BASE_URL}/jobs-ai/${jobId}/retry`, {
    method: 'POST',
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `Failed to retry AI job: ${response.statusText}`);
  }
  
  return response.json();
}

export interface BulkJobAIResponse {
  total: number;
  created: number;
  failed: number;
  jobs: JobAI[];
  errors: Array<{ url: string; error: string }>;
}

export async function createBulkAIJobsFromCSV(
  file: File,
  strategy: 'single_page' | 'multi_page' | 'sitemap' = 'single_page',
  llmProvider: 'openai' | 'gemini' | 'none' = 'openai',
  outputFormat: 'json' | 'markdown' | 'both' = 'both',
  extractionPrompt?: string,
  apiKey?: string,
  model?: string,
  maxPages?: number,
  enableEmailGeneration?: boolean,
  emailPrompt?: string,
  emailLlmProvider?: 'openai' | 'gemini',
  emailModel?: string
): Promise<BulkJobAIResponse> {
  const formData = new FormData();
  formData.append('file', file);
  
  const params = new URLSearchParams({
    strategy,
    llm_provider: llmProvider,
    output_format: outputFormat,
  });
  if (extractionPrompt) params.append('extraction_prompt', extractionPrompt);
  if (apiKey) params.append('api_key', apiKey);
  if (model) params.append('model', model);
  if (maxPages !== undefined) params.append('max_pages', maxPages.toString());
  if (enableEmailGeneration !== undefined) params.append('enable_email_generation', enableEmailGeneration.toString());
  if (emailPrompt) params.append('email_prompt', emailPrompt);
  if (emailLlmProvider) params.append('email_llm_provider', emailLlmProvider);
  if (emailModel) params.append('email_model', emailModel);
  
  const response = await fetch(`${API_BASE_URL}/scrape-ai/bulk/csv?${params}`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `Failed to upload CSV: ${response.statusText}`);
  }
  
  return response.json();
}

export async function createBulkAIJobsFromJSON(
  urls: string[],
  strategy: 'single_page' | 'multi_page' | 'sitemap' = 'single_page',
  llmProvider: 'openai' | 'gemini' | 'none' = 'none',
  outputFormat: 'json' | 'markdown' | 'both' = 'both',
  extractionPrompt?: string,
  apiKey?: string,
  model?: string,
  maxPages?: number,
  enableEmailGeneration?: boolean,
  emailPrompt?: string,
  emailLlmProvider?: 'openai' | 'gemini',
  emailModel?: string
): Promise<BulkJobAIResponse> {
  const payload: any = {
    urls,
    strategy,
    llm_provider: llmProvider,
    output_format: outputFormat,
  };
  
  if (extractionPrompt) payload.extraction_prompt = extractionPrompt;
  if (apiKey) payload.api_key = apiKey;
  if (model) payload.model = model;
  if (maxPages !== undefined) payload.max_pages = maxPages;
  if (enableEmailGeneration !== undefined) payload.enable_email_generation = enableEmailGeneration;
  if (emailPrompt) payload.email_prompt = emailPrompt;
  if (emailLlmProvider) payload.email_llm_provider = emailLlmProvider;
  if (emailModel) payload.email_model = emailModel;
  
  const response = await fetch(`${API_BASE_URL}/scrape-ai/bulk/json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `Failed to create bulk AI jobs: ${response.statusText}`);
  }
  
  return response.json();
}

export async function createBulkJobsFromJSON(
  urls: string[],
  enableScraping: boolean = true,
  enableCleaning: boolean = true,
  enableResearch: boolean = false
): Promise<BulkJobResponse> {
  const payload = {
    urls,
    enable_scraping: enableScraping,
    enable_cleaning: enableCleaning,
    enable_research: enableResearch,
  };
  
  const response = await fetch(`${API_BASE_URL}/scrape/bulk/json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `Failed to create bulk jobs: ${response.statusText}`);
  }
  
  return response.json();
}

// Helper functions for API key management
export function getStoredApiKey(provider: 'openai' | 'gemini'): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(`${provider}ApiKey`);
}

export function setStoredApiKey(provider: 'openai' | 'gemini', key: string): void {
  if (typeof window === 'undefined') return;
  if (key.trim()) {
    localStorage.setItem(`${provider}ApiKey`, key);
  } else {
    localStorage.removeItem(`${provider}ApiKey`);
  }
}

export async function deleteAIJob(jobId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/jobs-ai/${jobId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `Failed to delete AI job: ${response.statusText}`);
  }
}

export async function deleteAllAIJobs(): Promise<{ message: string; jobs_deleted: number; s3_objects_deleted: number }> {
  const response = await fetch(`${API_BASE_URL}/jobs-ai`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `Failed to delete all AI jobs: ${response.statusText}`);
  }
  
  return response.json();
}

export async function getUnifiedJobs(skip = 0, limit = 100): Promise<UnifiedJobsResponse> {
  const response = await fetch(`${API_BASE_URL}/jobs/unified?skip=${skip}&limit=${limit}`);
  
  if (!response.ok) {
    throw new Error(`Failed to get unified jobs: ${response.statusText}`);
  }
  
  return response.json();
}

export interface UnifiedStats {
  regular: {
    total: number;
    pending: number;
    active: number;
    completed: number;
    failed: number;
    by_status: Record<string, number>;
  };
  ai: {
    total: number;
    pending: number;
    active: number;
    completed: number;
    failed: number;
    cancelled: number;
    total_cost: number;
    total_tokens: number;
    by_status: Record<string, number>;
  };
  combined: {
    total: number;
    active: number;
    completed: number;
    failed: number;
  };
  jobs_per_day: Array<{
    date: string;
    regular: number;
    ai: number;
    total: number;
  }>;
  last_updated: string;
}

export async function getUnifiedStats(): Promise<UnifiedStats> {
  const response = await fetch(`${API_BASE_URL}/jobs/unified/stats`);
  
  if (!response.ok) {
    throw new Error(`Failed to get unified stats: ${response.statusText}`);
  }
  
  return response.json();
}

// Email Generation API
export interface EmailJob {
  email_id: string;
  job_ai_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  email_content: string | null;
  email_prompt: string;
  llm_provider: string;
  model: string | null;
  tokens_used: number | null;
  cost_usd: number | null;
  processing_time_ms: number | null;
  error_message: string | null;
  email_count: number;
  retry_count: number;
  last_retry_at: string | null;
  retry_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmailJobCreate {
  email_prompt: string;
  llm_provider: 'openai' | 'gemini';
  model?: string;
  email_count?: number;
  api_key?: string;  // Optional user-provided API key
}

export interface CostSummary {
  daily_cost: number;
  daily_limit: number;
  daily_percentage: number;
  monthly_cost: number;
  monthly_limit: number;
  monthly_percentage: number;
  per_job_limit: number;
  alerts: Array<{
    alert_type: string;
    threshold_usd: number;
    current_cost_usd: number;
    message: string | null;
    created_at: string | null;
  }>;
}

export async function generateEmail(
  jobId: string,
  emailRequest: EmailJobCreate
): Promise<EmailJob> {
  const response = await fetch(`${API_BASE_URL}/jobs-ai/${jobId}/generate-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(emailRequest),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `Failed to generate email: ${response.statusText}`);
  }
  
  return response.json();
}

export async function getEmailsForJob(jobId: string): Promise<EmailJob[]> {
  const response = await fetch(`${API_BASE_URL}/jobs-ai/${jobId}/emails`);
  
  if (!response.ok) {
    throw new Error(`Failed to get emails: ${response.statusText}`);
  }
  
  return response.json();
}

export async function getEmail(emailId: string): Promise<EmailJob> {
  const response = await fetch(`${API_BASE_URL}/emails/${emailId}`);
  
  if (!response.ok) {
    throw new Error(`Failed to get email: ${response.statusText}`);
  }
  
  return response.json();
}

export async function deleteEmail(emailId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/emails/${emailId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to delete email: ${response.statusText}`);
  }
}

export async function getEmailCostSummary(): Promise<CostSummary> {
  const response = await fetch(`${API_BASE_URL}/emails/cost-summary`);
  
  if (!response.ok) {
    throw new Error(`Failed to get cost summary: ${response.statusText}`);
  }
  
  return response.json();
}

export async function bulkGenerateEmails(
  jobAiIds: string[],
  emailRequest: EmailJobCreate
): Promise<{
  total: number;
  created: number;
  failed: number;
  email_jobs: EmailJob[];
  errors: Array<{ job_ai_id: string; error: string }>;
}> {
  const response = await fetch(`${API_BASE_URL}/emails/bulk-generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      job_ai_ids: jobAiIds,
      ...emailRequest,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `Failed to bulk generate emails: ${response.statusText}`);
  }
  
  return response.json();
}

// Email Retry API
export interface EmailStats {
  total_emails: number;
  completed: number;
  failed: number;
  pending: number;
  processing: number;
  total_cost: number;
}

export interface FailedEmailStats {
  total_failed: number;
  failed_by_error_type: Record<string, number>;
  failed_by_job: Record<string, number>;
  failed_last_24h: number;
  failed_last_7d: number;
  failed_last_30d: number;
}

export interface EmailRetryRequest {
  api_key?: string;
  llm_provider?: 'openai' | 'gemini';
  model?: string;
}

export interface BulkRetryRequest {
  error_type?: string;
  job_ai_id?: string;
  max_retries?: number;
  api_key?: string;
}

export interface RetryByErrorRequest {
  error_pattern: string;
  case_sensitive?: boolean;
  max_retries?: number;
  api_key?: string;
}

export interface BulkRetryResponse {
  retried_count: number;
  failed_count: number;
  email_ids: string[];
  errors: Array<{ email_id: string; error: string }>;
}

export async function getEmailStats(): Promise<EmailStats> {
  const response = await fetch(`${API_BASE_URL}/emails/stats`);
  
  if (!response.ok) {
    throw new Error(`Failed to get email stats: ${response.statusText}`);
  }
  
  return response.json();
}

export async function getFailedEmailStats(): Promise<FailedEmailStats> {
  const response = await fetch(`${API_BASE_URL}/emails/failed/stats`);
  
  if (!response.ok) {
    throw new Error(`Failed to get failed email stats: ${response.statusText}`);
  }
  
  return response.json();
}

export async function getFailedEmails(
  skip: number = 0,
  limit: number = 100,
  errorType?: string,
  jobAiId?: string
): Promise<EmailJob[]> {
  const params = new URLSearchParams();
  params.append('skip', skip.toString());
  params.append('limit', limit.toString());
  if (errorType) params.append('error_type', errorType);
  if (jobAiId) params.append('job_ai_id', jobAiId);
  
  const response = await fetch(`${API_BASE_URL}/emails/failed?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error(`Failed to get failed emails: ${response.statusText}`);
  }
  
  return response.json();
}

export async function retryEmail(
  emailId: string,
  retryRequest: EmailRetryRequest = {}
): Promise<EmailJob> {
  const response = await fetch(`${API_BASE_URL}/emails/${emailId}/retry`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(retryRequest),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `Failed to retry email: ${response.statusText}`);
  }
  
  return response.json();
}

export async function bulkRetryEmails(
  bulkRetryRequest: BulkRetryRequest = {}
): Promise<BulkRetryResponse> {
  const response = await fetch(`${API_BASE_URL}/emails/retry/bulk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bulkRetryRequest),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `Failed to bulk retry emails: ${response.statusText}`);
  }
  
  return response.json();
}

export async function retryEmailsByError(
  retryByErrorRequest: RetryByErrorRequest
): Promise<BulkRetryResponse> {
  const response = await fetch(`${API_BASE_URL}/emails/retry/by-error`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(retryByErrorRequest),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `Failed to retry emails by error: ${response.statusText}`);
  }
  
  return response.json();
}

// Follow-up Email API
export interface FollowUp {
  follow_up_id: string;
  parent_email_id: string;
  sequence_number: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'scheduled';
  email_content: string | null;
  email_prompt: string | null;
  llm_provider: string;
  model: string | null;
  tokens_used: number | null;
  cost_usd: number | null;
  processing_time_ms: number | null;
  error_message: string | null;
  scheduled_at: string | null;
  sent_at: string | null;
  retry_count: number;
  last_retry_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FollowUpPromptRequest {
  sequence_number: number;
  custom_prompt?: string;
  word_limit?: number;
  word_limit_type?: string;
  enforce_word_limit?: boolean;
}

export interface FollowUpGenerateRequest {
  llm_provider?: 'openai' | 'gemini';
  model?: string;
  api_key?: string;
  custom_prompts?: FollowUpPromptRequest[];
  schedule_all?: boolean;
  scheduled_dates?: string[];
}

export interface BulkFollowUpResponse {
  generated_count: number;
  follow_up_ids: string[];
  errors: Array<{ sequence_number?: number; follow_up_id?: string; error: string }>;
}

export interface FollowUpRetryRequest {
  api_key?: string;
  llm_provider?: 'openai' | 'gemini';
  model?: string;
  custom_prompt?: string;
}

export interface BulkFollowUpRetryRequest {
  parent_email_id?: string;
  status?: string;
  sequence_numbers?: number[];
  max_retries?: number;
  api_key?: string;
}

export interface ScheduleFollowUpRequest {
  scheduled_at: string;
}

export interface FollowUpStats {
  total_follow_ups: number;
  completed: number;
  failed: number;
  pending: number;
  processing: number;
  scheduled: number;
  by_sequence: Record<number, number>;
  total_cost: number;
  avg_cost_per_follow_up: number;
  success_rate: number;
}

export async function generateFollowUps(
  emailId: string,
  request: FollowUpGenerateRequest = {}
): Promise<BulkFollowUpResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/emails/${emailId}/generate-follow-ups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      let errorDetail = response.statusText;
      try {
        const errorData = await response.json();
        errorDetail = errorData.detail || errorData.message || errorDetail;
      } catch (e) {
        // If JSON parsing fails, use status text
        const text = await response.text().catch(() => '');
        errorDetail = text || errorDetail;
      }
      throw new Error(errorDetail || `Failed to generate follow-ups: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error: any) {
    // Handle network errors
    if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('Failed to fetch'))) {
      const apiUrl = API_BASE_URL || 'http://localhost:8000';
      throw new Error(`Network error: Failed to connect to ${apiUrl}. Please check if the backend is running and accessible.`);
    }
    // Re-throw other errors
    throw error;
  }
}

export async function getFollowUpsForEmail(emailId: string): Promise<FollowUp[]> {
  const response = await fetch(`${API_BASE_URL}/emails/${emailId}/follow-ups`);
  
  if (!response.ok) {
    throw new Error(`Failed to get follow-ups: ${response.statusText}`);
  }
  
  return response.json();
}

export async function getFollowUp(followUpId: string): Promise<FollowUp> {
  const response = await fetch(`${API_BASE_URL}/follow-ups/${followUpId}`);
  
  if (!response.ok) {
    throw new Error(`Failed to get follow-up: ${response.statusText}`);
  }
  
  return response.json();
}

export async function retryFollowUp(
  followUpId: string,
  retryRequest: FollowUpRetryRequest = {}
): Promise<FollowUp> {
  const response = await fetch(`${API_BASE_URL}/follow-ups/${followUpId}/retry`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(retryRequest),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `Failed to retry follow-up: ${response.statusText}`);
  }
  
  return response.json();
}

export async function bulkRetryFollowUps(
  bulkRetryRequest: BulkFollowUpRetryRequest = {}
): Promise<BulkFollowUpResponse> {
  const response = await fetch(`${API_BASE_URL}/follow-ups/retry/bulk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bulkRetryRequest),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `Failed to bulk retry follow-ups: ${response.statusText}`);
  }
  
  return response.json();
}

export async function scheduleFollowUp(
  followUpId: string,
  scheduledAt: string
): Promise<FollowUp> {
  const response = await fetch(`${API_BASE_URL}/follow-ups/${followUpId}/schedule`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ scheduled_at: scheduledAt }),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `Failed to schedule follow-up: ${response.statusText}`);
  }
  
  return response.json();
}

export async function getFollowUpStats(): Promise<FollowUpStats> {
  const response = await fetch(`${API_BASE_URL}/follow-ups/stats`);
  
  if (!response.ok) {
    throw new Error(`Failed to get follow-up stats: ${response.statusText}`);
  }
  
  return response.json();
}


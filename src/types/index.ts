// Article input from user
export interface ArticleInput {
  id: string;
  url: string;
  isPaywalled: boolean;
  manualExcerpt?: string;
  manualHeadline?: string;
  manualSourceName?: string;
}

// Extracted content from fetching
export interface ExtractedContent {
  headline: string;
  content: string;
  author?: string;
  publishDate?: string;
  sourceName: string;
  sourceUrl: string;
}

// Fetched article with status
export interface FetchedArticle {
  id: string;
  url: string;
  status: 'success' | 'paywall' | 'error' | 'manual';
  content?: ExtractedContent;
  error?: FetchError;
}

// Fetch error types
export interface FetchError {
  type: 'PAYWALL_DETECTED' | 'TIMEOUT' | 'NOT_FOUND' | 'NETWORK_ERROR' | 'BLOCKED' | 'INVALID_URL' | 'NO_CONTENT';
  message: string;
  requiresManualInput: boolean;
}

// Summarized article
export interface SummarizedArticle {
  id: string;
  url: string;
  kicker: string;
  summary: string;
  emoji: string;
  sourceName: string;
  status: 'success' | 'manual' | 'failed';
}

// Generated brief output
export interface GeneratedBrief {
  html: string;
  plaintext: string;
  newsletterHtml: string;
  newsletterPlaintext: string;
  articles: SummarizedArticle[];
}

// API Request/Response types
export interface FetchArticleRequest {
  url: string;
}

export interface FetchArticleResponse {
  success: boolean;
  data?: ExtractedContent;
  error?: FetchError;
}

export interface SummarizeRequest {
  articles: Array<{
    id: string;
    headline: string;
    content: string;
    sourceName: string;
    url: string;
  }>;
}

export interface SummarizeResponse {
  success: boolean;
  summaries?: Array<{
    id: string;
    summary: string;
    suggestedEmoji: string;
  }>;
  error?: {
    message: string;
    failedArticleIds?: string[];
  };
}

export interface GenerateBriefRequest {
  articles: ArticleInput[];
}

export interface GenerateBriefResponse {
  success: boolean;
  brief?: GeneratedBrief;
  errors?: Array<{
    id: string;
    url: string;
    error: string;
  }>;
}

// App state
export type AppStatus = 'idle' | 'fetching' | 'summarizing' | 'complete' | 'error';

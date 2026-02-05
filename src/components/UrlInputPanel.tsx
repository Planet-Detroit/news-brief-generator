'use client';

import { useState, useEffect } from 'react';
import { parseUrlList, isPaywalledSource, generateId } from '@/lib/utils/url-parser';
import type { ArticleInput } from '@/types';

interface UrlInputPanelProps {
  onSubmit: (articles: ArticleInput[]) => void;
  isProcessing: boolean;
  initialUrls?: string[];
}

export default function UrlInputPanel({
  onSubmit,
  isProcessing,
  initialUrls,
}: UrlInputPanelProps) {
  const [urlInput, setUrlInput] = useState('');
  const [articles, setArticles] = useState<ArticleInput[]>([]);

  // Pre-populate with URLs from curation panel
  useEffect(() => {
    if (initialUrls && initialUrls.length > 0) {
      setUrlInput(initialUrls.join('\n'));
      const newArticles: ArticleInput[] = initialUrls.map((url) => ({
        id: generateId(),
        url,
        isPaywalled: isPaywalledSource(url),
      }));
      setArticles(newArticles);
    }
  }, [initialUrls]);

  const handleParseUrls = () => {
    const urls = parseUrlList(urlInput);
    const newArticles: ArticleInput[] = urls.map((url) => ({
      id: generateId(),
      url,
      isPaywalled: isPaywalledSource(url),
    }));
    setArticles(newArticles);
  };

  const handleRemoveArticle = (id: string) => {
    setArticles((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSubmit = () => {
    if (articles.length > 0) {
      onSubmit(articles);
    }
  };

  const handleClear = () => {
    setUrlInput('');
    setArticles([]);
  };

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-lg font-semibold mb-4 text-gray-900">Input URLs</h2>

      {/* URL Textarea */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-900 mb-1">
          Paste URLs (one per line)
        </label>
        <textarea
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder={`1. Story about DTE
https://example.com/article1

2. Water main breaks
https://example.com/article2`}
          className="w-full h-40 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          disabled={isProcessing}
        />
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleParseUrls}
            disabled={!urlInput.trim() || isProcessing}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Parse URLs
          </button>
          <button
            onClick={handleClear}
            disabled={isProcessing}
            className="px-4 py-2 bg-gray-200 text-gray-900 text-sm rounded-lg hover:bg-gray-300 disabled:opacity-50"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Parsed Articles */}
      {articles.length > 0 && (
        <div className="flex-1 overflow-y-auto">
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            {articles.length} Article(s) Found
          </h3>
          <div className="space-y-3">
            {articles.map((article, index) => (
              <div
                key={article.id}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium text-gray-600">
                      #{index + 1}
                    </span>
                    <p className="text-sm text-gray-900 truncate mt-1">
                      {article.url}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveArticle(article.id)}
                    className="text-gray-500 hover:text-red-600 text-lg leading-none"
                    title="Remove"
                  >
                    ×
                  </button>
                </div>

                {/* Paywall indicator */}
                {article.isPaywalled && (
                  <span className="inline-block mt-2 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                    🔒 Requires login
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Generate Button */}
          <button
            onClick={handleSubmit}
            disabled={isProcessing}
            className="w-full mt-4 px-4 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Generating...
              </span>
            ) : (
              'Generate Brief'
            )}
          </button>
        </div>
      )}
    </div>
  );
}

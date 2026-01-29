'use client';

import { useState, useCallback } from 'react';
import UrlInputPanel from '@/components/UrlInputPanel';
import BriefOutputPanel from '@/components/BriefOutputPanel';
import SessionManager from '@/components/SessionManager';
import type { ArticleInput, GeneratedBrief, SummarizedArticle, GenerateBriefResponse } from '@/types';

type ActivePanel = 'generator' | 'settings';

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [brief, setBrief] = useState<GeneratedBrief | null>(null);
  const [errors, setErrors] = useState<Array<{ id: string; url: string; error: string }>>([]);
  const [activePanel, setActivePanel] = useState<ActivePanel>('generator');

  const handleGenerate = useCallback(async (articles: ArticleInput[]) => {
    setIsProcessing(true);
    setErrors([]);
    setBrief(null);

    try {
      const response = await fetch('/api/generate-brief', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          articles,
        }),
      });

      const data: GenerateBriefResponse = await response.json();

      if (data.success && data.brief) {
        setBrief(data.brief);
      }

      if (data.errors) {
        setErrors(data.errors);
      }
    } catch (error) {
      console.error('Generation error:', error);
      setErrors([
        {
          id: 'network',
          url: '',
          error: 'Network error. Please check your connection and try again.',
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleUpdateArticle = useCallback((id: string, updates: Partial<SummarizedArticle>) => {
    if (!brief) return;

    const updatedArticles = brief.articles.map((article) =>
      article.id === id ? { ...article, ...updates } : article
    );

    // Regenerate HTML - format: emoji + bolded kicker + summary + 📌 Source linked
    const html = updatedArticles
      .map(
        (article) =>
          `${article.emoji} <strong>${escapeHtml(article.kicker)}</strong> ${escapeHtml(article.summary)} 📌 Source: <a href="${escapeHtml(article.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(article.sourceName)}</a>`
      )
      .join('\n\n');

    const plaintext = updatedArticles
      .map(
        (article) =>
          `${article.emoji} ${article.kicker} ${article.summary} 📌 Source: ${article.sourceName} (${article.url})`
      )
      .join('\n\n');

    // Regenerate newsletter format - one-line version with complete sentences
    const newsletterHtml = updatedArticles
      .map((article) => {
        return `${article.emoji} <strong>${escapeHtml(article.kicker)}</strong> ${escapeHtml(article.summary)} 📌 <a href="${escapeHtml(article.url)}">${escapeHtml(article.sourceName)}</a>`;
      })
      .join('<br>\n');

    const newsletterPlaintext = updatedArticles
      .map((article) => {
        return `${article.emoji} ${article.kicker} ${article.summary} 📌 ${article.sourceName}`;
      })
      .join('\n');

    setBrief({
      html,
      plaintext,
      newsletterHtml,
      newsletterPlaintext,
      articles: updatedArticles,
    });
  }, [brief]);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              News Brief Generator
            </h1>
            <p className="text-sm text-gray-600">
              Generate formatted news briefs for Planet Detroit
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Tab Navigation */}
            <nav className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActivePanel('generator')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activePanel === 'generator'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Generator
              </button>
              <button
                onClick={() => setActivePanel('settings')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                  activePanel === 'settings'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Site Logins
              </button>
            </nav>
            <a
              href="https://planetdetroit.org"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-4 text-sm text-blue-600 hover:underline"
            >
              Planet Detroit →
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        {activePanel === 'generator' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-180px)]">
            {/* Left Panel - Input */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 overflow-hidden flex flex-col">
              <UrlInputPanel
                onSubmit={handleGenerate}
                isProcessing={isProcessing}
              />
            </div>

            {/* Right Panel - Output */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 overflow-hidden flex flex-col">
              <BriefOutputPanel
                brief={brief}
                errors={errors}
                isProcessing={isProcessing}
                onUpdateArticle={handleUpdateArticle}
              />
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Site Logins</h2>
              <p className="text-sm text-gray-600 mb-6">
                Log in to paywalled news sites to automatically fetch article content.
                Your session will be saved for future use.
              </p>
              <SessionManager />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-2">
        <p className="text-center text-xs text-gray-600">
          Built for Planet Detroit • Summaries are AI-generated and should be reviewed before publishing
        </p>
      </footer>
    </div>
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

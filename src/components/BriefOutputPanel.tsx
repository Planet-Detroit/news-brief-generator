'use client';

import { useState, useEffect } from 'react';
import type { GeneratedBrief, SummarizedArticle } from '@/types';
import IStockSearch from './IStockSearch';

interface BriefOutputPanelProps {
  brief: GeneratedBrief | null;
  errors: Array<{ id: string; url: string; error: string }>;
  isProcessing: boolean;
  onUpdateArticle: (id: string, updates: Partial<SummarizedArticle>) => void;
}

const EMOJI_OPTIONS = ['📰', '🌧️', '🌡️', '❄️', '🧑‍⚕️', '💉', '💼', '📊', '🚆', '🛣️', '💡', '⚡', '🚧', '🌊', '💧', '🏭', '🌳', '🌲', '🏠', '⚖️', '🗳️'];

type OutputTab = 'wordpress' | 'newsletter';

export default function BriefOutputPanel({
  brief,
  errors,
  isProcessing,
  onUpdateArticle,
}: BriefOutputPanelProps) {
  const [activeTab, setActiveTab] = useState<OutputTab>('wordpress');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);

  // WordPress publishing state
  const [isPublishing, setIsPublishing] = useState(false);
  const [postUrl, setPostUrl] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [suggestedTitle, setSuggestedTitle] = useState<string | null>(null);

  // Copy state
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

  // Auto-publish to WordPress when brief is generated
  useEffect(() => {
    if (brief && brief.articles.length > 0 && !postUrl && !isPublishing && !publishError) {
      generateTitleAndPublish();
    }
  }, [brief]);

  const generateTitleAndPublish = async () => {
    if (!brief) return;

    setIsPublishing(true);
    setPublishError(null);

    try {
      // First, get a suggested title based on the articles
      const titleResponse = await fetch('/api/suggest-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articles: brief.articles.map(a => ({
            kicker: a.kicker,
            summary: a.summary,
            sourceName: a.sourceName,
          })),
        }),
      });

      const titleData = await titleResponse.json();
      const title = titleData.success && titleData.title
        ? titleData.title
        : "What we're reading";

      setSuggestedTitle(title);

      // Now publish to WordPress with the suggested title
      const response = await fetch('/api/wordpress/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          excerpt: "Here's some of the news that has caught our eye this week",
          content: brief.html,
          status: 'draft',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPostUrl(data.postUrl);
        setEditUrl(data.editUrl);
      } else {
        setPublishError(data.error || 'Failed to create WordPress draft');
      }
    } catch (err) {
      setPublishError('Network error. WordPress draft not created.');
      console.error('WordPress publish error:', err);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCopyNewsletter = async () => {
    if (!brief) return;

    try {
      // Generate newsletter format with blank lines between entries
      const articleLinesHtml = brief.articles
        .map((article) => {
          return `${article.emoji} <strong>${article.kicker}</strong> ${article.summary} 📌 <em>${article.sourceName}</em>`;
        })
        .join('<br>\n<br>\n');

      const articleLinesPlain = brief.articles
        .map((article) => {
          return `${article.emoji} ${article.kicker} ${article.summary} 📌 ${article.sourceName}`;
        })
        .join('\n\n');

      // Add "Learn more..." link if postUrl is available
      const newsletterHtml = postUrl
        ? `${articleLinesHtml}<br>\n<br>\n<a href="${postUrl}">Learn more...</a>`
        : articleLinesHtml;

      const newsletterPlain = postUrl
        ? `${articleLinesPlain}\n\nLearn more... ${postUrl}`
        : articleLinesPlain;

      const htmlBlob = new Blob([newsletterHtml], { type: 'text/html' });
      const textBlob = new Blob([newsletterPlain], { type: 'text/plain' });

      const clipboardItem = new ClipboardItem({
        'text/html': htmlBlob,
        'text/plain': textBlob,
      });

      await navigator.clipboard.write([clipboardItem]);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to copy newsletter:', err);
    }
  };

  const handleEmojiSelect = (articleId: string, emoji: string) => {
    onUpdateArticle(articleId, { emoji });
    setShowEmojiPicker(null);
  };

  // Reset state when brief changes
  useEffect(() => {
    if (!brief) {
      setPostUrl(null);
      setEditUrl(null);
      setPublishError(null);
      setSuggestedTitle(null);
    }
  }, [brief]);

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-700">
        <svg className="animate-spin h-8 w-8 mb-4 text-blue-600" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-sm text-gray-900">Fetching articles and generating summaries...</p>
        <p className="text-xs text-gray-600 mt-1">This may take a minute</p>
      </div>
    );
  }

  if (!brief && errors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-600">
        <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-sm text-gray-900">Your generated brief will appear here</p>
        <p className="text-xs text-gray-600 mt-1">Enter URLs and click Generate Brief</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-4">
        <button
          onClick={() => setActiveTab('wordpress')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'wordpress'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          WordPress
          {isPublishing && <span className="ml-2 text-xs">(saving...)</span>}
          {postUrl && <span className="ml-2 text-green-600">✓</span>}
        </button>
        <button
          onClick={() => setActiveTab('newsletter')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'newsletter'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Newsletter
        </button>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <h3 className="text-sm font-medium text-amber-800 mb-2">
            ⚠️ Some articles could not be processed:
          </h3>
          <ul className="text-xs text-amber-700 space-y-1">
            {errors.map((err) => (
              <li key={err.id} className="truncate">
                • {err.url ? `${err.url}: ` : ''}{err.error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* WordPress Tab */}
      {activeTab === 'wordpress' && brief && (
        <div className="flex-1 overflow-y-auto">
          {/* WordPress Status */}
          <div className="mb-4 p-4 rounded-lg border bg-gray-50">
            {isPublishing ? (
              <div className="flex items-center gap-2 text-gray-700">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-sm">Creating WordPress draft...</span>
              </div>
            ) : postUrl ? (
              <div>
                <div className="flex items-center gap-2 text-green-700 mb-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-medium">Draft saved to WordPress!</span>
                </div>
                {suggestedTitle && (
                  <p className="text-sm text-gray-700 mb-3">
                    <span className="font-medium">Title:</span> {suggestedTitle}
                  </p>
                )}
                <a
                  href={editUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit in WordPress
                </a>
              </div>
            ) : publishError ? (
              <div>
                <p className="text-red-600 text-sm mb-2">{publishError}</p>
                <button
                  onClick={generateTitleAndPublish}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  Retry
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-600">WordPress not configured. Set up credentials in .env file.</p>
            )}
          </div>

          {/* Tools */}
          <div className="mb-4 space-y-3">
            <IStockSearch
              headline={suggestedTitle || "What we're reading"}
              articles={brief.articles.map(a => ({
                kicker: a.kicker,
                summary: a.summary,
              }))}
            />
          </div>

          {/* Article List */}
          <div className="space-y-4">
            {brief.articles.map((article) => (
              <div key={article.id} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="flex items-start gap-3">
                  {/* Emoji Picker */}
                  <div className="relative">
                    <button
                      onClick={() => setShowEmojiPicker(showEmojiPicker === article.id ? null : article.id)}
                      className="text-2xl hover:bg-gray-100 rounded p-1"
                      title="Change emoji"
                    >
                      {article.emoji}
                    </button>
                    {showEmojiPicker === article.id && (
                      <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 grid grid-cols-7 gap-1">
                        {EMOJI_OPTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => handleEmojiSelect(article.id, emoji)}
                            className="text-xl hover:bg-gray-100 rounded p-1"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    {editingId === article.id ? (
                      <input
                        type="text"
                        value={article.kicker}
                        onChange={(e) => onUpdateArticle(article.id, { kicker: e.target.value })}
                        onBlur={() => setEditingId(null)}
                        autoFocus
                        className="w-full font-bold text-gray-900 border-b border-blue-500 outline-none mb-1"
                      />
                    ) : (
                      <span
                        onClick={() => setEditingId(article.id)}
                        className="font-bold text-gray-900 cursor-pointer hover:text-blue-600"
                        title="Click to edit kicker"
                      >
                        {article.kicker}
                      </span>
                    )}

                    <textarea
                      value={article.summary}
                      onChange={(e) => onUpdateArticle(article.id, { summary: e.target.value })}
                      className="w-full text-sm text-gray-900 border border-transparent hover:border-gray-300 focus:border-blue-500 rounded p-1 -m-1 resize-none mt-1 mb-2"
                      rows={3}
                    />

                    <p className="text-xs text-gray-600">
                      📌 Source:{' '}
                      <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {article.sourceName}
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Newsletter Tab */}
      {activeTab === 'newsletter' && brief && (
        <div className="flex-1 overflow-y-auto">
          {/* Copy Button */}
          <div className="mb-4">
            <button
              onClick={handleCopyNewsletter}
              className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-colors ${
                copyStatus === 'copied'
                  ? 'bg-green-600'
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {copyStatus === 'copied' ? '✓ Copied to clipboard!' : 'Copy Rich Text for Newsletter'}
            </button>
            {!postUrl && (
              <p className="text-xs text-amber-600 mt-2">
                ⚠️ WordPress draft not created yet - "Learn more..." link won't be included
              </p>
            )}
          </div>

          {/* Preview */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Preview:</h3>
            <div className="space-y-4 text-sm">
              {brief.articles.map((article) => (
                <p key={article.id} className="text-gray-900 pb-3 border-b border-gray-200 last:border-b-0">
                  {article.emoji} <strong>{article.kicker}</strong> {article.summary} 📌 <em>{article.sourceName}</em>
                </p>
              ))}
              {postUrl && (
                <p className="pt-2">
                  <a href={postUrl} className="text-blue-600 hover:underline">Learn more...</a>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

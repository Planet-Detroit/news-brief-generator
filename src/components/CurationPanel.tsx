'use client';

import { useState, useRef, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Article structure matching Gemini format
interface Article {
  id: string;
  emoji: string;
  caption: string;
  summary: string;
  sourceName: string;
  url: string;
}

interface IStockImage {
  id: string;
  title: string;
  thumbUrl: string;
  previewUrl: string;
}

interface SEOSuggestion {
  headline: string;
  metaDescription: string;
}

// Sequential workflow steps
type WorkflowStep = 'paste' | 'review' | 'seo' | 'image' | 'newsletter' | 'publish';

const WORKFLOW_STEPS: { key: WorkflowStep; label: string; icon: string }[] = [
  { key: 'paste', label: 'Paste', icon: '📋' },
  { key: 'review', label: 'Review', icon: '✏️' },
  { key: 'seo', label: 'SEO', icon: '🎯' },
  { key: 'image', label: 'Image', icon: '🖼️' },
  { key: 'publish', label: 'Publish', icon: '🚀' },
  { key: 'newsletter', label: 'Newsletter', icon: '📧' },
];

// Sortable Article Card Component
function SortableArticleCard({
  article,
  onDelete,
}: {
  article: Article;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: article.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-3 bg-white border border-gray-200 rounded-lg shadow-sm ${isDragging ? 'shadow-lg' : ''}`}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing p-1 touch-none"
          title="Drag to reorder"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
          </svg>
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{article.emoji}</span>
            <span className="font-semibold text-gray-900">{article.caption}</span>
          </div>
          <p className="text-sm text-gray-700 mb-2">{article.summary}</p>
          <p className="text-xs text-gray-500">
            📍 <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{article.sourceName}</a>
          </p>
        </div>

        <button
          onClick={() => onDelete(article.id)}
          className="text-gray-400 hover:text-red-600 text-xl leading-none p-1"
          title="Remove article"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default function CurationPanel() {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('paste');
  const [title, setTitle] = useState('');
  const [articles, setArticles] = useState<Article[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  // Manual paste mode
  const [showManualPaste, setShowManualPaste] = useState(false);
  const [manualSource, setManualSource] = useState('');
  const [manualContent, setManualContent] = useState('');

  // SEO state
  const [seoSuggestions, setSeoSuggestions] = useState<SEOSuggestion[]>([]);
  const [imageSearchTerms, setImageSearchTerms] = useState<string[]>([]);
  const [isLoadingSeo, setIsLoadingSeo] = useState(false);
  const [selectedSeoIndex, setSelectedSeoIndex] = useState<number | null>(null);
  const [customHeadline, setCustomHeadline] = useState('');
  const [customMetaDesc, setCustomMetaDesc] = useState('');

  // Image state
  const [imageSearch, setImageSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<IStockImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<IStockImage | null>(null);
  const [imageSeo, setImageSeo] = useState<{
    altText: string;
    caption: string;
    description: string;
  } | null>(null);
  const [isGeneratingImageSeo, setIsGeneratingImageSeo] = useState(false);

  // Publish result
  const [publishResult, setPublishResult] = useState<{
    success: boolean;
    postId?: number;
    postUrl?: string;
    editUrl?: string;
    error?: string;
  } | null>(null);

  // Track where user came from when jumping to Newsletter out of sequence
  const [previousStep, setPreviousStep] = useState<WorkflowStep | null>(null);

  // Push to Newsletter Builder state
  const [pushStatus, setPushStatus] = useState<'idle' | 'pushing' | 'success' | 'error'>('idle');
  const [pushMessage, setPushMessage] = useState<string | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Fetch SEO suggestions when entering SEO step
  useEffect(() => {
    if (currentStep === 'seo' && articles.length > 0 && seoSuggestions.length === 0) {
      fetchSeoSuggestions();
    }
  }, [currentStep]);

  // Generate image SEO when image is selected
  useEffect(() => {
    if (selectedImage && !imageSeo && !isGeneratingImageSeo) {
      generateImageSeo(selectedImage);
    }
  }, [selectedImage]);

  const fetchSeoSuggestions = async () => {
    setIsLoadingSeo(true);
    setError(null);

    try {
      const response = await fetch('/api/seo-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articles: articles.map(a => ({
            emoji: a.emoji,
            caption: a.caption,
            summary: a.summary,
            sourceName: a.sourceName,
          })),
          currentTitle: title || `What We're Reading - ${new Date().toLocaleDateString()}`,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSeoSuggestions(data.suggestions || []);
        setImageSearchTerms(data.imageSearchTerms || []);
        if (data.suggestions?.length > 0) {
          setSelectedSeoIndex(0);
          setCustomHeadline(data.suggestions[0].headline);
          setCustomMetaDesc(data.suggestions[0].metaDescription);
        }
      } else {
        setError(data.error || 'Failed to generate SEO suggestions');
      }
    } catch (err) {
      setError('Failed to fetch SEO suggestions');
    } finally {
      setIsLoadingSeo(false);
    }
  };

  const generateImageSeo = async (image: IStockImage) => {
    setIsGeneratingImageSeo(true);

    try {
      const response = await fetch('/api/image-seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageTitle: image.title,
          articleTopics: articles.map(a => a.caption),
          postTitle: title || `What We're Reading - ${new Date().toLocaleDateString()}`,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setImageSeo({
          altText: data.altText || image.title,
          caption: data.caption || '',
          description: data.description || '',
        });
      }
    } catch (err) {
      setImageSeo({
        altText: image.title,
        caption: 'Image via Getty Images',
        description: '',
      });
    } finally {
      setIsGeneratingImageSeo(false);
    }
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setArticles((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Clean text by removing markdown formatting and errant characters
  const cleanText = (text: string): string => {
    return text
      .replace(/\*\*/g, '') // Remove bold markdown
      .replace(/\*/g, '')   // Remove italic markdown
      .replace(/_/g, ' ')   // Replace underscores with spaces
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  };

  // Parse Gemini output
  const parseGeminiOutput = (rawText: string): Article[] => {
    const lines = rawText.split(/\n+/).filter(line => {
      const trimmed = line.trim();
      return trimmed.length > 0 &&
             !trimmed.match(/^VERSION\s*\d/i) &&
             !trimmed.match(/^(Full List|Short Summary)/i) &&
             !trimmed.match(/^-+$/) &&
             trimmed.includes('📍');
    });

    const articles: Article[] = [];

    for (const line of lines) {
      let match = line.match(/^([^\s]+)\s+\*\*([^*]+)\*\*\s+(.+?)\s*📍\s*([^|]+?)\s*\|\s*(https?:\/\/[^\s]+)/);

      if (match) {
        articles.push({
          id: crypto.randomUUID(),
          emoji: match[1].trim(),
          caption: cleanText(match[2]),
          summary: cleanText(match[3]),
          sourceName: cleanText(match[4]),
          url: match[5].trim(),
        });
        continue;
      }

      match = line.match(/^([^\s]+)\s+(.+?)\s*📍\s*([^|]+?)\s*\|\s*(https?:\/\/[^\s]+)/);

      if (match) {
        const emoji = match[1].trim();
        const textBeforeSource = cleanText(match[2]);
        const sourceName = cleanText(match[3]);
        const url = match[4].trim();

        const words = textBeforeSource.split(/\s+/);
        let caption = '';
        let summary = '';

        if (words.length <= 5) {
          caption = textBeforeSource;
          summary = '';
        } else {
          let splitIndex = 3;
          for (let i = 2; i <= Math.min(6, words.length - 3); i++) {
            const potentialCaption = words.slice(0, i).join(' ');
            const nextWord = words[i];
            if (nextWord && /^[A-Z]/.test(nextWord) && !/[.!?]$/.test(potentialCaption)) {
              splitIndex = i;
              break;
            }
          }
          caption = words.slice(0, splitIndex).join(' ');
          summary = words.slice(splitIndex).join(' ');
        }

        articles.push({ id: crypto.randomUUID(), emoji, caption, summary, sourceName, url });
      }
    }

    return articles;
  };

  const handleProceedToReview = () => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText;
    const parsed = parseGeminiOutput(text);

    if (parsed.length === 0) {
      setError('Could not parse any articles. Make sure the format matches: emoji **caption** summary 📍 Source | URL');
      return;
    }

    setArticles(parsed);
    setError(null);
    setCurrentStep('review');
  };

  const handleDeleteArticle = (id: string) => {
    setArticles(prev => prev.filter(a => a.id !== id));
  };

  const handleAddUrl = async () => {
    if (!newUrl.trim()) return;

    setIsSummarizing(true);
    setError(null);

    try {
      const fetchResponse = await fetch('/api/fetch-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newUrl.trim() }),
      });

      const fetchResult = await fetchResponse.json();

      if (!fetchResult.success) {
        throw new Error(fetchResult.error?.message || 'Failed to fetch article');
      }

      const articleData = fetchResult.data || {};

      const summarizeResponse = await fetch('/api/summarize-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: newUrl.trim(),
          headline: articleData.headline || articleData.title || '',
          content: articleData.content || articleData.text || '',
          sourceName: articleData.sourceName || new URL(newUrl.trim()).hostname.replace('www.', ''),
        }),
      });

      const summarizeData = await summarizeResponse.json();

      if (!summarizeData.success) {
        throw new Error(summarizeData.error || 'Failed to summarize article');
      }

      setArticles(prev => [...prev, {
        id: crypto.randomUUID(),
        emoji: summarizeData.emoji || '📰',
        caption: summarizeData.caption || 'News update',
        summary: summarizeData.summary || '',
        sourceName: summarizeData.sourceName || articleData.sourceName || new URL(newUrl.trim()).hostname.replace('www.', ''),
        url: newUrl.trim(),
      }]);

      setNewUrl('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add article');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleAddManual = async () => {
    if (!manualContent.trim()) return;

    setIsSummarizing(true);
    setError(null);

    try {
      const summarizeResponse = await fetch('/api/summarize-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: newUrl.trim() || '#',
          headline: '',
          content: manualContent.trim(),
          sourceName: manualSource.trim() || 'Source',
        }),
      });

      const summarizeData = await summarizeResponse.json();

      if (!summarizeData.success) {
        throw new Error(summarizeData.error || 'Failed to summarize article');
      }

      setArticles(prev => [...prev, {
        id: crypto.randomUUID(),
        emoji: summarizeData.emoji || '📰',
        caption: summarizeData.caption || 'News update',
        summary: summarizeData.summary || '',
        sourceName: manualSource.trim() || summarizeData.sourceName || 'Source',
        url: newUrl.trim() || '#',
      }]);

      setNewUrl('');
      setManualSource('');
      setManualContent('');
      setShowManualPaste(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add article');
    } finally {
      setIsSummarizing(false);
    }
  };

  // Search iStock
  const handleImageSearch = async (searchTerm?: string) => {
    const query = searchTerm || imageSearch;
    if (!query.trim()) return;

    setImageSearch(query);
    setIsSearching(true);
    setError(null);
    setSearchResults([]);

    try {
      const response = await fetch('/api/istock/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        setSearchResults(data.images || []);
        if (data.images?.length === 0) {
          setError('No images found. Try a different search term.');
        }
      } else {
        setError(data.error || 'Search failed');
      }
    } catch (err) {
      setError('Failed to search images');
    } finally {
      setIsSearching(false);
    }
  };

  // Subtitle for the post
  const getSubtitle = (): string => {
    return `What we're reading this week across the news ecosystem`;
  };

  // FINAL PUBLISH - sends everything to WordPress at once
  const handlePublishAll = async () => {
    if (articles.length === 0) return;

    setIsPublishing(true);
    setPublishResult(null);
    setError(null);

    try {
      // Step 1: Create the post with subtitle
      const htmlContent = articlesToWordPressHtml(articles);
      const subtitle = getSubtitle();

      const postResponse = await fetch('/api/wordpress/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: customHeadline || title || `What We're Reading - ${new Date().toLocaleDateString()}`,
          content: htmlContent,
          status: 'draft',
          excerpt: subtitle, // This sets the subtitle via multiple meta fields
        }),
      });

      const postData = await postResponse.json();

      if (!postData.success) {
        throw new Error(postData.error || 'Failed to create post');
      }

      const postId = postData.postId;

      // Step 2: Update SEO fields
      if (customHeadline || customMetaDesc) {
        await fetch('/api/wordpress/update-seo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postId,
            title: customHeadline,
            seoTitle: customHeadline,
            metaDescription: customMetaDesc,
            // Keep the subtitle separate from the meta description
          }),
        });
      }

      // Step 3: Upload featured image if selected
      if (selectedImage) {
        await fetch('/api/istock/upload-to-wordpress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl: selectedImage.previewUrl,
            imageId: selectedImage.id,
            title: selectedImage.title,
            postId,
            altText: imageSeo?.altText || selectedImage.title,
            caption: imageSeo?.caption || 'Image via Getty Images',
            description: imageSeo?.description || '',
            imageSize: 'large', // Request large size for featured image
          }),
        });
      }

      setPublishResult({ success: true, postId, postUrl: postData.postUrl, editUrl: postData.editUrl });
      setCurrentStep('publish');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish');
      setPublishResult({ success: false, error: err instanceof Error ? err.message : 'Failed to publish' });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleStartOver = () => {
    setCurrentStep('paste');
    setArticles([]);
    setPublishResult(null);
    setError(null);
    setCopySuccess(null);
    setImageSearch('');
    setSearchResults([]);
    setSelectedImage(null);
    setSeoSuggestions([]);
    setImageSearchTerms([]);
    setSelectedSeoIndex(null);
    setCustomHeadline('');
    setCustomMetaDesc('');
    setImageSeo(null);
    setTitle('');
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
    }
  };

  // Newsletter functions
  const articlesToNewsletterText = (articles: Article[], postUrl?: string): string => {
    const articleText = articles.map(article => {
      return `${article.emoji} **${article.caption}** ${article.summary} 📍 ${article.sourceName}`;
    }).join('\n\n');

    const learnMoreLink = postUrl || '[INSERT LINK]';
    return `${articleText}\n\nLearn more: ${learnMoreLink}`;
  };

  const articlesToNewsletterHtml = (articles: Article[], postUrl?: string): string => {
    const articleHtml = articles.map(article => {
      return `<p>${article.emoji} <strong>${article.caption}</strong> ${article.summary} 📍 ${article.sourceName}</p>`;
    }).join('\n');

    const learnMoreLink = postUrl
      ? `<a href="${postUrl}">Learn more</a>`
      : 'Learn more: [INSERT LINK]';
    return `${articleHtml}\n<p>${learnMoreLink}</p>`;
  };

  const handleCopyRichText = async () => {
    const postUrl = publishResult?.postUrl;
    const html = articlesToNewsletterHtml(articles, postUrl);
    const plainText = articlesToNewsletterText(articles, postUrl);

    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([plainText], { type: 'text/plain' }),
        }),
      ]);
      setCopySuccess('Rich text copied!');
    } catch (err) {
      await navigator.clipboard.writeText(plainText);
      setCopySuccess('Plain text copied!');
    }
    setTimeout(() => setCopySuccess(null), 2000);
  };

  const handleCopyHtml = async () => {
    const postUrl = publishResult?.postUrl;
    const html = articlesToNewsletterHtml(articles, postUrl);
    await navigator.clipboard.writeText(html);
    setCopySuccess('HTML copied!');
    setTimeout(() => setCopySuccess(null), 2000);
  };

  const handlePushToNewsletter = async () => {
    setPushStatus('pushing');
    setPushMessage(null);
    try {
      const res = await fetch('/api/briefs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || `News brief — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          postUrl: publishResult?.postUrl || null,
          articles: articles.map(a => ({
            emoji: a.emoji,
            caption: a.caption,
            summary: a.summary,
            sourceName: a.sourceName,
            url: a.url,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setPushStatus('success');
      setPushMessage(`Saved! The newsletter builder can now import "${data.brief.title}".`);
    } catch (err) {
      setPushStatus('error');
      setPushMessage(err instanceof Error ? err.message : 'Failed to push');
    }
  };

  const proxyImageUrl = (url: string) => {
    return `/api/istock/proxy-image?url=${encodeURIComponent(url)}`;
  };

  const handleSelectSuggestion = (index: number) => {
    setSelectedSeoIndex(index);
    setCustomHeadline(seoSuggestions[index].headline);
    setCustomMetaDesc(seoSuggestions[index].metaDescription);
  };

  // Navigation
  const goToStep = (step: WorkflowStep) => {
    // Newsletter is always accessible
    if (step === 'newsletter') {
      if (currentStep !== 'newsletter') {
        setPreviousStep(currentStep);
      }
      setCurrentStep(step);
      return;
    }

    const stepIndex = WORKFLOW_STEPS.findIndex(s => s.key === step);
    const currentIndex = WORKFLOW_STEPS.findIndex(s => s.key === currentStep);

    // Can only go back or to current step, not forward arbitrarily
    if (stepIndex <= currentIndex) {
      setPreviousStep(null);
      setCurrentStep(step);
    }
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 'paste': return false; // handled by button
      case 'review': return articles.length > 0;
      case 'seo': return customHeadline.trim().length > 0;
      case 'image': return true; // image is optional
      case 'newsletter': return true;
      case 'publish': return false;
      default: return false;
    }
  };

  const getNextStep = (): WorkflowStep | null => {
    const currentIndex = WORKFLOW_STEPS.findIndex(s => s.key === currentStep);
    if (currentIndex < WORKFLOW_STEPS.length - 1) {
      return WORKFLOW_STEPS[currentIndex + 1].key;
    }
    return null;
  };

  const getPrevStep = (): WorkflowStep | null => {
    const currentIndex = WORKFLOW_STEPS.findIndex(s => s.key === currentStep);
    if (currentIndex > 0) {
      return WORKFLOW_STEPS[currentIndex - 1].key;
    }
    return null;
  };

  const handleNext = () => {
    const next = getNextStep();
    if (next) setCurrentStep(next);
  };

  const handleBack = () => {
    const prev = getPrevStep();
    if (prev) setCurrentStep(prev);
  };

  const currentStepIndex = WORKFLOW_STEPS.findIndex(s => s.key === currentStep);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <h2 className="text-lg font-semibold text-gray-900 mb-3 flex-shrink-0">Weekly News Curation</h2>

      {/* Step indicator */}
      <div className="flex items-center mb-4 overflow-x-auto flex-shrink-0 pb-2">
        {WORKFLOW_STEPS.map((step, idx) => {
          const isNewsletter = step.key === 'newsletter';
          const isDisabled = idx > currentStepIndex && !isNewsletter;

          return (
            <div key={step.key} className="flex items-center">
              <button
                onClick={() => goToStep(step.key)}
                disabled={isDisabled}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                  currentStep === step.key
                    ? 'bg-[#2982c4] text-white'
                    : idx < currentStepIndex
                    ? 'bg-[#d4e9f5] text-[#2982c4] hover:bg-[#b3d4e8]'
                    : isNewsletter
                    ? 'bg-[#fef3c7] text-[#92400e] hover:bg-[#fde68a] ring-1 ring-[#f59e0b]'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <span>{step.icon}</span>
                <span className="hidden sm:inline">{step.label}</span>
              </button>
              {idx < WORKFLOW_STEPS.length - 1 && (
                <div className={`w-4 h-0.5 mx-1 ${idx < currentStepIndex ? 'bg-[#7db8da]' : 'bg-gray-200'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg flex-shrink-0">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Success message */}
      {copySuccess && (
        <div className="mb-3 p-2 bg-green-100 border border-green-300 rounded-lg text-center flex-shrink-0">
          <p className="text-sm text-green-800 font-medium">✓ {copySuccess}</p>
        </div>
      )}

      {/* STEP: Paste */}
      {currentStep === 'paste' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="mb-3 p-3 bg-[#e8f4fa] border border-[#b3d4e8] rounded-lg flex-shrink-0">
            <p className="text-sm font-medium text-[#1a5a8a] mb-2">
              First, generate your curated news list:
            </p>
            <a
              href="https://gemini.google.com/gem/1k53wHUaIr5cMHEpNkwaX_GwbNblNEacs?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#2982c4] text-white text-sm font-medium rounded-lg hover:bg-[#2371a8] transition-colors"
            >
              <span>✨</span>
              Open Planet Detroit News Curator Gem
              <span>→</span>
            </a>
          </div>

          <p className="text-sm text-gray-600 mb-2 flex-shrink-0">Then paste the output below:</p>

          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            <div
              ref={editorRef}
              contentEditable
              className="flex-1 min-h-[150px] px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#2982c4] focus:border-transparent overflow-y-auto bg-white"
              style={{ outline: 'none', lineHeight: '1.6' }}
              data-placeholder="Paste your Gemini Gem output here... (VERSION 1 with links)"
            />
            <style jsx>{`
              div[contenteditable]:empty:before {
                content: attr(data-placeholder);
                color: #9ca3af;
                pointer-events: none;
              }
            `}</style>
          </div>

          <button
            onClick={handleProceedToReview}
            className="mt-3 px-4 py-2 bg-[#2982c4] text-white text-sm font-medium rounded-lg hover:bg-[#2371a8] flex-shrink-0"
          >
            Continue to Review →
          </button>
        </div>
      )}

      {/* STEP: Review */}
      {currentStep === 'review' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="mb-2 flex-shrink-0">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`Post title: What We're Reading - ${new Date().toLocaleDateString()}`}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <p className="text-xs text-gray-500 mb-2 flex-shrink-0">{articles.length} articles — drag to reorder</p>

          <div className="flex-1 overflow-y-auto space-y-2 mb-3">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={articles.map(a => a.id)} strategy={verticalListSortingStrategy}>
                {articles.map((article) => (
                  <SortableArticleCard key={article.id} article={article} onDelete={handleDeleteArticle} />
                ))}
              </SortableContext>
            </DndContext>

            {/* Add new URL */}
            <div className="p-3 bg-gray-50 border border-dashed border-gray-300 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-700">Add another article</p>
                <button
                  onClick={() => setShowManualPaste(!showManualPaste)}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  {showManualPaste ? '← Back to URL' : 'Paywalled? →'}
                </button>
              </div>

              {!showManualPaste ? (
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="Paste URL..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400"
                    disabled={isSummarizing}
                  />
                  <button
                    onClick={handleAddUrl}
                    disabled={!newUrl.trim() || isSummarizing}
                    className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSummarizing ? '...' : '+ Add'}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={manualSource}
                      onChange={(e) => setManualSource(e.target.value)}
                      placeholder="Source name"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400"
                    />
                    <input
                      type="url"
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      placeholder="URL (optional)"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                  <textarea
                    value={manualContent}
                    onChange={(e) => setManualContent(e.target.value)}
                    placeholder="Paste article text..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 resize-none"
                  />
                  <button
                    onClick={handleAddManual}
                    disabled={!manualContent.trim() || isSummarizing}
                    className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSummarizing ? 'Summarizing...' : '+ Add & Summarize'}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 flex-shrink-0">
            <button onClick={handleBack} className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300">
              ← Back
            </button>
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex-1 px-4 py-2 bg-[#2982c4] text-white text-sm font-medium rounded-lg hover:bg-[#2371a8] disabled:opacity-50"
            >
              Continue to SEO →
            </button>
          </div>
        </div>
      )}

      {/* STEP: SEO */}
      {currentStep === 'seo' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {isLoadingSeo ? (
            <div className="flex-1 flex items-center justify-center">
              <svg className="animate-spin h-6 w-6 text-[#2982c4] mr-2" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm text-gray-600">Generating SEO suggestions...</span>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-4 pb-4">
              <div>
                <p className="text-sm font-medium text-gray-900 mb-2">Choose a headline:</p>
                <div className="space-y-2">
                  {seoSuggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectSuggestion(idx)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedSeoIndex === idx
                          ? 'border-[#2982c4] bg-[#e8f4fa]'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className="text-sm font-medium text-gray-900">{suggestion.headline}</p>
                      <p className="text-xs text-gray-500 mt-1">{suggestion.metaDescription}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  SEO Title ({customHeadline.length}/60)
                </label>
                <input
                  type="text"
                  value={customHeadline}
                  onChange={(e) => setCustomHeadline(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#2982c4] ${
                    customHeadline.length > 60 ? 'border-orange-400' : 'border-gray-300'
                  }`}
                  placeholder="Enter headline..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Meta Description ({customMetaDesc.length}/160)
                </label>
                <textarea
                  value={customMetaDesc}
                  onChange={(e) => setCustomMetaDesc(e.target.value)}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#2982c4] resize-none ${
                    customMetaDesc.length > 160 ? 'border-orange-400' : 'border-gray-300'
                  }`}
                  placeholder="Enter meta description..."
                />
              </div>
            </div>
          )}

          <div className="flex gap-2 flex-shrink-0 pt-2 border-t">
            <button onClick={handleBack} className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300">
              ← Back
            </button>
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex-1 px-4 py-2 bg-[#2982c4] text-white text-sm font-medium rounded-lg hover:bg-[#2371a8] disabled:opacity-50"
            >
              Continue to Image →
            </button>
          </div>
        </div>
      )}

      {/* STEP: Image */}
      {currentStep === 'image' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto pb-4">
            {/* Suggested search terms */}
            {imageSearchTerms.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-700 mb-2">Suggested searches:</p>
                <div className="flex flex-wrap gap-2">
                  {imageSearchTerms.map((term, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleImageSearch(term)}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search input */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={imageSearch}
                onChange={(e) => setImageSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleImageSearch()}
                placeholder="Search iStock..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400"
                disabled={isSearching}
              />
              <button
                onClick={() => handleImageSearch()}
                disabled={!imageSearch.trim() || isSearching}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isSearching ? '...' : 'Search'}
              </button>
            </div>

            {/* Selected image + SEO */}
            {selectedImage && (
              <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3 mb-3">
                  <img src={proxyImageUrl(selectedImage.thumbUrl)} alt={selectedImage.title} className="w-20 h-20 object-cover rounded" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 font-medium truncate">{selectedImage.title}</p>
                    <p className="text-xs text-gray-500">ID: {selectedImage.id}</p>
                  </div>
                  <button
                    onClick={() => { setSelectedImage(null); setImageSeo(null); }}
                    className="text-gray-400 hover:text-gray-600 text-lg"
                  >
                    ×
                  </button>
                </div>

                {isGeneratingImageSeo ? (
                  <p className="text-xs text-gray-500 flex items-center">
                    <svg className="animate-spin h-3 w-3 mr-1" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Generating SEO metadata...
                  </p>
                ) : imageSeo && (
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Alt Text</label>
                      <input
                        type="text"
                        value={imageSeo.altText}
                        onChange={(e) => setImageSeo({ ...imageSeo, altText: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Caption</label>
                      <input
                        type="text"
                        value={imageSeo.caption}
                        onChange={(e) => setImageSeo({ ...imageSeo, caption: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-gray-900"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Search results */}
            {searchResults.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {searchResults.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(img)}
                    className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                      selectedImage?.id === img.id
                        ? 'border-blue-500 ring-2 ring-blue-200'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <img src={proxyImageUrl(img.thumbUrl)} alt={img.title} className="w-full h-full object-cover" />
                    {selectedImage?.id === img.id && (
                      <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                        <span className="text-white text-2xl">✓</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {searchResults.length === 0 && !isSearching && (
              <div className="text-center text-gray-400 text-sm py-8">
                {imageSearchTerms.length > 0 ? 'Click a suggested search or enter your own' : 'Search for images (optional)'}
              </div>
            )}
          </div>

          <div className="flex gap-2 flex-shrink-0 pt-2 border-t">
            <button onClick={handleBack} className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300">
              ← Back
            </button>
            <button
              onClick={handleNext}
              className="flex-1 px-4 py-2 bg-[#2982c4] text-white text-sm font-medium rounded-lg hover:bg-[#2371a8]"
            >
              {selectedImage ? 'Continue to Publish →' : 'Skip Image →'}
            </button>
          </div>
        </div>
      )}

      {/* STEP: Publish */}
      {currentStep === 'publish' && !publishResult?.success && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="text-center p-6 bg-[#e8f4fa] border border-[#b3d4e8] rounded-lg mb-4 max-w-md">
              <p className="text-2xl mb-2">🚀</p>
              <p className="text-lg font-medium text-gray-900 mb-2">Ready to Publish</p>
              <p className="text-sm text-gray-600 mb-4">
                This will create a WordPress draft with your {articles.length} articles, SEO data{selectedImage ? ', and featured image' : ''}.
              </p>
              <button
                onClick={handlePublishAll}
                disabled={isPublishing}
                className="w-full px-4 py-3 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isPublishing ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Publishing to WordPress...
                  </>
                ) : (
                  '🚀 Publish to WordPress'
                )}
              </button>
            </div>
          </div>

          <div className="flex gap-2 flex-shrink-0 pt-2 border-t">
            <button onClick={handleBack} className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300">
              ← Back to Image
            </button>
          </div>
        </div>
      )}

      {/* STEP: Publish Success → Auto-advance to Newsletter */}
      {currentStep === 'publish' && publishResult?.success && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center p-6 bg-green-50 border border-green-200 rounded-lg mb-4">
            <p className="text-2xl mb-2">✓</p>
            <p className="text-lg font-medium text-green-800 mb-2">Published to WordPress!</p>
            {publishResult.editUrl && (
              <a
                href={publishResult.editUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-green-700 hover:text-green-900 underline"
              >
                Open in WordPress →
              </a>
            )}
          </div>
          <button
            onClick={handleNext}
            className="px-6 py-2 bg-[#2982c4] text-white text-sm font-medium rounded-lg hover:bg-[#2371a8]"
          >
            Continue to Newsletter →
          </button>
        </div>
      )}

      {/* STEP: Newsletter (accessible anytime once articles exist) */}
      {currentStep === 'newsletter' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <p className="text-sm text-gray-600 mb-2 flex-shrink-0">Copy newsletter format for ActiveCampaign (no article links):</p>

          {!publishResult?.postUrl && (
            <div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded-lg flex-shrink-0">
              <p className="text-xs text-amber-700">
                The &quot;Learn more&quot; link will update automatically after you publish to WordPress.
              </p>
            </div>
          )}

          <div className="flex-1 overflow-y-auto mb-3 p-3 bg-white border border-gray-200 rounded-lg">
            {articles.map((article, idx) => (
              <p key={article.id} className="text-sm text-gray-800 mb-3">
                {article.emoji} <strong>{article.caption}</strong> {article.summary} 📍 {article.sourceName}
              </p>
            ))}
            <p className="text-sm text-gray-800 mt-4 pt-3 border-t border-gray-100">
              Learn more:{' '}
              {publishResult?.postUrl ? (
                <a href={publishResult.postUrl} target="_blank" rel="noopener noreferrer" className="text-[#2982c4] hover:underline">
                  {publishResult.postUrl}
                </a>
              ) : (
                <span className="text-gray-400">[INSERT LINK]</span>
              )}
            </p>
          </div>

          <div className="flex gap-2 mb-2 flex-shrink-0">
            <button
              onClick={handleCopyRichText}
              className="flex-1 px-3 py-2 bg-[#2982c4] text-white text-sm rounded-lg hover:bg-[#2371a8]"
            >
              📋 Copy Rich Text
            </button>
            <button
              onClick={handleCopyHtml}
              className="flex-1 px-3 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700"
            >
              &lt;/&gt; Copy HTML
            </button>
          </div>

          <button
            onClick={handlePushToNewsletter}
            disabled={pushStatus === 'pushing'}
            className={`w-full px-3 py-2 mb-3 text-sm font-medium rounded-lg flex-shrink-0 transition-colors ${
              pushStatus === 'success'
                ? 'bg-green-600 text-white'
                : pushStatus === 'pushing'
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-amber-500 text-white hover:bg-amber-600'
            }`}
          >
            {pushStatus === 'pushing' ? 'Saving...' : pushStatus === 'success' ? '✓ Saved to Newsletter Builder' : '📰 Push to Newsletter Builder'}
          </button>
          {pushMessage && (
            <p className={`text-xs mb-3 flex-shrink-0 ${pushStatus === 'error' ? 'text-red-600' : 'text-green-700'}`}>
              {pushMessage}
            </p>
          )}

          <div className="flex gap-2 flex-shrink-0 pt-2 border-t">
            {previousStep ? (
              <button
                onClick={() => {
                  setCurrentStep(previousStep);
                  setPreviousStep(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300"
              >
                ← Back to {WORKFLOW_STEPS.find(s => s.key === previousStep)?.label}
              </button>
            ) : (
              <button
                onClick={handleBack}
                className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300"
              >
                ← Back
              </button>
            )}
            {publishResult?.success ? (
              <button
                onClick={handleStartOver}
                className="flex-1 px-6 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
              >
                ✓ Done — Start New Curation
              </button>
            ) : (
              <button
                onClick={() => {
                  setPreviousStep(null);
                  const pubIdx = WORKFLOW_STEPS.findIndex(s => s.key === 'publish');
                  const curIdx = previousStep
                    ? WORKFLOW_STEPS.findIndex(s => s.key === previousStep)
                    : WORKFLOW_STEPS.findIndex(s => s.key === 'image');
                  // Return to the furthest step they had reached, or continue workflow
                  setCurrentStep(WORKFLOW_STEPS[Math.min(curIdx + 1, pubIdx)].key);
                }}
                className="flex-1 px-4 py-2 bg-[#2982c4] text-white text-sm font-medium rounded-lg hover:bg-[#2371a8]"
              >
                Continue Workflow →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Convert articles to WordPress HTML
function articlesToWordPressHtml(articles: Article[]): string {
  return articles.map(article => {
    return `<p>${article.emoji} <strong>${article.caption}</strong> ${article.summary} 📍 <a href="${article.url}" target="_blank" rel="noopener noreferrer">${article.sourceName}</a></p>`;
  }).join('\n');
}

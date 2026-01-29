'use client';

import { useState } from 'react';

interface IStockSearchProps {
  headline: string | null;
  articles: Array<{
    kicker: string;
    summary: string;
  }>;
}

interface SearchSuggestion {
  query: string;
  url: string;
  reasoning: string;
}

export default function IStockSearch({ headline, articles }: IStockSearchProps) {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const generateSearchQueries = () => {
    setIsLoading(true);
    setIsExpanded(true);

    // Generate search queries based on headline and article content
    const queries: SearchSuggestion[] = [];

    // Extract key themes from articles
    const allText = articles.map(a => `${a.kicker} ${a.summary}`).join(' ').toLowerCase();

    // Common news photo themes
    const themes: Record<string, string[]> = {
      weather: ['winter', 'cold', 'snow', 'ice', 'storm', 'freeze', 'polar', 'arctic', 'temperature'],
      water: ['water', 'pipe', 'main break', 'flood', 'lake', 'great lakes', 'drinking water'],
      energy: ['energy', 'utility', 'power', 'electric', 'battery', 'solar', 'wind', 'grid'],
      environment: ['environment', 'pollution', 'spill', 'oil', 'climate', 'emissions'],
      government: ['law', 'court', 'judge', 'regulation', 'policy', 'legislature', 'governor'],
      health: ['health', 'hospital', 'medical', 'disease', 'vaccine'],
      infrastructure: ['road', 'bridge', 'construction', 'transit', 'transportation'],
      michigan: ['michigan', 'detroit', 'great lakes'],
    };

    // Find matching themes
    const matchedThemes: string[] = [];
    for (const [theme, keywords] of Object.entries(themes)) {
      if (keywords.some(kw => allText.includes(kw))) {
        matchedThemes.push(theme);
      }
    }

    // Generate search URLs based on headline or themes
    if (headline) {
      // Clean headline for search
      const cleanHeadline = headline
        .replace(/[^\w\s]/g, '')
        .split(' ')
        .slice(0, 5)
        .join(' ');

      queries.push({
        query: cleanHeadline,
        url: `https://www.istockphoto.com/search/2/image?phrase=${encodeURIComponent(cleanHeadline)}`,
        reasoning: 'Based on your selected headline',
      });
    }

    // Add theme-based suggestions
    if (matchedThemes.includes('weather') || allText.includes('cold') || allText.includes('winter')) {
      queries.push({
        query: 'winter storm midwest',
        url: 'https://www.istockphoto.com/search/2/image?phrase=winter%20storm%20midwest',
        reasoning: 'Weather-related coverage',
      });
    }

    if (matchedThemes.includes('water') || allText.includes('water main') || allText.includes('pipe')) {
      queries.push({
        query: 'water pipe burst repair',
        url: 'https://www.istockphoto.com/search/2/image?phrase=water%20pipe%20burst%20repair',
        reasoning: 'Water infrastructure imagery',
      });
    }

    if (matchedThemes.includes('michigan') || allText.includes('great lakes')) {
      queries.push({
        query: 'Great Lakes Michigan aerial',
        url: 'https://www.istockphoto.com/search/2/image?phrase=great%20lakes%20michigan%20aerial',
        reasoning: 'Regional Michigan imagery',
      });
    }

    if (matchedThemes.includes('energy') || allText.includes('utility') || allText.includes('battery')) {
      queries.push({
        query: 'renewable energy grid',
        url: 'https://www.istockphoto.com/search/2/image?phrase=renewable%20energy%20grid',
        reasoning: 'Energy/utility coverage',
      });
    }

    if (matchedThemes.includes('environment') || allText.includes('spill') || allText.includes('pollution')) {
      queries.push({
        query: 'environmental pollution cleanup',
        url: 'https://www.istockphoto.com/search/2/image?phrase=environmental%20pollution%20cleanup',
        reasoning: 'Environmental story imagery',
      });
    }

    // Fallback general news images
    if (queries.length < 3) {
      queries.push({
        query: 'news desk newspaper',
        url: 'https://www.istockphoto.com/search/2/image?phrase=news%20desk%20newspaper',
        reasoning: 'Generic news imagery',
      });
    }

    setSuggestions(queries.slice(0, 4));
    setIsLoading(false);
  };

  if (!isExpanded) {
    return (
      <button
        onClick={generateSearchQueries}
        disabled={articles.length === 0}
        className="w-full py-2 px-4 bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Find photos on iStock
      </button>
    );
  }

  return (
    <div className="border border-teal-200 rounded-lg bg-teal-50 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-teal-900 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          iStock Photo Suggestions
        </h3>
        <button
          onClick={() => {
            setIsExpanded(false);
            setSuggestions([]);
          }}
          className="text-teal-600 hover:text-teal-800 text-sm"
        >
          Close
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-4 text-teal-700">
          <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Finding relevant photos...
        </div>
      ) : (
        <div className="space-y-2">
          {suggestions.map((suggestion, index) => (
            <a
              key={index}
              href={suggestion.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 rounded-lg border border-teal-200 bg-white hover:border-teal-400 hover:bg-teal-50 transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">&quot;{suggestion.query}&quot;</p>
                  <p className="text-xs text-gray-600">{suggestion.reasoning}</p>
                </div>
                <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
            </a>
          ))}

          <button
            onClick={generateSearchQueries}
            className="w-full mt-2 py-1.5 text-sm text-teal-600 hover:text-teal-800 hover:bg-teal-100 rounded transition-colors"
          >
            ↻ Regenerate suggestions
          </button>
        </div>
      )}
    </div>
  );
}

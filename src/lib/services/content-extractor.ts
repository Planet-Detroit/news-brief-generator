import * as cheerio from 'cheerio';
import type { ExtractedContent } from '@/types';
import { getSourceName } from '@/lib/utils/url-parser';
import { normalizeSourceName } from '@/lib/constants/source-names';

// Re-export for backward compatibility
export { normalizeSourceName } from '@/lib/constants/source-names';

// Type for cheerio loaded document
type CheerioDoc = ReturnType<typeof cheerio.load>;

export function extractContent(
  html: string,
  url: string
): ExtractedContent | null {
  const $ = cheerio.load(html);

  // Extract headline - try multiple strategies
  const headline = extractHeadline($);
  if (!headline) {
    return null;
  }

  // Extract main content
  const content = extractMainContent($);
  if (!content || content.length < 100) {
    return null;
  }

  // Extract metadata
  const author = extractAuthor($);
  const publishDate = extractPublishDate($);
  const sourceName = extractSourceName($, url);

  return {
    headline,
    content,
    author,
    publishDate,
    sourceName,
    sourceUrl: new URL(url).origin,
  };
}

function extractHeadline($: CheerioDoc): string | null {
  // Try multiple headline selectors in order of priority
  const selectors = [
    'h1.headline',
    'h1.article-headline',
    'h1.entry-title',
    'h1.post-title',
    'h1[class*="headline"]',
    'h1[class*="title"]',
    'article h1',
    '.article-header h1',
    '.story-headline',
    'meta[property="og:title"]',
    'meta[name="twitter:title"]',
    'title',
    'h1',
  ];

  for (const selector of selectors) {
    if (selector.startsWith('meta')) {
      const content = $(selector).attr('content');
      if (content && content.length > 10) {
        return cleanText(content);
      }
    } else {
      const element = $(selector).first();
      if (element.length && element.text().trim().length > 10) {
        return cleanText(element.text());
      }
    }
  }

  return null;
}

function extractMainContent($: CheerioDoc): string | null {
  // Remove unwanted elements
  $(
    'script, style, nav, header, footer, aside, .advertisement, .ad, .social-share, .related-articles, .comments, .sidebar, [class*="newsletter"], [class*="subscribe"]'
  ).remove();

  // Try multiple content selectors
  const contentSelectors = [
    'article .article-body',
    'article .story-body',
    'article .entry-content',
    'article .post-content',
    '.article-content',
    '.story-content',
    '.entry-content',
    '.post-content',
    '[class*="article-body"]',
    '[class*="story-body"]',
    '[itemprop="articleBody"]',
    'article',
    'main',
    '.content',
  ];

  for (const selector of contentSelectors) {
    const element = $(selector).first();
    if (element.length) {
      // Get all paragraphs
      const paragraphs = element.find('p');
      if (paragraphs.length > 0) {
        const text = paragraphs
          .map((_, el) => $(el).text().trim())
          .get()
          .filter((p) => p.length > 50) // Filter out short paragraphs
          .join('\n\n');

        if (text.length > 200) {
          return cleanText(text);
        }
      }

      // Fall back to all text
      const text = element.text().trim();
      if (text.length > 200) {
        return cleanText(text);
      }
    }
  }

  // Last resort: get all paragraph text
  const allParagraphs = $('p')
    .map((_, el) => $(el).text().trim())
    .get()
    .filter((p) => p.length > 50)
    .join('\n\n');

  return allParagraphs.length > 200 ? cleanText(allParagraphs) : null;
}

function extractAuthor($: CheerioDoc): string | undefined {
  const authorSelectors = [
    'meta[name="author"]',
    'meta[property="article:author"]',
    '[rel="author"]',
    '.author-name',
    '.byline',
    '.author',
    '[class*="author"]',
    '[itemprop="author"]',
  ];

  for (const selector of authorSelectors) {
    if (selector.startsWith('meta')) {
      const content = $(selector).attr('content');
      if (content) return cleanText(content);
    } else {
      const element = $(selector).first();
      if (element.length) {
        const text = element.text().trim();
        if (text && text.length < 100) {
          return cleanText(text.replace(/^by\s+/i, ''));
        }
      }
    }
  }

  return undefined;
}

function extractPublishDate($: CheerioDoc): string | undefined {
  const dateSelectors = [
    'meta[property="article:published_time"]',
    'meta[name="publish-date"]',
    'meta[name="date"]',
    'time[datetime]',
    '.publish-date',
    '.article-date',
    '[class*="date"]',
    '[itemprop="datePublished"]',
  ];

  for (const selector of dateSelectors) {
    if (selector.startsWith('meta')) {
      const content = $(selector).attr('content');
      if (content) {
        try {
          return new Date(content).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
        } catch {
          return content;
        }
      }
    } else if (selector === 'time[datetime]') {
      const datetime = $('time[datetime]').first().attr('datetime');
      if (datetime) {
        try {
          return new Date(datetime).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
        } catch {
          return datetime;
        }
      }
    } else {
      const element = $(selector).first();
      if (element.length) {
        const text = element.text().trim();
        if (text && text.length < 50) {
          return text;
        }
      }
    }
  }

  return undefined;
}


function extractSourceName(
  $: CheerioDoc,
  url: string
): string {
  // Try meta tags first
  const ogSiteName = $('meta[property="og:site_name"]').attr('content');
  if (ogSiteName) return normalizeSourceName(ogSiteName);

  const publisher = $('meta[name="publisher"]').attr('content');
  if (publisher) return normalizeSourceName(publisher);

  // Fall back to URL-based detection
  return getSourceName(url);
}

function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
}

import type { SummarizedArticle, GeneratedBrief } from '@/types';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Format per style guide:
 * emoji <strong>Kicker:</strong> Summary text. 📌 Source: <a href="url">Source Name</a>
 */
export function formatBriefAsHtml(articles: SummarizedArticle[]): string {
  if (articles.length === 0) {
    return '';
  }

  const articleHtml = articles
    .map(
      (article) =>
        `${article.emoji} <strong>${escapeHtml(article.kicker)}</strong> ${escapeHtml(article.summary)} 📌 Source: <a href="${escapeHtml(article.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(article.sourceName)}</a>`
    )
    .join('\n\n');

  return articleHtml;
}

/**
 * Format for newsletter - one-line version with complete sentences
 * No individual source links - just source name
 * Expects postUrl to be added separately at the end
 */
export function formatBriefForNewsletter(articles: SummarizedArticle[], postUrl?: string): string {
  if (articles.length === 0) {
    return '';
  }

  const articleLines = articles
    .map((article) => {
      return `${article.emoji} <strong>${escapeHtml(article.kicker)}</strong> ${escapeHtml(article.summary)} 📌 <em>${escapeHtml(article.sourceName)}</em>`;
    })
    .join('<br>\n');

  // Add "Learn more..." link at the bottom if postUrl is provided
  if (postUrl) {
    return `${articleLines}<br>\n<br>\n<a href="${escapeHtml(postUrl)}">Learn more...</a>`;
  }

  return articleLines;
}

export function formatBriefAsPlaintext(articles: SummarizedArticle[]): string {
  if (articles.length === 0) {
    return '';
  }

  return articles
    .map(
      (article) =>
        `${article.emoji} ${article.kicker} ${article.summary} 📌 Source: ${article.sourceName} (${article.url})`
    )
    .join('\n\n');
}

export function formatBriefForNewsletterPlaintext(articles: SummarizedArticle[], postUrl?: string): string {
  if (articles.length === 0) {
    return '';
  }

  const articleLines = articles
    .map((article) => {
      return `${article.emoji} ${article.kicker} ${article.summary} 📌 ${article.sourceName}`;
    })
    .join('\n');

  // Add "Learn more..." link at the bottom if postUrl is provided
  if (postUrl) {
    return `${articleLines}\n\nLearn more... ${postUrl}`;
  }

  return articleLines;
}

export function generateBrief(articles: SummarizedArticle[]): GeneratedBrief {
  return {
    html: formatBriefAsHtml(articles),
    plaintext: formatBriefAsPlaintext(articles),
    newsletterHtml: formatBriefForNewsletter(articles),
    newsletterPlaintext: formatBriefForNewsletterPlaintext(articles),
    articles,
  };
}

// Format for WordPress with overview section
export function formatBriefForWordPress(
  articles: SummarizedArticle[],
  options?: {
    includeOverview?: boolean;
    includeNewsletterSignup?: boolean;
    headline?: string;
    deck?: string;
  }
): string {
  const parts: string[] = [];

  // Add headline placeholder if not provided
  if (options?.headline) {
    parts.push(`<h1>${escapeHtml(options.headline)}</h1>`);
  } else {
    parts.push(`<h1>[HEADLINE - Editor to fill in]</h1>`);
  }

  // Add deck/standfirst placeholder
  if (options?.deck) {
    parts.push(`<p class="deck">${escapeHtml(options.deck)}</p>`);
  } else {
    parts.push(`<p class="deck">[DECK/STANDFIRST - Editor to fill in]</p>`);
  }

  // Add overview bullets if requested
  if (options?.includeOverview && articles.length > 0) {
    parts.push(`<h3>Overview</h3>`);
    parts.push(`<ul>`);
    articles.slice(0, 5).forEach((article) => {
      parts.push(`<li>${escapeHtml(article.kicker)} ${escapeHtml(article.summary.slice(0, 80))}...</li>`);
    });
    parts.push(`</ul>`);
  }

  // Add newsletter signup placeholder
  if (options?.includeNewsletterSignup) {
    parts.push(`
<!-- Newsletter Signup -->
<div class="newsletter-embed">
[Newsletter signup widget HTML]
</div>
`);
  }

  // Add article summaries in new format
  parts.push(`<h3>What we're reading</h3>`);
  articles.forEach((article) => {
    parts.push(
      `<p>${article.emoji} <strong>${escapeHtml(article.kicker)}</strong> ${escapeHtml(article.summary)} 📌 Source: <a href="${escapeHtml(article.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(article.sourceName)}</a></p>`
    );
  });

  return parts.join('\n\n');
}

import { SOURCE_NAME_FIXES } from '@/lib/constants/source-names';

// Known paywalled sources
const PAYWALLED_DOMAINS = [
  'detroitnews.com',
  'freep.com',
  'crainsdetroit.com',
  'mlive.com',
  'nytimes.com',
  'wsj.com',
  'washingtonpost.com',
  'bloomberg.com',
  'ft.com',
  'economist.com',
  'theathletic.com',
];

// Source name mappings for common sources
const SOURCE_NAME_MAP: Record<string, string> = {
  // Michigan sources
  'detroitnews.com': 'The Detroit News',
  'freep.com': 'Detroit Free Press',
  'crainsdetroit.com': "Crain's Detroit Business",
  'mlive.com': 'MLive',
  'clickondetroit.com': 'WDIV',
  'wxyz.com': 'WXYZ',
  'michiganradio.org': 'Michigan Radio',
  'bridgemi.com': 'Bridge Michigan',
  'planetdetroit.org': 'Planet Detroit',
  'metrotimes.com': 'Metro Times',
  'deadlinedetroit.com': 'Deadline Detroit',
  'secondwavemedia.com': 'Second Wave',
  'michiganadvance.com': 'Michigan Advance',
  'michigandaily.com': 'The Michigan Daily',

  // National news
  'axios.com': 'Axios',
  'npr.org': 'NPR',
  'apnews.com': 'Associated Press',
  'reuters.com': 'Reuters',
  'nytimes.com': 'The New York Times',
  'washingtonpost.com': 'The Washington Post',
  'wsj.com': 'The Wall Street Journal',
  'usatoday.com': 'USA Today',
  'politico.com': 'Politico',
  'thehill.com': 'The Hill',

  // TV networks
  'cbsnews.com': 'CBS News',
  'cbs.com': 'CBS',
  'nbcnews.com': 'NBC News',
  'nbc.com': 'NBC',
  'abcnews.go.com': 'ABC News',
  'abc.com': 'ABC',
  'foxnews.com': 'Fox News',
  'cnn.com': 'CNN',
  'msnbc.com': 'MSNBC',
  'pbs.org': 'PBS',

  // Environment/Energy
  'eenews.net': 'E&E News',
  'insideclimatenews.org': 'Inside Climate News',
  'grist.org': 'Grist',
  'theenergymix.com': 'The Energy Mix',
  'canarymedia.com': 'Canary Media',
  'yaleclimateconnections.org': 'Yale Climate Connections',

  // Business
  'bloomberg.com': 'Bloomberg',
  'ft.com': 'Financial Times',
  'economist.com': 'The Economist',
  'forbes.com': 'Forbes',
  'businessinsider.com': 'Business Insider',

  // Other
  'theguardian.com': 'The Guardian',
  'bbc.com': 'BBC',
  'bbc.co.uk': 'BBC',
  'vox.com': 'Vox',
  'theatlantic.com': 'The Atlantic',
  'propublica.org': 'ProPublica',
  'wired.com': 'Wired',
  'arstechnica.com': 'Ars Technica',
  'huffpost.com': 'HuffPost',
  'buzzfeednews.com': 'BuzzFeed News',
  'slate.com': 'Slate',
  'salon.com': 'Salon',
};

export interface UrlValidationResult {
  valid: boolean;
  error?: string;
}

export function validateUrl(url: string): UrlValidationResult {
  try {
    const parsed = new URL(url);

    // Only allow http/https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'Only HTTP/HTTPS URLs are allowed' };
    }

    // Block localhost/internal IPs (SSRF prevention)
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname.startsWith('127.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.endsWith('.local')
    ) {
      return { valid: false, error: 'Internal URLs are not allowed' };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

export function isPaywalledSource(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase().replace('www.', '');
    return PAYWALLED_DOMAINS.some((domain) => hostname.includes(domain));
  } catch {
    return false;
  }
}

// Use shared source name fixes for special capitalization
const SPECIAL_CAPS = SOURCE_NAME_FIXES;

export function getSourceName(url: string): string {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase().replace('www.', '');

    // Check exact matches first
    for (const [domain, name] of Object.entries(SOURCE_NAME_MAP)) {
      if (hostname === domain || hostname.endsWith('.' + domain)) {
        return name;
      }
    }

    // Also check if any domain is contained in hostname (for subdomains)
    for (const [domain, name] of Object.entries(SOURCE_NAME_MAP)) {
      if (hostname.includes(domain.split('.')[0])) {
        return name;
      }
    }

    // Fall back to cleaned hostname with proper capitalization
    const baseName = hostname.split('.')[0];

    // Check special capitalization rules
    if (SPECIAL_CAPS[baseName]) {
      return SPECIAL_CAPS[baseName];
    }

    // Default: capitalize first letter
    return baseName.charAt(0).toUpperCase() + baseName.slice(1);
  } catch {
    return 'Unknown Source';
  }
}

export function parseUrlList(input: string): string[] {
  const lines = input.split('\n');
  const urls: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) continue;

    // Check if line is a URL
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      urls.push(trimmed);
    }
  }

  return urls;
}

export function generateId(): string {
  return `article-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

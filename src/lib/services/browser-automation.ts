import puppeteer, { Browser, Page } from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { normalizeSourceName } from '@/lib/constants/source-names';
import { loadCustomSites, type CustomSiteConfig } from './custom-sites';

// Directory to store session cookies
const SESSIONS_DIR = path.join(process.cwd(), '.sessions');

// Site configurations
interface SiteConfig {
  name: string;
  domains: string[];
  loginUrl: string;
  loginSuccessIndicator: string; // Selector or URL pattern that indicates logged in
  articleContentSelector: string;
  headlineSelector: string;
}

const SITE_CONFIGS: Record<string, SiteConfig> = {
  gannett: {
    name: 'Gannett (Free Press/Detroit News)',
    domains: ['freep.com', 'detroitnews.com'],
    loginUrl: 'https://account.freep.com/',
    loginSuccessIndicator: '.logged-in, [class*="account"], [data-testid="account"]',
    articleContentSelector: '.gnt_ar_b, .article-body, [class*="article-body"], .story-body',
    headlineSelector: 'h1.gnt_ar_hl, h1[class*="headline"], .article-headline h1',
  },
  crains: {
    name: "Crain's Detroit Business",
    domains: ['crainsdetroit.com'],
    loginUrl: 'https://www.crainsdetroit.com/login',
    loginSuccessIndicator: '.logged-in, [class*="logged"], .user-menu',
    articleContentSelector: '.article-body, .field-body, [class*="article-body"], .story-content',
    headlineSelector: 'h1.headline, h1[class*="headline"], .article-title h1',
  },
  mlive: {
    name: 'MLive',
    domains: ['mlive.com'],
    loginUrl: 'https://www.mlive.com/login/',
    loginSuccessIndicator: '.logged-in, [class*="logged"], .user-menu, [data-user-logged-in]',
    articleContentSelector: '.entry-content, .article-body, [class*="article-body"], .rich-text, [itemprop="articleBody"]',
    headlineSelector: 'h1.entry-title, h1[itemprop="headline"], h1[class*="headline"], h1[class*="title"], .article-header h1, header h1, h1',
  },
};

// Singleton browser instance
let browserInstance: Browser | null = null;

// Default selectors for custom sites
const DEFAULT_CONTENT_SELECTOR = 'article, .article-body, .entry-content, .post-content, .story-body, [itemprop="articleBody"], main';
const DEFAULT_HEADLINE_SELECTOR = 'h1, .headline, .article-title, [itemprop="headline"]';
const DEFAULT_LOGIN_SUCCESS_INDICATOR = '.logged-in, [class*="logged"], .user-menu, [class*="account"], [data-user]';

// Convert a custom site config to a full SiteConfig
function customToSiteConfig(custom: CustomSiteConfig): SiteConfig {
  return {
    name: custom.name,
    domains: custom.domains,
    loginUrl: custom.loginUrl,
    loginSuccessIndicator: DEFAULT_LOGIN_SUCCESS_INDICATOR,
    articleContentSelector: DEFAULT_CONTENT_SELECTOR,
    headlineSelector: DEFAULT_HEADLINE_SELECTOR,
  };
}

// Get all site configs (built-in + custom)
function getAllSiteConfigs(): Record<string, SiteConfig> {
  const customSites = loadCustomSites();
  const customConfigs: Record<string, SiteConfig> = {};

  for (const [key, config] of Object.entries(customSites)) {
    customConfigs[key] = customToSiteConfig(config);
  }

  return { ...SITE_CONFIGS, ...customConfigs };
}

// Get site config for a URL
function getSiteConfig(url: string): { key: string; config: SiteConfig } | null {
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    const allConfigs = getAllSiteConfigs();

    for (const [key, config] of Object.entries(allConfigs)) {
      if (config.domains.some(domain => hostname.includes(domain))) {
        return { key, config };
      }
    }
    return null;
  } catch {
    return null;
  }
}

// Ensure sessions directory exists
function ensureSessionsDir() {
  if (!fs.existsSync(SESSIONS_DIR)) {
    fs.mkdirSync(SESSIONS_DIR, { recursive: true });
  }
}

// Get cookie file path for a site
function getCookieFilePath(siteKey: string): string {
  ensureSessionsDir();
  return path.join(SESSIONS_DIR, `${siteKey}-cookies.json`);
}

// Save cookies for a site
async function saveCookies(page: Page, siteKey: string): Promise<void> {
  const cookies = await page.cookies();
  const cookiePath = getCookieFilePath(siteKey);
  fs.writeFileSync(cookiePath, JSON.stringify(cookies, null, 2));
  console.log(`Saved ${cookies.length} cookies for ${siteKey}`);
}

// Load cookies for a site
async function loadCookies(page: Page, siteKey: string): Promise<boolean> {
  const cookiePath = getCookieFilePath(siteKey);
  if (!fs.existsSync(cookiePath)) {
    return false;
  }

  try {
    const cookieData = fs.readFileSync(cookiePath, 'utf-8');
    const cookies = JSON.parse(cookieData);
    await page.setCookie(...cookies);
    console.log(`Loaded ${cookies.length} cookies for ${siteKey}`);
    return true;
  } catch (error) {
    console.error(`Failed to load cookies for ${siteKey}:`, error);
    return false;
  }
}

// Check if cookies exist for a site
export function hasSessionFor(siteKey: string): boolean {
  const cookiePath = getCookieFilePath(siteKey);
  return fs.existsSync(cookiePath);
}

// Get browser instance
async function getBrowser(headless: boolean = true): Promise<Browser> {
  if (browserInstance && browserInstance.connected) {
    return browserInstance;
  }

  browserInstance = await puppeteer.launch({
    headless,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--window-size=1280,900',
    ],
    defaultViewport: {
      width: 1280,
      height: 900,
    },
  });

  return browserInstance;
}

// Close browser
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

// Open a browser window for manual login
export async function openLoginWindow(siteKey: string): Promise<{ success: boolean; message: string }> {
  const allConfigs = getAllSiteConfigs();
  const config = allConfigs[siteKey];
  if (!config) {
    return { success: false, message: `Unknown site: ${siteKey}` };
  }

  try {
    // Launch visible browser
    const browser = await getBrowser(false); // headless: false
    const page = await browser.newPage();

    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Navigate to login page
    console.log(`Opening login page for ${config.name}...`);
    await page.goto(config.loginUrl, { waitUntil: 'networkidle2', timeout: 60000 });

    // Wait for user to log in (check periodically for login success indicator)
    console.log('Please log in manually in the browser window...');
    console.log('The window will close automatically once login is detected.');

    const maxWaitTime = 5 * 60 * 1000; // 5 minutes
    const checkInterval = 2000; // Check every 2 seconds
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      try {
        // Check if logged in by looking for success indicator or URL change
        const isLoggedIn = await page.evaluate((selector) => {
          return document.querySelector(selector) !== null;
        }, config.loginSuccessIndicator);

        // Also check if we've navigated away from the login page
        const currentUrl = page.url();
        const onLoginPage = currentUrl.includes('login') || currentUrl.includes('signin') || currentUrl.includes('account');

        if (isLoggedIn || (!onLoginPage && !currentUrl.includes(config.loginUrl))) {
          // Save cookies
          await saveCookies(page, siteKey);
          await page.close();

          // Keep browser open for reuse, but close if no other pages
          const pages = await browser.pages();
          if (pages.length <= 1) {
            await closeBrowser();
          }

          return {
            success: true,
            message: `Successfully logged into ${config.name}. Session saved.`
          };
        }
      } catch {
        // Page might be navigating, continue waiting
      }

      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }

    // Timeout - save whatever cookies we have anyway
    await saveCookies(page, siteKey);
    await page.close();

    return {
      success: false,
      message: `Login timed out after 5 minutes. Any partial session has been saved.`
    };

  } catch (error) {
    console.error('Login window error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to open login window'
    };
  }
}

// Clear saved session for a site
export function clearSession(siteKey: string): boolean {
  const cookiePath = getCookieFilePath(siteKey);
  if (fs.existsSync(cookiePath)) {
    fs.unlinkSync(cookiePath);
    return true;
  }
  return false;
}

// Get list of all sessions
export function getSessions(): Array<{ siteKey: string; name: string; hasSession: boolean }> {
  return Object.entries(SITE_CONFIGS).map(([key, config]) => ({
    siteKey: key,
    name: config.name,
    hasSession: hasSessionFor(key),
  }));
}

export interface BrowserFetchResult {
  success: boolean;
  html?: string;
  headline?: string;
  content?: string;
  sourceName?: string;
  error?: string;
  needsLogin?: boolean;
}

// Fetch article using saved session
export async function fetchWithBrowser(url: string): Promise<BrowserFetchResult> {
  const siteInfo = getSiteConfig(url);

  if (!siteInfo) {
    return {
      success: false,
      error: 'No configuration found for this site.',
    };
  }

  const { key: siteKey, config } = siteInfo;

  // Check if we have a saved session
  if (!hasSessionFor(siteKey)) {
    return {
      success: false,
      needsLogin: true,
      error: `No saved session for ${config.name}. Please log in first using the Login button.`,
    };
  }

  try {
    const browser = await getBrowser(true); // headless: true
    const page = await browser.newPage();

    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Load saved cookies
    await loadCookies(page, siteKey);

    // Navigate to article
    console.log(`Fetching article: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if we're still logged in (not redirected to login page)
    const currentUrl = page.url();
    if (currentUrl.includes('login') || currentUrl.includes('signin') || currentUrl.includes('subscribe')) {
      await page.close();
      return {
        success: false,
        needsLogin: true,
        error: `Session expired for ${config.name}. Please log in again.`,
      };
    }

    // Extract content
    const result = await page.evaluate((contentSelector: string, headlineSelector: string) => {
      // Get headline - try multiple approaches
      let headline = '';

      // First try the configured selector
      const headlineEl = document.querySelector(headlineSelector);
      if (headlineEl?.textContent?.trim()) {
        headline = headlineEl.textContent.trim();
      }

      // Fallback: try Open Graph title (very reliable)
      if (!headline) {
        const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
        if (ogTitle) headline = ogTitle;
      }

      // Fallback: try Twitter title
      if (!headline) {
        const twitterTitle = document.querySelector('meta[name="twitter:title"]')?.getAttribute('content');
        if (twitterTitle) headline = twitterTitle;
      }

      // Fallback: try page title (strip site name suffix)
      if (!headline) {
        const pageTitle = document.title;
        if (pageTitle) {
          // Remove common suffixes like "| MLive.com" or "- Detroit Free Press"
          headline = pageTitle.replace(/\s*[|\-–]\s*[^|\-–]+$/, '').trim();
        }
      }

      // Fallback: try any h1
      if (!headline) {
        const anyH1 = document.querySelector('h1');
        if (anyH1?.textContent?.trim()) {
          headline = anyH1.textContent.trim();
        }
      }

      // Get article content
      let content = '';
      const contentEl = document.querySelector(contentSelector);

      if (contentEl) {
        const paragraphs = contentEl.querySelectorAll('p');
        content = Array.from(paragraphs)
          .map(p => p.textContent?.trim())
          .filter(text => text && text.length > 20)
          .join('\n\n');
      }

      // Fallback: get all article paragraphs
      if (!content || content.length < 200) {
        const allParagraphs = document.querySelectorAll('article p, .article p, [class*="article"] p, .story-body p');
        content = Array.from(allParagraphs)
          .map(p => p.textContent?.trim())
          .filter(text => text && text.length > 20)
          .join('\n\n');
      }

      // Get source name
      const ogSiteName = document.querySelector('meta[property="og:site_name"]')?.getAttribute('content');
      const sourceName = ogSiteName || '';

      return { headline, content, sourceName };
    }, config.articleContentSelector, config.headlineSelector);

    const html = await page.content();
    await page.close();

    // Update saved cookies (in case they were refreshed)
    const pages = await browser.pages();
    if (pages.length > 0) {
      await saveCookies(pages[0], siteKey);
    }

    if (!result.content || result.content.length < 100) {
      // Check if content is too short (likely still paywalled)
      return {
        success: false,
        html,
        needsLogin: true,
        error: 'Could not extract full article content. Session may have expired - please log in again.',
      };
    }

    // Normalize source name (fix capitalization like mlive -> MLive)
    const sourceName = normalizeSourceName(result.sourceName || config.name);

    return {
      success: true,
      html,
      headline: result.headline,
      content: result.content,
      sourceName,
    };

  } catch (error) {
    console.error('Browser fetch error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown browser automation error',
    };
  }
}

// Check if a URL is supported for browser automation
export function isBrowserAutomationSupported(url: string): boolean {
  return getSiteConfig(url) !== null;
}

// Check if we can fetch this URL (has session)
export function isBrowserAutomationAvailable(url: string): boolean {
  const siteInfo = getSiteConfig(url);
  if (!siteInfo) return false;
  return hasSessionFor(siteInfo.key);
}

// Get supported sites info (built-in + custom)
export function getSupportedSites(): Array<{ key: string; name: string; domains: string[]; hasSession: boolean; isCustom: boolean }> {
  const allConfigs = getAllSiteConfigs();
  const customSiteKeys = new Set(Object.keys(loadCustomSites()));

  return Object.entries(allConfigs).map(([key, config]) => ({
    key,
    name: config.name,
    domains: config.domains,
    hasSession: hasSessionFor(key),
    isCustom: customSiteKeys.has(key),
  }));
}
